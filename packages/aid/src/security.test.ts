import { describe, it, expect, vi } from 'vitest';
import { enforceRedirectPolicy } from './security.js';
import { AidError } from './parser.js';

// Helper to mock global fetch
function mockFetchOnce(status: number, location?: string) {
  const headersInit = location ? { location } : {};
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(null, {
      status,
      headers: headersInit,
    }),
  ) as unknown as typeof fetch;
}

describe('enforceRedirectPolicy', () => {
  it('allows same-origin redirect', async () => {
    mockFetchOnce(302, 'https://example.com/other');
    await expect(enforceRedirectPolicy('https://example.com')).resolves.not.toThrow();
  });

  it('blocks cross-origin redirect', async () => {
    mockFetchOnce(302, 'https://evil.com/path');
    await expect(enforceRedirectPolicy('https://example.com')).rejects.toBeInstanceOf(AidError);
  });

  it('passes through non-redirect status', async () => {
    mockFetchOnce(200);
    await expect(enforceRedirectPolicy('https://example.com')).resolves.not.toThrow();
  });
});
