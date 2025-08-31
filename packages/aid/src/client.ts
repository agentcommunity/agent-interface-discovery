import {
  type AidRecord,
  type RawAidRecord,
  DNS_TTL_MIN,
  SPEC_VERSION,
  DNS_SUBDOMAIN,
} from './constants';
import { AidError, parse, AidRecordValidator } from './parser';
import { performPKAHandshake } from './pka.js';
import { query } from 'dns-query';

/**
 * Options for Node.js discovery
 */
export interface DiscoveryOptions {
  /** Timeout for DNS query in milliseconds (default: 5000) */
  timeout?: number;
  /** Protocol-specific subdomain to try (optional). When provided, underscore and non-underscore forms are attempted. */
  protocol?: string;
  /** Enable .well-known fallback on ERR_NO_RECORD or ERR_DNS_LOOKUP_FAILED (default: true) */
  wellKnownFallback?: boolean;
  /** Timeout for .well-known fetch in milliseconds (default: 2000) */
  wellKnownTimeoutMs?: number;
}

function normalizeDomain(domain: string): string {
  try {
    return new URL(`http://${domain}`).hostname;
  } catch {
    return domain;
  }
}

function constructQueryName(domain: string, protocol?: string, useUnderscore = false): string {
  const normalized = normalizeDomain(domain);
  if (protocol) {
    const protoPart = useUnderscore ? `_${protocol}` : protocol;
    return `${DNS_SUBDOMAIN}.${protoPart}.${normalized}`;
  }
  return `${DNS_SUBDOMAIN}.${normalized}`;
}

/**
 * Build a canonical RawAidRecord from JSON that may include alias keys
 */
function canonicalizeRaw(json: Record<string, unknown>): RawAidRecord {
  const out: RawAidRecord = {};
  const getStr = (k: string) =>
    typeof json[k] === 'string' ? (json[k] as string).trim() : undefined;
  // Only set fields when defined to comply with exactOptionalPropertyTypes
  const v = getStr('v');
  if (v !== undefined) out.v = v;
  const uri = getStr('uri') ?? getStr('u');
  if (uri !== undefined) out.uri = uri;
  const proto = getStr('proto') ?? getStr('p');
  if (proto !== undefined) out.proto = proto;
  const auth = getStr('auth') ?? getStr('a');
  if (auth !== undefined) out.auth = auth;
  const desc = getStr('desc') ?? getStr('s');
  if (desc !== undefined) out.desc = desc;
  const docs = getStr('docs') ?? getStr('d');
  if (docs !== undefined) out.docs = docs;
  const dep = getStr('dep') ?? getStr('e');
  if (dep !== undefined) out.dep = dep;
  const pka = getStr('pka') ?? getStr('k');
  if (pka !== undefined) out.pka = pka;
  const kid = getStr('kid') ?? getStr('i');
  if (kid !== undefined) out.kid = kid;
  return out;
}

// Minimal fetch/response types to avoid DOM lib dependency
type HeadersLike = { get(name: string): string | null };
type ResponseLike = { ok: boolean; status: number; headers: HeadersLike; text(): Promise<string> };
type FetchInit = { signal?: unknown; redirect?: 'error' | 'follow' | 'manual' };
type FetchLike = (input: string, init?: FetchInit) => Promise<ResponseLike>;

