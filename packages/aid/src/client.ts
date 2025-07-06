import { type AidRecord, DNS_TTL_MIN, SPEC_VERSION, DNS_SUBDOMAIN } from './constants';
import { AidError, parse } from './parser';
import { query } from 'dns-query';

/**
 * Options for Node.js discovery
 */
export interface DiscoveryOptions {
  /** Timeout for DNS query in milliseconds (default: 5000) */
  timeout?: number;
  /** Protocol-specific subdomain to try first */
  protocol?: string;
}

function normalizeDomain(domain: string): string {
  try {
    return new URL(`http://${domain}`).hostname;
  } catch {
    return domain;
  }
}

function constructQueryName(domain: string, protocol?: string): string {
  const normalized = normalizeDomain(domain);
  if (protocol) {
    return `${DNS_SUBDOMAIN}.${protocol}.${normalized}`;
  }
  return `${DNS_SUBDOMAIN}.${normalized}`;
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
  const { protocol, timeout = 5000 } = options;

  // helper to perform single DNS query for a given name
  const queryOnce = async (queryName: string): Promise<DiscoveryResult> => {
    try {
      const response = await query(
        {
          question: { type: 'TXT', name: queryName },
        },
        // Use system DNS
        { endpoints: ['dns'] },
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

        // Check if it looks like an AID record before trying to parse
        if (raw.toLowerCase().startsWith(`v=${SPEC_VERSION}`)) {
          try {
            const record = parse(raw);
            // Success! Return the parsed record, raw string, and TTL.
            return {
              record,
              raw,
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

  // Attempt protocol-specific if provided
  if (protocol) {
    const protoName = constructQueryName(domain, protocol);
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
      // else fall through to base
    }
  }

  return await Promise.race([
    queryOnce(baseName),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new AidError('ERR_DNS_LOOKUP_FAILED', `DNS query timeout for ${baseName}`)),
        timeout,
      ),
    ),
  ]);
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
