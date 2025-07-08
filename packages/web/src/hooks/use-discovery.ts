'use client';

import { useState } from 'react';

/** Shape of the successful TXT payload parsed by the backend. */
interface DiscoveryData {
  v: string;
  uri: string;
  protocol: string;
  host: string;
  port: number;
  auth?: string;
  desc?: string;
  /** Allow arbitrary extension fields without losing type‑safety elsewhere */
  [key: string]: unknown;
}

export interface DiscoveryResult {
  success: boolean;
  data?: DiscoveryData;
  error?: string;
  metadata?: {
    dnsQuery: string;
    lookupTime: number;
    recordType: string;
    source: string;
    txtRecord?: string;
  };
}

/** Options accepted by the `execute` function. */
interface ExecuteOptions {
  /** Supply a canned response for Storybook / tests. */
  mockData?: DiscoveryResult;
}

/**
 * React hook for performing an AID DNS discovery against `/api/discover`.
 *
 *  - Explicitly typed results (no implicit `any`).
 *  - Optional mock mode to aid local demos and unit tests.
 *  - Narrowed error handling with useful messages.
 */
export function useDiscovery() {
  const [status, setStatus] = useState<'pending' | 'running' | 'success' | 'error'>('pending');
  const [result, setResult] = useState<DiscoveryResult | null>(null);

  const execute = async (domain: string, options?: ExecuteOptions): Promise<DiscoveryResult> => {
    setStatus('running');

    // ────────────────────────────────────────
    // 1. Mock path (Storybook / tests)
    // ────────────────────────────────────────
    if (options?.mockData) {
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));
      const data: DiscoveryResult = options.mockData;
      setResult(data);
      setStatus(data.success ? 'success' : 'error');
      return data;
    }

    // ────────────────────────────────────────
    // 2. Real network request
    // ────────────────────────────────────────
    try {
      const response = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });

      const data = (await response.json()) as DiscoveryResult;
      setResult(data);
      setStatus(data.success ? 'success' : 'error');
      return data;
    } catch (error) {
      const errorResult: DiscoveryResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed',
      };
      setResult(errorResult);
      setStatus('error');
      return errorResult;
    }
  };

  return { status, result, execute } as const;
}
