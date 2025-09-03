import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { discover } from './index.js';

vi.mock('dns-query', () => {
  return {
    query: vi.fn(async () => {
      const err: any = new Error('ENOTFOUND');
      err.code = 'ENOTFOUND';
      throw err;
    }),
  };
});

describe('Client well-known fallback', () => {
  const g = globalThis as any;
  let origFetch: any;

  beforeEach(() => {
    origFetch = g.fetch;
  });
  afterEach(() => {
    g.fetch = origFetch;
    vi.restoreAllMocks();
  });

  it('returns record from well-known JSON when DNS has no record', async () => {
    g.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: (name: string) => (name.toLowerCase() === 'content-type' ? 'application/json' : null) },
      text: async () => JSON.stringify({ v: 'aid1', u: 'https://api.example.com/mcp', p: 'mcp' }),
    }));

    const { record, queryName } = await discover('example.com', { wellKnownFallback: true });
    expect(queryName).toContain('/.well-known/agent');
    expect(record.v).toBe('aid1');
    expect(record.proto).toBe('mcp');
  });

  it('throws ERR_FALLBACK_FAILED on invalid content-type', async () => {
    g.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => 'text/plain' },
      text: async () => 'not json',
    }));
    await expect(discover('example.com', { wellKnownFallback: true })).rejects.toMatchObject({ errorCode: 'ERR_FALLBACK_FAILED' });
  });
});

