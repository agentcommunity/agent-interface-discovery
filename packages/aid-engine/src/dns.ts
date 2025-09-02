import { discover, AidError, SPEC_VERSION } from '@agentcommunity/aid';
import type { ProbeAttempt } from './types';

export interface DnsQueryResult<T> {
  ok: boolean;
  value?: T;
  error?: AidError;
}

export interface BaseDiscovery {
  queryName: string;
  raw: string;
  ttl: number;
}

export async function runBaseDiscovery(
  domain: string,
  options: {
    protocol?: string;
    timeoutMs: number;
    allowFallback: boolean;
    wellKnownTimeoutMs: number;
  },
): Promise<
  DnsQueryResult<{
    record: import('@agentcommunity/aid').AidRecord;
    queryName: string;
    ttl?: number;
  }>
> {
  try {
    const res = await discover(domain, {
      protocol: options.protocol,
      timeout: options.timeoutMs,
      wellKnownFallback: options.allowFallback,
      wellKnownTimeoutMs: options.wellKnownTimeoutMs,
    });
    return { ok: true, value: res };
  } catch (e) {
    return { ok: false, error: e as AidError };
  }
}

export function computeTxtByteLength(raw: string): number {
  return new TextEncoder().encode(raw).length;
}

export function attemptFromDnsResult(
  name: string,
  result: { ok: boolean; value?: { ttl?: number; record: { v: string } }; error?: AidError },
): ProbeAttempt {
  if (result.ok) {
    const rawLen = result.value?.record?.v === SPEC_VERSION ? undefined : undefined;
    return {
      name,
      type: 'TXT',
      result: 'NOERROR',
      ttl: result.value?.ttl,
      byteLength: rawLen,
    };
  }
  const err = result.error;
  if (err && err.errorCode === 'ERR_NO_RECORD') {
    return { name, type: 'TXT', result: 'NXDOMAIN' };
  }
  if (err && err.errorCode === 'ERR_DNS_LOOKUP_FAILED') {
    return { name, type: 'TXT', result: 'ERROR', reason: 'network' };
  }
  return { name, type: 'TXT', result: 'ERROR', reason: err?.errorCode || 'unknown' };
}
