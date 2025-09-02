import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { webcrypto as nodeWebcrypto } from 'node:crypto';

function base58btcEncode(bytes: Uint8Array): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  const size = Math.ceil((bytes.length * Math.log(256)) / Math.log(58)) + 1;
  const b = new Uint8Array(size);
  let length = 0;
  for (let i = zeros; i < bytes.length; i++) {
    let carry = bytes[i];
    let j = size - 1;
    while (carry !== 0 || j >= size - length) {
      carry += 256 * b[j];
      b[j] = carry % 58;
      carry = Math.floor(carry / 58);
      j--;
    }
    length = size - 1 - j;
  }
  let it = size - length;
  while (it < size && b[it] === 0) it++;
  let out = '1'.repeat(zeros);
  for (let i = it; i < size; i++) out += ALPHABET[b[i]];
  return out;
}

export async function generateEd25519(
  label?: string,
  outDir?: string,
  printPrivate = false,
): Promise<{ publicKey: string; privatePath: string }> {
  const kp = await nodeWebcrypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const rawPub = new Uint8Array(await nodeWebcrypto.subtle.exportKey('raw', kp.publicKey));
  const pkcs8 = new Uint8Array(await nodeWebcrypto.subtle.exportKey('pkcs8', kp.privateKey));
  const pubMb = 'z' + base58btcEncode(rawPub);
  const dir = outDir || path.join(os.homedir(), '.aid', 'keys');
  await fs.mkdir(dir, { recursive: true });
  const name = (label || 'key') + '-ed25519.key';
  const privatePath = path.join(dir, name);
  const pem =
    '-----BEGIN PRIVATE KEY-----\n' +
    Buffer.from(pkcs8).toString('base64') +
    '\n-----END PRIVATE KEY-----\n';
  await fs.writeFile(privatePath, pem, { mode: 0o600 });
  if (printPrivate) {
    // no-op here; CLI decides printing
  }
  return { publicKey: pubMb, privatePath };
}

export function verifyPka(pka: string): { valid: boolean; reason?: string } {
  if (!pka || pka[0] !== 'z') return { valid: false, reason: 'Missing z multibase prefix' };
  const s = pka.slice(1);
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  for (const c of s)
    if (!ALPHABET.includes(c)) return { valid: false, reason: 'Invalid base58 character' };
  // Perform a simple decode length check by rough sizing: base58 ~ 1.37x expansion
  const approx = Math.floor((s.length * Math.log(58)) / Math.log(256));
  if (approx !== 32 && approx !== 33) return { valid: false, reason: 'Unexpected key length' };
  return { valid: true };
}
