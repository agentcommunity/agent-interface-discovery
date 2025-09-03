import { describe, it, expect } from 'vitest';
import { ERROR_MESSAGES } from './error_messages';

describe('AID Engine Error Messages', () => {
  it('should export ERROR_MESSAGES object', () => {
    expect(ERROR_MESSAGES).toBeDefined();
    expect(typeof ERROR_MESSAGES).toBe('object');
  });

  it('should contain expected error message keys', () => {
    const expectedKeys = ['BYTE_LIMIT_EXCEEDED', 'ENABLE_DNSSEC', 'ADD_PKA', 'RENEW_TLS'];

    expectedKeys.forEach((key) => {
      expect(ERROR_MESSAGES).toHaveProperty(key);
      expect(typeof ERROR_MESSAGES[key]).toBe('string');
      expect(ERROR_MESSAGES[key].length).toBeGreaterThan(0);
    });
  });

  it('should have meaningful error messages', () => {
    // Test a few key error messages
    expect(ERROR_MESSAGES.BYTE_LIMIT_EXCEEDED).toContain('byte');
    expect(ERROR_MESSAGES.ENABLE_DNSSEC).toContain('DNSSEC');
    expect(ERROR_MESSAGES.ADD_PKA).toContain('endpoint proof');
    expect(ERROR_MESSAGES.RENEW_TLS).toContain('TLS');
  });

  it('should not have empty error messages', () => {
    Object.values(ERROR_MESSAGES).forEach((message) => {
      expect(message).toBeDefined();
      expect(message.trim()).not.toBe('');
      expect(typeof message).toBe('string');
    });
  });
});
