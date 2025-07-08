'use client';

import { useState } from 'react';

export interface HandshakeResult {
  success: boolean;
  /** When the server refused unauthenticated requests */
  needsAuth?: boolean;
  /** Whether server returned spec‑compliant WWW‑Authenticate header */
  compliantAuth?: boolean;
  /** URI for OAuth metadata doc */
  metadataUri?: string;
  /** Raw metadata fetched from metadataUri */
  metadata?: unknown;
  data?: {
    protocolVersion: string;
    serverInfo: { name: string; version: string };
    capabilities: { id: string; type: 'tool' | 'resource' }[];
  };
  error?: string;
}

interface ExecuteOptions {
  /** Mock handshake response for Storybook / tests */
  mockData?: HandshakeResult;
  /** Bearer token for authenticated handshake */
  auth?: { bearer: string };
}

/**
 * React hook for performing an AID handshake against the local API route.
 * Handles optional mock data, authentication, and automatic metadata fetch.
 */
export function useConnection() {
  const [status, setStatus] = useState<'pending' | 'running' | 'success' | 'error'>('pending');
  const [result, setResult] = useState<HandshakeResult | null>(null);

  const execute = async (uri: string, options?: ExecuteOptions): Promise<HandshakeResult> => {
    setStatus('running');

    // ────────────────────────────────────────
    // 1. Mock path (useful in Storybook / tests)
    // ────────────────────────────────────────
    if (options?.mockData) {
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 300));
      const data: HandshakeResult = options.mockData;
      setResult(data);
      setStatus(data.success ? 'success' : 'error');
      return data;
    }

    // ────────────────────────────────────────
    // 2. Real network request
    // ────────────────────────────────────────
    try {
      const response = await fetch('/api/handshake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri, ...(options?.auth ? { auth: options.auth } : {}) }),
      });

      let data: HandshakeResult = (await response.json()) as HandshakeResult;

      // Fetch additional OAuth metadata for richer UX (optional)
      if (data.needsAuth && data.compliantAuth && typeof data.metadataUri === 'string') {
        try {
          const metaResp = await fetch(data.metadataUri, { method: 'GET' });
          if (metaResp.ok) {
            const metaJson = (await metaResp.json()) as unknown;
            data = { ...data, metadata: metaJson };
          }
        } catch {
          /* swallow metadata fetch errors; they are non‑critical */
        }
      }

      setResult(data);
      setStatus(data.success ? 'success' : 'error');
      return data;
    } catch (error) {
      const errorResult: HandshakeResult = {
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
