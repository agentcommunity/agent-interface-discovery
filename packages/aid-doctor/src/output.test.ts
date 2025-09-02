import { describe, it, expect } from 'vitest';
import { formatCheckResult } from './output';
import type { DoctorReport } from './types';

describe('formatCheckResult', () => {
  it('should format a successful report correctly', () => {
    const report: DoctorReport = {
      domain: 'example.com',
      queried: {
        strategy: 'base-first',
        hint: { source: 'cli', present: false },
        attempts: [{ name: '_agent.example.com', type: 'TXT', result: 'NOERROR', ttl: 300 }],
        wellKnown: {
          attempted: false,
          used: false,
          url: null,
          httpStatus: null,
          contentType: null,
          byteLength: null,
          status: null,
          snippet: null,
        },
      },
      record: {
        raw: 'v=aid1;u=https://a.co;p=mcp',
        parsed: { v: 'aid1', uri: 'https://a.co', proto: 'mcp' },
        valid: true,
        warnings: [],
        errors: [],
      },
      dnssec: { present: true, method: 'RRSIG', proof: {} },
      tls: {
        checked: true,
        valid: true,
        host: 'a.co',
        sni: 'a.co',
        issuer: 'Test',
        san: ['a.co'],
        validFrom: '',
        validTo: '',
        daysRemaining: 90,
        redirectBlocked: false,
      },
      pka: {
        present: true,
        attempted: true,
        verified: true,
        kid: 'g1',
        alg: 'ed25519',
        createdSkewSec: 1,
        covered: [],
      },
      downgrade: { checked: true, previous: null, status: 'first_seen' },
      exitCode: 0,
    };

    const output = formatCheckResult(report);
    expect(output).toContain('[1/6] DNS TXT _agent.example.com');
    expect(output).toContain('✅ Found');
    expect(output).toContain('✅ Valid');
    expect(output).toContain('✅ Detected');
    expect(output).toContain('✅ Verified');
    expect(output).toContain('✅ Record is valid and secure.');
  });

  it('should include actionable suggestions for common issues', () => {
    const report: DoctorReport = {
      domain: 'example.com',
      queried: {
        strategy: 'base-first',
        hint: { source: 'cli', present: false },
        attempts: [{ name: '_agent.example.com', type: 'TXT', result: 'NOERROR', ttl: 300 }],
        wellKnown: {
          attempted: false,
          used: false,
          url: null,
          httpStatus: null,
          contentType: null,
          byteLength: null,
          status: null,
          snippet: null,
        },
      },
      record: {
        raw: 'v=aid1;u=https://a.co;p=mcp;s=' + 'a'.repeat(250), // Make it > 255 bytes
        parsed: { v: 'aid1', uri: 'https://a.co', proto: 'mcp', desc: 'a'.repeat(250) },
        valid: true,
        warnings: [],
        errors: [],
      },
      dnssec: { present: false, method: 'RRSIG', proof: null },
      tls: {
        checked: true,
        valid: true,
        host: 'a.co',
        sni: 'a.co',
        issuer: 'Test',
        san: ['a.co'],
        validFrom: '',
        validTo: '',
        daysRemaining: 90,
        redirectBlocked: false,
      },
      pka: {
        present: false,
        attempted: false,
        verified: null,
        kid: null,
        alg: null,
        createdSkewSec: null,
        covered: null,
      },
      downgrade: { checked: false, previous: null, status: null },
      exitCode: 0,
    };

    const output = formatCheckResult(report);
    expect(output).toContain('💡 Enable DNSSEC');
    expect(output).toContain('💡 Add endpoint proof');
    expect(output).toContain('💡 Reduce record size');
  });

  it('should handle error cases', () => {
    const report: DoctorReport = {
      domain: 'example.com',
      queried: {
        strategy: 'base-first',
        hint: { source: 'cli', present: false },
        attempts: [],
        wellKnown: {
          attempted: false,
          used: false,
          url: null,
          httpStatus: null,
          contentType: null,
          byteLength: null,
          status: null,
          snippet: null,
        },
      },
      record: {
        raw: null,
        parsed: null,
        valid: false,
        warnings: [],
        errors: [{ code: 'ERR_NO_RECORD', message: 'No record found' }],
      },
      dnssec: { present: false, method: 'RRSIG', proof: null },
      tls: {
        checked: false,
        valid: null,
        host: null,
        sni: null,
        issuer: null,
        san: null,
        validFrom: null,
        validTo: null,
        daysRemaining: null,
        redirectBlocked: null,
      },
      pka: {
        present: false,
        attempted: false,
        verified: null,
        kid: null,
        alg: null,
        createdSkewSec: null,
        covered: null,
      },
      downgrade: { checked: false, previous: null, status: null },
      exitCode: 1000,
    };

    const output = formatCheckResult(report);
    expect(output).toContain('❌ Not Found');
    expect(output).toContain('❌ Found 1 error(s)');
  });
});
