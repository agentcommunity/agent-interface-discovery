import { describe, it, expect, vi, afterEach } from 'vitest';
import { discover } from './index.js';

vi.mock('dns-query', () => ({
  query: vi.fn(),
}));

describe('Client protocol resolution', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('queries underscore and then base when protocol is specified', async () => {
    const { query } = await import('dns-query');
    (query as any).mockImplementation(async ({ question }: { question: { name: string } }) => {
      if (question.name === '_agent._mcp.example.com') {
        // Simulate no record found for the protocol-specific query
        return { rcode: 'NXDOMAIN', answers: [] };
      }
      if (question.name === '_agent.example.com') {
        return {
          rcode: 'NOERROR',
          answers: [
            {
              type: 'TXT',
              name: '_agent.example.com',
              data: 'v=aid1;u=https://fallback.example.com;p=mcp',
            },
          ],
        };
      }
      return { rcode: 'NXDOMAIN', answers: [] };
    });

    const { record, queryName } = await discover('example.com', { protocol: 'mcp' });

    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        question: expect.objectContaining({ name: '_agent._mcp.example.com' }),
      }),
      expect.any(Object),
    );
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        question: expect.objectContaining({ name: '_agent.example.com' }),
      }),
      expect.any(Object),
    );
    expect(query).not.toHaveBeenCalledWith(
      expect.objectContaining({
        question: expect.objectContaining({ name: '_agent.mcp.example.com' }),
      }),
      expect.any(Object),
    );

    expect(record.uri).toBe('https://fallback.example.com');
    expect(queryName).toBe('_agent.example.com');
  });
});
