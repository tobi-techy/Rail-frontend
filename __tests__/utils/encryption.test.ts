import {
  encryptData,
  decryptData,
  encryptObject,
  decryptObject,
} from '../../utils/encryption';

describe('encryption', () => {
  describe('encryptData and decryptData', () => {
    it('should encrypt and decrypt strings', () => {
      const original = 'sensitive data';
      const encrypted = encryptData(original);
      const decrypted = decryptData(encrypted);
      
      expect(encrypted).not.toBe(original);
      expect(decrypted).toBe(original);
    });

    it('should produce different ciphertext for same input', () => {
      const data = 'test data';
      const encrypted1 = encryptData(data);
      const encrypted2 = encryptData(data);
      
      expect(encrypted1).not.toBe(encrypted2);
      expect(decryptData(encrypted1)).toBe(data);
      expect(decryptData(encrypted2)).toBe(data);
    });

    it('should handle empty strings', () => {
      const encrypted = encryptData('');
      const decrypted = decryptData(encrypted);
      expect(decrypted).toBe('');
    });

    it('should handle special characters', () => {
      const original = '!@#$%^&*()_+{}[]|\\:;"<>?,./~`';
      const encrypted = encryptData(original);
      const decrypted = decryptData(encrypted);
      expect(decrypted).toBe(original);
    });

    it('should handle unicode characters', () => {
      const original = 'Hello 世界 🌍';
      const encrypted = encryptData(original);
      const decrypted = decryptData(encrypted);
      expect(decrypted).toBe(original);
    });

    it('should handle long strings', () => {
      const original = 'a'.repeat(10000);
      const encrypted = encryptData(original);
      const decrypted = decryptData(encrypted);
      expect(decrypted).toBe(original);
    });
  });

  describe('encryptObject and decryptObject', () => {
    it('should encrypt and decrypt objects', () => {
      const original = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      };
      
      const encrypted = encryptObject(original);
      const decrypted = decryptObject(encrypted);
      
      expect(encrypted).not.toContain('John');
      expect(encrypted).not.toContain('john@example.com');
      expect(decrypted).toEqual(original);
    });

    it('should handle nested objects', () => {
      const original = {
        user: {
          profile: {
            name: 'John',
            settings: {
              theme: 'dark',
            },
          },
        },
      };
      
      const encrypted = encryptObject(original);
      const decrypted = decryptObject(encrypted);
      expect(decrypted).toEqual(original);
    });

    it('should handle arrays', () => {
      const original = {
        items: [1, 2, 3],
        tags: ['tag1', 'tag2'],
      };
      
      const encrypted = encryptObject(original);
      const decrypted = decryptObject(encrypted);
      expect(decrypted).toEqual(original);
    });

    it('should handle null values', () => {
      const original = {
        nullValue: null,
        normalValue: 'test',
      };
      
      const encrypted = encryptObject(original);
      const decrypted = decryptObject(encrypted);
      expect(decrypted.nullValue).toBeNull();
      expect(decrypted.normalValue).toBe('test');
    });

    it('should handle boolean and number types', () => {
      const original = {
        isActive: true,
        count: 42,
        price: 99.99,
      };
      
      const encrypted = encryptObject(original);
      const decrypted = decryptObject(encrypted);
      expect(decrypted).toEqual(original);
    });

    it('should handle empty objects', () => {
      const original = {};
      const encrypted = encryptObject(original);
      const decrypted = decryptObject(encrypted);
      expect(decrypted).toEqual(original);
    });
  });

  describe('error handling', () => {
    it('should throw error when decrypting invalid data', () => {
      expect(() => decryptData('invalid encrypted data')).toThrow();
    });

    it('should throw error when decrypting corrupted object', () => {
      expect(() => decryptObject('not valid json')).toThrow();
    });
  });

  describe('security properties', () => {
    it('should not expose plain text in encrypted output', () => {
      const sensitive = 'password123';
      const encrypted = encryptData(sensitive);
      expect(encrypted).not.toContain(sensitive);
    });

    it('should produce ciphertext that looks random', () => {
      const encrypted = encryptData('test');
      expect(encrypted).toMatch(/^[A-Za-z0-9+/=]+$/);
    });
  });
});