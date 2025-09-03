import { AidError } from './parser.js';
import { webcrypto as nodeWebcrypto } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { timingSafeEqual as nodeTimingSafeEqual } from 'node:crypto';

// Type-safe interface for global crypto with timingSafeEqual
interface CryptoWithTimingSafeEqual {
  timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean;
}

function timingSafeEqual(a: string | Uint8Array, b: string | Uint8Array): boolean {
  const globalCrypto = (globalThis as unknown as { crypto?: CryptoWithTimingSafeEqual }).crypto;
  if (typeof globalCrypto?.timingSafeEqual === 'function') {
    const enc = new TextEncoder();
    const aEncoded = typeof a === 'string' ? enc.encode(a) : a;
    const bEncoded = typeof b === 'string' ? enc.encode(b) : b;
    return globalCrypto.timingSafeEqual(aEncoded, bEncoded);
  }
  // Fallback for environments without native support, including browsers.
  const aBuf = Buffer.from(typeof a === 'string' ? a : new Uint8Array(a.buffer));
  const bBuf = Buffer.from(typeof b === 'string' ? b : new Uint8Array(b.buffer));

  if (aBuf.length !== bBuf.length) {
    // For string comparisons, we must ensure they are of equal length.
    // In this PKA context, `keyid` and `alg` have predictable lengths,
    // so length differences don't leak critical info. We still check
    // b against itself to keep the timing consistent.
    nodeTimingSafeEqual(bBuf, bBuf);
    return false;
  }
  return nodeTimingSafeEqual(aBuf, bBuf);
}

function asciiLowerCase(s: string): string {
  let res = '';
  for (let i = 0; i < s.length; i++) {
    const charCode = s.charCodeAt(i);
    // ASCII 'A' is 65, 'Z' is 90
    if (charCode >= 65 && charCode <= 90) {
      res += String.fromCharCode(charCode + 32);
    } else {
      res += s[i];
    }
  }
  return res;
}

// Minimal types to avoid DOM deps
interface HeaderLike {
  get(name: string): string | null | undefined;
}

interface SubtleLike {
  importKey: (
    format: 'raw',
    keyData: ArrayBuffer | Uint8Array,
    algorithm: { name: 'Ed25519' },
    extractable: false,
    keyUsages: ['verify'],
  ) => Promise<unknown>;
  verify: (
    algorithm: 'Ed25519',
    key: unknown,
    signature: ArrayBufferView,
    data: ArrayBufferView,
  ) => Promise<boolean>;
}

interface CryptoLike {
  getRandomValues: (array: Uint8Array) => Uint8Array;
  subtle: SubtleLike;
}

interface FetchResponse {
  ok: boolean;
  status: number;
  headers: HeaderLike;
  text(): Promise<string>;
}

type FetchLike = (
  url: string,
  init: {
    method?: string;
    headers?: Record<string, string>;
    redirect?: 'error' | 'follow' | 'manual';
    signal?: AbortSignal;
  },
) => Promise<FetchResponse>;

// Base58btc alphabet
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const B58_MAP = new Map<string, number>(Array.from(B58).map((c, i) => [c, i]));

function base58Decode(s: string): Uint8Array {
  if (!s) return new Uint8Array();
  let zeros = 0;
  while (zeros < s.length && s[zeros] === '1') zeros++;
  const size = (((s.length - zeros) * Math.log(58)) / Math.log(256) + 1) | 0;
  const b = new Uint8Array(size);
  for (let i = zeros; i < s.length; i++) {
    const c = s[i];
    const val = B58_MAP.get(c);
    if (val === undefined) throw new AidError('ERR_SECURITY', 'Invalid base58 character');
    let carry = val;
    for (let j = size - 1; j >= 0; j--) {
      carry += 58 * b[j];
      b[j] = carry & 0xff;
      carry >>= 8;
    }
  }
  // Skip leading zeros in b
  let it = 0;
  while (it < b.length && b[it] === 0) it++;
  const out = new Uint8Array(zeros + (b.length - it));
  out.fill(0, 0, zeros);
  out.set(b.subarray(it), zeros);
  return out;
}

function multibaseDecode(input: string): Uint8Array {
  if (!input) throw new AidError('ERR_SECURITY', 'Empty PKA');
  const prefix = input[0];
  const payload = input.slice(1);
  if (prefix === 'z') {
    return base58Decode(payload);
  }
  throw new AidError('ERR_SECURITY', 'Unsupported multibase prefix');
}

