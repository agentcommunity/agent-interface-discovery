import { describe, it, expect, vi } from 'vitest';
import { runProtocolProbe } from './protoProbe';
import { discover } from '@agentcommunity/aid';

// Mock the discover function
vi.mock('@agentcommunity/aid', () => ({
  discover: vi.fn(),
}));

const mockDiscover = vi.mocked(discover);

describe('runProtocolProbe', () => {
  it('should return successful attempt on valid discovery', async () => {
    const mockResult = {
      raw: 'v=aid1;u=https://example.com;p=mcp',
      ttl: 300,
    };
    mockDiscover.mockResolvedValue(mockResult);

    const result = await runProtocolProbe('example.com', 'mcp', 5000);

    expect(result.attempt).toEqual({
      name: '_agent._mcp.example.com',
      type: 'TXT',
      result: 'NOERROR',
      ttl: 300,
      byteLength: new TextEncoder().encode(mockResult.raw).length,
    });
    expect(result.error).toBeUndefined();
  });

  it('should return NXDOMAIN on no record error', async () => {
    const error = { errorCode: 'ERR_NO_RECORD', message: 'No record found' };
    mockDiscover.mockRejectedValue(error);

    const result = await runProtocolProbe('example.com', 'mcp', 5000);

    expect(result.attempt).toEqual({
      name: '_agent._mcp.example.com',
      type: 'TXT',
      result: 'NXDOMAIN',
    });
    expect(result.error).toEqual(error);
  });

  it('should return ERROR on other failures', async () => {
    const error = { errorCode: 'ERR_DNS_LOOKUP_FAILED', message: 'DNS failed' };
    mockDiscover.mockRejectedValue(error);

    const result = await runProtocolProbe('example.com', 'mcp', 5000);

    expect(result.attempt).toEqual({
      name: '_agent._mcp.example.com',
      type: 'TXT',
      result: 'ERROR',
      reason: 'ERR_DNS_LOOKUP_FAILED',
    });
    expect(result.error).toEqual(error);
  });
});
