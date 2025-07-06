/**
 * @agentcommunity/aid/browser - Browser-compatible Agent Interface Discovery
 *
 * This module provides AID functionality for browser environments using DNS-over-HTTPS.
 *
 * @example
 * ```typescript
 * import { discover, parse } from '@agentcommunity/aid/browser';
 *
 * // Discover an agent by domain (uses DoH)
 * const result = await discover('example.com');
 * console.log(result.record.uri); // https://api.example.com/mcp
 * ```
 */

import { type AidRecord, DNS_SUBDOMAIN } from './constants.js';
import { AidError, parse } from './parser.js';

/**
 * DNS-over-HTTPS query result from Cloudflare
 */
interface DoHResponse {
  Status: number;
  TC: boolean;
  RD: boolean;
  RA: boolean;
  AD: boolean;
  CD: boolean;
  Question: Array<{
    name: string;
    type: number;
  }>;
  Answer?: Array<{
    name: string;
    type: number;
    TTL: number;
    data: string;
  }>;
}

/**
 * Browser-compatible DNS discovery result
 */
export interface DiscoveryResult {
  /** The discovered AID record */
  record: AidRecord;
  /** The domain that was queried */
  domain: string;
  /** The full DNS name that was queried */
  queryName: string;
  /** TTL of the DNS record in seconds */
  ttl?: number;
}

/**
 * Options for browser-based DNS discovery
 */
export interface DiscoveryOptions {
  /** Timeout for DNS queries in milliseconds (default: 5000) */
  timeout?: number;
  /** Protocol-specific subdomain to try first (e.g., 'mcp' for _agent._mcp.domain.com) */
  protocol?: string;
  /** Custom DNS-over-HTTPS provider URL (default: Cloudflare) */
  dohProvider?: string;
}

/**
 * Normalize a domain name to its A-label representation (Punycode)
 *
 * @param domain - The domain name to normalize
 * @returns The normalized domain name
 */
function normalizeDomain(domain: string): string {
  try {
    // Use URL constructor to handle IDN conversion
    const url = new URL(`https://${domain}`);
    return url.hostname;
  } catch {
    // If URL parsing fails, return as-is (may be invalid)
    return domain;
  }
}

/**
 * Construct the DNS query name for AID discovery
 *
 * @param domain - The base domain
 * @param protocol - Optional protocol-specific subdomain
 * @returns The DNS query name
 */
function constructQueryName(domain: string, protocol?: string): string {
  const normalizedDomain = normalizeDomain(domain);

  if (protocol) {
    return `${DNS_SUBDOMAIN}.${protocol}.${normalizedDomain}`;
  }

  return `${DNS_SUBDOMAIN}.${normalizedDomain}`;
}

/**
 * Query DNS for TXT records using DNS-over-HTTPS
 *
 * @param queryName - The DNS name to query
 * @param options - Discovery options
 * @returns Array of TXT record strings with TTL information
 */
async function queryTxtRecordsDoH(
  queryName: string,
  options: DiscoveryOptions = {},
): Promise<Array<{ data: string; ttl: number }>> {
  const { timeout = 5000, dohProvider = 'https://cloudflare-dns.com/dns-query' } = options;

  const url = new URL(dohProvider);
  url.searchParams.set('name', queryName);
  url.searchParams.set('type', 'TXT');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/dns-json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new AidError(
        'ERR_SECURITY',
        `DoH query failed: ${response.status} ${response.statusText}`,
      );
    }

    const dnsResult: DoHResponse = await response.json();

    // Check for DNS query errors
    if (dnsResult.Status !== 0) {
      throw new AidError('ERR_NO_RECORD', `No _agent TXT record found for ${queryName}`);
    }

    // Extract TXT records from the response
    const txtRecords = (dnsResult.Answer || [])
      .filter((answer) => answer.type === 16) // TXT record type
      .map((answer) => ({
        data: answer.data.replaceAll('"', ''), // Remove surrounding quotes
        ttl: answer.TTL,
      }));

    if (txtRecords.length === 0) {
      throw new AidError('ERR_NO_RECORD', `No _agent TXT record found for ${queryName}`);
    }

    return txtRecords;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof AidError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new AidError('ERR_SECURITY', `DNS query timeout for ${queryName}`);
      }

      throw new AidError('ERR_SECURITY', `DNS query failed for ${queryName}: ${error.message}`);
    }

    throw new AidError('ERR_SECURITY', `DNS query failed for ${queryName}: ${error}`);
  }
}

/**
 * Discover an agent using the AID protocol in browser environments
 *
 * @param domain - The domain to discover
 * @param options - Discovery options
 * @returns Promise resolving to the discovery result
 * @throws AidError if discovery fails
 */
export async function discover(
  domain: string,
  options: DiscoveryOptions = {},
): Promise<DiscoveryResult> {
  const { protocol } = options;

  // Try protocol-specific subdomain first if specified
  if (protocol) {
    const protocolQueryName = constructQueryName(domain, protocol);

    try {
      const txtRecords = await queryTxtRecordsDoH(protocolQueryName, options);

      // Process the first TXT record that contains AID data
      for (const txtRecord of txtRecords) {
        const recordString = txtRecord.data;

        // Quick check if this looks like an AID record
        if (recordString.includes('v=aid1') || recordString.includes('v=AID1')) {
          try {
            const record = parse(recordString);
            return {
              record,
              domain,
              queryName: protocolQueryName,
              ttl: txtRecord.ttl,
            };
          } catch {
            // Continue to next record if parsing fails
            continue;
          }
        }
      }
    } catch (error) {
      // If protocol-specific query fails, fall back to base domain
      if (!(error instanceof AidError) || error.errorCode !== 'ERR_NO_RECORD') {
        throw error;
      }
    }
  }

  // Query the base _agent subdomain
  const baseQueryName = constructQueryName(domain);
  const txtRecords = await queryTxtRecordsDoH(baseQueryName, options);

  // Process TXT records
  for (const txtRecord of txtRecords) {
    const recordString = txtRecord.data;

    // Quick check if this looks like an AID record
    if (recordString.includes('v=aid1') || recordString.includes('v=AID1')) {
      try {
        const record = parse(recordString);
        return {
          record,
          domain,
          queryName: baseQueryName,
          ttl: txtRecord.ttl,
        };
      } catch {
        // Continue to next record if parsing fails
        continue;
      }
    }
  }

  // No valid AID record found
  throw new AidError('ERR_NO_RECORD', `No valid AID record found for ${domain}`);
}

/**
 * Discover multiple agents from a list of domains
 *
 * @param domains - Array of domains to discover
 * @param options - Discovery options
 * @returns Promise resolving to array of discovery results
 */
export async function discoverMultiple(
  domains: string[],
  options: DiscoveryOptions = {},
): Promise<DiscoveryResult[]> {
  const results = await Promise.allSettled(domains.map((domain) => discover(domain, options)));

  const successful: DiscoveryResult[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      successful.push(result.value);
    }
  }

  return successful;
}

/**
 * Test if a domain has an AID record without parsing it
 *
 * @param domain - The domain to test
 * @param options - Discovery options
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

// Re-export parser functions and constants that work in both environments
export {
  AidError,
  parse,
  parseRawRecord,
  validateRecord,
  isValidProto,
  AidRecordValidator,
} from './parser.js';

// Re-export all constants and types for easy access
export * from './constants.js';

// Default export for convenience
export default discover;