function parseSignatureHeaders(headers: HeaderLike): {
  covered: string[];
  created: number;
  keyid: string; // normalized (no quotes)
  keyidRaw: string; // as present in Signature-Input (may include quotes)
  alg: string;
  signature: Uint8Array;
  responseDate: string | null;
} {
  const sigInput = headers.get('Signature-Input') || headers.get('signature-input');
  const sig = headers.get('Signature') || headers.get('signature');
  if (!sigInput || !sig) throw new AidError('ERR_SECURITY', 'Missing signature headers');

  // Extract covered fields inside parentheses after sig=(...)
  const inside = /sig=\(\s*([^)]*?)\s*\)/i.exec(sigInput);
  if (!inside) throw new AidError('ERR_SECURITY', 'Invalid Signature-Input');
  const covered: string[] = [];
  const tokenRe = /"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(inside[1])) !== null) covered.push(m[1]);
  if (covered.length === 0) throw new AidError('ERR_SECURITY', 'Invalid Signature-Input');
  const required = ['aid-challenge', '@method', '@target-uri', 'host', 'date'];

  if (covered.length !== required.length) {
    throw new AidError('ERR_SECURITY', 'Signature-Input must cover required fields');
  }

  const coveredLower = covered.map(asciiLowerCase).sort();
  const requiredSorted = [...required].sort();

  let areEqual = true;
  for (let i = 0; i < requiredSorted.length; i++) {
    if (!timingSafeEqual(coveredLower[i], requiredSorted[i])) {
      areEqual = false;
      // Do not break early
    }
  }
  if (!areEqual) {
    throw new AidError('ERR_SECURITY', 'Signature-Input must cover required fields');
  }

  // Extract parameters regardless of order
  const createdMatch = /(?:^|;)\s*created=(\d+)/i.exec(sigInput);
  const keyidMatch = /(?:^|;)\s*keyid=([^;\s]+)/i.exec(sigInput);
  const algMatch = /(?:^|;)\s*alg="([^"]+)"/i.exec(sigInput);
  if (!createdMatch || !keyidMatch || !algMatch)
    throw new AidError('ERR_SECURITY', 'Invalid Signature-Input');
  const created = Number.parseInt(createdMatch[1], 10);
  const keyidRaw = keyidMatch[1];
  const keyid = keyidRaw.replace(/^"(.+)"$/, '$1');
  const alg = asciiLowerCase(algMatch[1]);

  // Extract signature value from Signature header
  const sigMatch = /sig\s*=\s*:\s*([^:]+)\s*:/i.exec(sig);
  if (!sigMatch) throw new AidError('ERR_SECURITY', 'Invalid Signature header');
  const signature = Uint8Array.from(Buffer.from(sigMatch[1], 'base64'));
  const responseDate = (headers.get('Date') || headers.get('date') || null) as string | null;
  return { covered, created, keyid, keyidRaw, alg, signature, responseDate };
}

function buildSignatureBase(
  covered: string[],
  params: { created: number; keyid: string; alg: string },
  ctx: {
    method: string;
    targetUri: string;
    host: string;
    date: string;
    challenge: string;
  },
): Uint8Array {
  const lines: string[] = [];
  for (const item of covered) {
    const lower = asciiLowerCase(item);
    let appended = false;
    if (timingSafeEqual(lower, 'aid-challenge')) {
      lines.push(`"AID-Challenge": ${ctx.challenge}`);
      appended = true;
    }
    if (timingSafeEqual(lower, '@method')) {
      lines.push(`"@method": ${ctx.method}`);
      appended = true;
    }
    if (timingSafeEqual(lower, '@target-uri')) {
      lines.push(`"@target-uri": ${ctx.targetUri}`);
      appended = true;
    }
    if (timingSafeEqual(lower, 'host')) {
      lines.push(`"host": ${ctx.host}`);
      appended = true;
    }
    if (timingSafeEqual(lower, 'date')) {
      lines.push(`"date": ${ctx.date}`);
      appended = true;
    }
    if (!appended) {
      throw new AidError('ERR_SECURITY', `Unsupported covered field: ${item}`);
    }
  }
  const quoted = covered.map((c) => `"${c}"`).join(' ');
  const paramsStr = `(${quoted});created=${params.created};keyid=${params.keyid};alg="${params.alg}"`;
  lines.push(`"@signature-params": ${paramsStr}`);
  return new TextEncoder().encode(lines.join('\n'));
}

export async function performPKAHandshake(uri: string, pka: string, kid: string): Promise<void> {
  if (!kid) throw new AidError('ERR_SECURITY', 'Missing kid for PKA');
  const u = new URL(uri);
  const cryptoImpl: CryptoLike =
    (globalThis as unknown as { crypto?: CryptoLike }).crypto ??
    (nodeWebcrypto as unknown as CryptoLike);
  const nonce = cryptoImpl.getRandomValues(new Uint8Array(32));
  const challenge = Buffer.from(nonce).toString('base64url');
  const date = new Date().toUTCString();
  const fetchImpl = (globalThis as unknown as { fetch?: FetchLike }).fetch;
  if (typeof fetchImpl !== 'function') {
    throw new AidError('ERR_SECURITY', 'fetch is not available in this environment');
  }
  const res = await fetchImpl(uri, {
    method: 'GET',
    headers: {
      'AID-Challenge': challenge,
      Date: date,
    },
    redirect: 'error',
  });
  if (!res.ok) throw new AidError('ERR_SECURITY', `Handshake HTTP ${res.status}`);

  const { covered, created, keyid, keyidRaw, alg, signature, responseDate } = parseSignatureHeaders(
    res.headers,
  );
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - created) > 300)
    throw new AidError('ERR_SECURITY', 'Signature created timestamp outside acceptance window');
  if (responseDate) {
    const parsed = Math.floor(new Date(responseDate).getTime() / 1000);
    if (!Number.isFinite(parsed)) throw new AidError('ERR_SECURITY', 'Invalid Date header');
    if (Math.abs(now - parsed) > 300)
      throw new AidError('ERR_SECURITY', 'HTTP Date header outside acceptance window');
  }
  if (!timingSafeEqual(keyid, kid)) throw new AidError('ERR_SECURITY', 'Signature keyid mismatch');
  if (!timingSafeEqual(alg, 'ed25519'))
    throw new AidError('ERR_SECURITY', 'Unsupported signature algorithm');

  const host = u.host;
  const base = buildSignatureBase(
    covered,
    { created, keyid: keyidRaw, alg },
    {
      method: 'GET',
      targetUri: uri,
      host,
      date: responseDate ?? date,
      challenge,
    },
  );
  const pub = multibaseDecode(pka);
  if (pub.length !== 32) throw new AidError('ERR_SECURITY', 'Invalid PKA length');

  const key = await cryptoImpl.subtle.importKey('raw', pub, { name: 'Ed25519' }, false, ['verify']);
  const ok = await cryptoImpl.subtle.verify('Ed25519', key, signature, base);
  if (!ok) throw new AidError('ERR_SECURITY', 'PKA signature verification failed');
}