async function fetchWellKnown(
  domain: string,
  timeoutMs = 2000,
): Promise<{
  record: AidRecord;
  raw: string;
  queryName: string;
}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const host = normalizeDomain(domain);
  const insecure =
    typeof process !== 'undefined' &&
    process.env &&
    process.env.AID_ALLOW_INSECURE_WELL_KNOWN === '1';
  const scheme = insecure ? 'http' : 'https';
  const url = `${scheme}://${host}/.well-known/agent`;
  try {
    const fetchImpl = (globalThis as unknown as { fetch?: FetchLike }).fetch;
    if (typeof fetchImpl !== 'function') {
      throw new AidError('ERR_FALLBACK_FAILED', 'fetch is not available in this environment');
    }
    const res = (await fetchImpl(url, {
      signal: controller.signal as unknown,
      redirect: 'error',
    })) as ResponseLike;
    if (!res.ok) {
      throw new AidError('ERR_FALLBACK_FAILED', `Well-known HTTP ${res.status}`);
    }
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!ct.startsWith('application/json')) {
      throw new AidError(
        'ERR_FALLBACK_FAILED',
        'Invalid content-type for well-known (expected application/json)',
      );
    }
    const text = await res.text();
    if (text.length > 64 * 1024) {
      throw new AidError('ERR_FALLBACK_FAILED', 'Well-known response too large (>64KB)');
    }
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new AidError('ERR_FALLBACK_FAILED', 'Invalid JSON in well-known response');
    }
    if (typeof json !== 'object' || json === null) {
      throw new AidError('ERR_FALLBACK_FAILED', 'Well-known JSON must be an object');
    }
    const raw = canonicalizeRaw(json as Record<string, unknown>);
    const record = AidRecordValidator.validate(raw);
    if (record.pka) {
      await performPKAHandshake(record.uri, record.pka, record.kid ?? '');
    }
    return { record, raw: text.trim(), queryName: url };
  } catch (e) {
    if (e instanceof AidError) throw e;
    throw new AidError('ERR_FALLBACK_FAILED', (e as Error).message);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Result of a successful discovery query.
 */
export interface DiscoveryResult {
  /** The parsed and validated AID record. */
  record: AidRecord;
  /** The raw, unparsed TXT record string. */
  raw: string;
  /** The TTL (Time-To-Live) of the DNS record, in seconds. */
  ttl: number;
  /** The DNS name that was queried */
  queryName: string;
}

/**
 * Discover an AID record for the given domain
 */
export async function discover(
  domain: string,
  options: DiscoveryOptions = {},
): Promise<DiscoveryResult> {
  const { protocol, timeout = 5000, wellKnownFallback = true, wellKnownTimeoutMs = 2000 } = options;

  // helper to perform single DNS query for a given name
  const queryOnce = async (queryName: string): Promise<DiscoveryResult> => {
    try {
      const response = await query(
        {
          question: { type: 'TXT', name: queryName },
        },
        // Use public resolvers for CI environments where the special "dns" alias may be unavailable
        {
          endpoints: ['1.1.1.1', '8.8.8.8'],
        },
      );

      if (response.rcode !== 'NOERROR' || !response.answers || response.answers.length === 0) {
        throw new AidError('ERR_NO_RECORD', `No TXT record found for ${queryName}`);
      }

      for (const answer of response.answers) {
        // Ensure we are looking at a TXT record
        if (answer.type !== 'TXT' || !answer.data) continue;

        // Data can be a buffer or an array of buffers. Standardize to array.
        const parts = Array.isArray(answer.data) ? answer.data : [answer.data];
        const raw = parts.map((p) => p.toString()).join('');
        const rawTrimmed = raw.trim();

        // Check if it looks like an AID record before trying to parse (ignore leading whitespace)
        if (rawTrimmed.toLowerCase().startsWith(`v=${SPEC_VERSION}`)) {
          try {
            const record = parse(rawTrimmed);
            if (record.pka) {
              await performPKAHandshake(record.uri, record.pka, record.kid ?? '');
            }
            // Success! Return the parsed record, raw string, and TTL.
            return {
              record,
              raw: rawTrimmed,
              ttl: answer.ttl ?? DNS_TTL_MIN,
              queryName,
            };
          } catch (parseError) {
            // This record looked like an AID record but failed validation.
            if (parseError instanceof AidError) throw parseError;
            throw new AidError('ERR_INVALID_TXT', (parseError as Error).message);
          }
        }
      }

      // If the loop completes without finding a valid AID record
      throw new AidError('ERR_NO_RECORD', `No valid AID record found for ${queryName}`);
    } catch (error: unknown) {
      if (error instanceof AidError) {
        throw error;
      }

      // Handle DNS-specific errors with robust code checking
      const dnsError = error as { code?: string; message: string };
      if (
        dnsError.code === 'ENOTFOUND' ||
        dnsError.code === 'ENODATA' ||
        dnsError.code === 'NXDOMAIN'
      ) {
        throw new AidError(
          'ERR_NO_RECORD',
          `Domain not found or no record available for: ${domain}`,
        );
      }

      // Fallback for other errors
      throw new AidError(
        'ERR_DNS_LOOKUP_FAILED',
        (error as Error).message || 'An unknown DNS lookup error occurred',
      );
    }
  };

  const baseName = constructQueryName(domain);

  const runDns = async (): Promise<DiscoveryResult> => {
    // Canonical: base _agent.<domain> query
    // If protocol is explicitly requested, attempt protocol-specific subdomains afterwards
    if (!protocol) {
      return await Promise.race([
        queryOnce(baseName),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(new AidError('ERR_DNS_LOOKUP_FAILED', `DNS query timeout for ${baseName}`)),
            timeout,
          ),
        ),
      ]);
    }

    // Protocol explicitly requested: try underscore form first, then non-underscore; finally base
    const protoNameUnderscore = constructQueryName(domain, protocol, true);
    const protoName = constructQueryName(domain, protocol, false);

    // 1) underscore form
    try {
      return await Promise.race([
        queryOnce(protoNameUnderscore),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new AidError(
                  'ERR_DNS_LOOKUP_FAILED',
                  `DNS query timeout for ${protoNameUnderscore}`,
                ),
              ),
            timeout,
          ),
        ),
      ]);
    } catch (error) {
      if (!(error instanceof AidError) || error.errorCode !== 'ERR_NO_RECORD') {
        throw error;
      }
    }

    // 2) non-underscore form
    try {
      return await Promise.race([
        queryOnce(protoName),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(new AidError('ERR_DNS_LOOKUP_FAILED', `DNS query timeout for ${protoName}`)),
            timeout,
          ),
        ),
      ]);
    } catch (error) {
      if (!(error instanceof AidError) || error.errorCode !== 'ERR_NO_RECORD') {
        throw error;
      }
    }

    // 3) fallback to base
    return await Promise.race([
      queryOnce(baseName),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new AidError('ERR_DNS_LOOKUP_FAILED', `DNS query timeout for ${baseName}`)),
          timeout,
        ),
      ),
    ]);
  };

  try {
    return await runDns();
  } catch (error) {
    if (
      wellKnownFallback &&
      error instanceof AidError &&
      (error.errorCode === 'ERR_NO_RECORD' || error.errorCode === 'ERR_DNS_LOOKUP_FAILED')
    ) {
      const { record, raw, queryName } = await fetchWellKnown(domain, wellKnownTimeoutMs);
      return { record, raw, ttl: DNS_TTL_MIN, queryName };
    }
    throw error;
  }
}

/**
 * Discover multiple agents from a list of domains
 *
 * @param domains - Array of domains to discover
 * @returns Promise resolving to array of discovery results
 */
export async function discoverMultiple(
  domains: string[],
  options: DiscoveryOptions = {},
): Promise<DiscoveryResult[]> {
  const results = await Promise.allSettled(domains.map((domain) => discover(domain, options)));

  const successful: DiscoveryResult[] = [];
  const failed: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled') {
      successful.push(result.value);
    } else {
      failed.push(domains[i]);
    }
  }

  return successful;
}

/**
 * Test if a domain has an AID record without parsing it
 *
 * @param domain - The domain to test
 * @returns Promise resolving to true if an AID record exists
 */
export async function hasAidRecord(
  domain: string,
  options: DiscoveryOptions = {},
): Promise<boolean> {
  try {
    await discover(domain, options);
    return true;
  } catch {
    return false;
  }
}
