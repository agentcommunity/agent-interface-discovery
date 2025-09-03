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

vi.mock('./pka.js', () => ({
  performPKAHandshake: vi.fn(async () => {}),
}));

describe('Client PKA handshake trigger', () => {
  const g = globalThis as any;
  let origFetch: any;

  beforeEach(() => {
    origFetch = g.fetch;
  });
  afterEach(() => {
    g.fetch = origFetch;
    vi.restoreAllMocks();
  });

  it('calls performPKAHandshake when pka+kid are present from well-known JSON', async () => {
    const { performPKAHandshake } = await import('./pka.js');
    g.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) => (name.toLowerCase() === 'content-type' ? 'application/json' : null),
      },
      text: async () =>
        JSON.stringify({
          v: 'aid1',
          u: 'https://api.example.com/mcp',
          p: 'mcp',
          k: 'zBase58EncodedKey',
          i: 'g1',
        }),
    }));

    const { record } = await discover('example.com', { wellKnownFallback: true });
    expect(record.pka).toBeDefined();
    expect((performPKAHandshake as any).mock.calls.length).toBe(1);
    expect((performPKAHandshake as any).mock.calls[0][0]).toBe('https://api.example.com/mcp');
  });
});
