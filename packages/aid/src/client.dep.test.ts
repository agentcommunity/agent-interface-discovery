import { describe, it, expect, vi, afterEach } from 'vitest';
import { discover } from './index.js';
import { AidError } from './parser.js';

// Mock dns-query to control responses
vi.mock('dns-query', () => ({
  query: vi.fn(),
}));

describe('Client deprecation (dep) field handling', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws ERR_INVALID_TXT if dep is in the past', async () => {
    const { query } = await import('dns-query');
    const pastDate = new Date(Date.now() - 86400 * 1000).toISOString(); // 1 day ago
    (query as any).mockResolvedValue({
      rcode: 'NOERROR',
      answers: [
        {
          type: 'TXT',
          name: '_agent.example.com',
          data: `v=aid1;u=https://api.example.com;p=mcp;e=${pastDate}`,
        },
      ],
    });

    await expect(discover('example.com')).rejects.toThrow(AidError);
    await expect(discover('example.com')).rejects.toMatchObject({
      errorCode: 'ERR_INVALID_TXT',
      message: `Record for _agent.example.com was deprecated on ${pastDate}`,
    });
  });

  it('warns if dep is in the future', async () => {
    const { query } = await import('dns-query');
    const futureDate = new Date(Date.now() + 86400 * 1000).toISOString(); // 1 day in the future
    (query as any).mockResolvedValue({
      rcode: 'NOERROR',
      answers: [
        {
          type: 'TXT',
          name: '_agent.example.com',
          data: `v=aid1;u=https://api.example.com;p=mcp;e=${futureDate}`,
        },
      ],
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await discover('example.com');

    expect(warnSpy).toHaveBeenCalledWith(
      `[AID] WARNING: Record for _agent.example.com is scheduled for deprecation on ${futureDate}`,
    );

    warnSpy.mockRestore();
  });
});
