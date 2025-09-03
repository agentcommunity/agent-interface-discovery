import { describe, it, expect } from 'vitest';
import { verifyPka, generateEd25519KeyPair } from './keys';

describe('AID Engine Keys', () => {
  describe('verifyPka', () => {
    it('should accept valid z-prefixed multibase Ed25519 public key', () => {
      // This is a real test key that should pass
      const validKey = 'zAbRwF269wzcmKEQpZTXXCvLXi7KN5v6QJmhsMbb8T56k';
      const result = verifyPka(validKey);
      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should reject keys without z prefix', () => {
      const invalidKey = 'AbRwF269wzcmKEQpZTXXCvLXi7KN5v6QJmhsMbb8T56k';
      const result = verifyPka(invalidKey);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('z multibase prefix');
    });

    it('should reject keys with invalid base58 characters', () => {
      const invalidKey = 'zAbRwF269wzcmKEQpZTXXCvLXi7KN5v6QJmhsMbb8T5@k';
      const result = verifyPka(invalidKey);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid base58 character');
    });

    it('should reject keys with wrong length', () => {
      const shortKey = 'zAbRwF269wzcmKEQpZTXXCvLXi7KN5v6QJmhsMbb8T5';
      const result = verifyPka(shortKey);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Unexpected key length');
    });

    it('should handle empty input', () => {
      const result = verifyPka('');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('z multibase prefix');
    });

    it('should handle null/undefined input', () => {
      const result1 = verifyPka(null as any);
      expect(result1.valid).toBe(false);

      const result2 = verifyPka(undefined as any);
      expect(result2.valid).toBe(false);
    });
  });

  describe('generateEd25519KeyPair', () => {
    it('should generate a valid Ed25519 key pair', async () => {
      const keyPair = await generateEd25519KeyPair();

      expect(keyPair).toHaveProperty('publicKey');
      expect(keyPair).toHaveProperty('privateKeyPem');
      expect(keyPair).toHaveProperty('privateKeyBytes');

      // Public key should be z-prefixed multibase
      expect(keyPair.publicKey.startsWith('z')).toBe(true);
      expect(keyPair.publicKey.length).toBeGreaterThan(40);

      // Private key should be PEM format
      expect(keyPair.privateKeyPem).toContain('-----BEGIN PRIVATE KEY-----');
      expect(keyPair.privateKeyPem).toContain('-----END PRIVATE KEY-----');

      // Private key bytes should be Uint8Array in PKCS8 format
      expect(keyPair.privateKeyBytes).toBeInstanceOf(Uint8Array);
      expect(keyPair.privateKeyBytes.length).toBe(48); // PKCS8 wrapped Ed25519 private key
    });

    it('should generate different keys on multiple calls', async () => {
      const keyPair1 = await generateEd25519KeyPair();
      const keyPair2 = await generateEd25519KeyPair();

      // Public keys should be different (extremely unlikely to be the same)
      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);

      // Private keys should be different
      expect(keyPair1.privateKeyPem).not.toBe(keyPair2.privateKeyPem);
    });

    it('should generate valid PKA from generated public key', async () => {
      const keyPair = await generateEd25519KeyPair();
      const verification = verifyPka(keyPair.publicKey);

      expect(verification.valid).toBe(true);
      expect(verification.reason).toBeUndefined();
    });
  });
});
