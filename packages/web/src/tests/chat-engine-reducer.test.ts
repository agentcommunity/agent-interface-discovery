import { describe, expect, it } from 'vitest';
import { normalizeDomainInput } from '@/hooks/chat-engine/reducer';

describe('normalizeDomainInput', () => {
  it('normalizes host from URL input', () => {
    const normalized = normalizeDomainInput('https://Example.COM/path?q=1');
    expect(normalized).toEqual({ ok: true, domain: 'example.com' });
  });

  it('normalizes IDN input to punycode', () => {
    const normalized = normalizeDomainInput('münich.example');
    expect(normalized).toEqual({ ok: true, domain: 'xn--mnich-kva.example' });
  });

  it('rejects invalid domain input', () => {
    const normalized = normalizeDomainInput('not-a-domain');
    expect(normalized.ok).toBe(false);
    if (!normalized.ok) {
      expect(normalized.error).toContain('fully-qualified');
    }
  });
});
