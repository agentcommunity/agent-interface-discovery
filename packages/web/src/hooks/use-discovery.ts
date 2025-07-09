'use client';

import { useState } from 'react';
// Import the browser-specific discovery function and types
import { discover, AidError, type AidRecord } from '@agentcommunity/aid/browser';

/** Shape of the successful TXT payload parsed and formatted by the hook for the UI. */
export interface DiscoveryData extends AidRecord {
  host: string;
  port: number;
}

/** The result shape that the UI components expect. */
export interface DiscoveryResult {
  success: boolean;
  data?: DiscoveryData;
  error?: string;
  metadata?: {
    dnsQuery: string;
    lookupTime: number;
    recordType: 'TXT'; // Always TXT for AID
    source: 'DNS-over-HTTPS'; // Always DoH in the browser
    txtRecord?: string; // The raw record string, available only on success
  };
}

/** Options accepted by the `execute` function. */
interface ExecuteOptions {
  /** Supply a canned response for Storybook / tests. */
  mockData?: DiscoveryResult;
}

/**
 * React hook for performing client-side AID DNS discovery.
 */
export function useDiscovery() {
  const [status, setStatus] = useState<'pending' | 'running' | 'success' | 'error'>('pending');
  const [result, setResult] = useState<DiscoveryResult | null>(null);

  const execute = async (domain: string, options?: ExecuteOptions): Promise<DiscoveryResult> => {
    setStatus('running');

    if (options?.mockData) {
      // Mock path remains unchanged
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));
      const data: DiscoveryResult = options.mockData;
      setResult(data);
      setStatus(data.success ? 'success' : 'error');
      return data;
    }

    const startTime = Date.now();
    try {
      // Direct call to the library function
      const libResult = await discover(domain);
      const lookupTime = Date.now() - startTime;

      const resultUri = new URL(libResult.record.uri);

      // We need to reconstruct the raw TXT string for display purposes,
      // as the browser library does not expose it on success.
      const reconstructedTxt = Object.entries(libResult.record)
        .map(([key, value]) => `${key}=${value}`)
        .join(';');

      // Format the successful result into the shape our UI expects
      const successResult: DiscoveryResult = {
        success: true,
        data: {
          ...libResult.record,
          host: resultUri.hostname,
          port: resultUri.port ? Number.parseInt(resultUri.port, 10) : 443,
        },
        metadata: {
          dnsQuery: libResult.queryName,
          lookupTime,
          recordType: 'TXT',
          source: 'DNS-over-HTTPS',
          txtRecord: reconstructedTxt,
        },
      };

      setResult(successResult);
      setStatus('success');
      return successResult;
    } catch (error) {
      const lookupTime = Date.now() - startTime;
      let errorMessage = 'An unknown discovery error occurred.';

      // Handle specific AidError instances for better feedback
      if (error instanceof AidError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      const errorResult: DiscoveryResult = {
        success: false,
        error: errorMessage,
        metadata: {
          dnsQuery: domain,
          lookupTime,
          recordType: 'TXT',
          source: 'DNS-over-HTTPS',
          // We cannot get the raw TXT record on failure from the browser library.
          txtRecord: undefined,
        },
      };

      setResult(errorResult);
      setStatus('error');
      return errorResult;
    }
  };

  return { status, result, execute } as const;
}
