import { describe, expect, it } from 'vitest';
import { authTypeFromHint, parseHandshakeRequestBody } from '@/lib/api/handshake-validation';

describe('handshake validation', () => {
  it('parses valid request payload', () => {
    const parsed = parseHandshakeRequestBody({
      uri: 'https://api.example.com/mcp',
      proto: 'mcp',
      authHint: 'pat',
      auth: { bearer: 'token' },
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.value.uri).toBe('https://api.example.com/mcp');
    expect(parsed.value.proto).toBe('mcp');
    expect(parsed.value.authHint).toBe('pat');
    expect(parsed.value.auth?.bearer).toBe('token');
  });

  it('rejects missing URI', () => {
    const parsed = parseHandshakeRequestBody({ proto: 'mcp' });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.error.error).toContain('URI');
    }
  });

  it('resolves auth types from context', () => {
    expect(authTypeFromHint('npx:agent', 'pat')).toBe('local_cli');
    expect(authTypeFromHint('https://api.example.com/mcp', 'pat')).toBe('pat');
    expect(authTypeFromHint('https://api.example.com/mcp', 'oauth2_device')).toBe('oauth2_device');
    expect(authTypeFromHint('https://api.example.com/mcp', 'oauth2_code')).toBe('oauth2_code');
    expect(authTypeFromHint('https://api.example.com/mcp', undefined, true)).toBe('compliant');
    expect(authTypeFromHint('https://api.example.com/mcp')).toBe('generic');
  });
});
