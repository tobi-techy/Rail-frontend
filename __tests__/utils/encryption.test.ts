import { encryptData, decryptData, encryptObject, decryptObject } from '../../utils/encryption';

describe('encryption', () => {
  describe('encryptData and decryptData', () => {
    it('should encrypt and decrypt data correctly', () => {
      const originalData = 'Hello, World!';
      const encrypted = encryptData(originalData);
      const decrypted = decryptData(encrypted);

      expect(decrypted).toBe(originalData);
      expect(encrypted).not.toBe(originalData);
    });

    it('should produce different ciphertext for same plaintext', () => {
      const data = 'test data';
      const encrypted1 = encryptData(data);
      const encrypted2 = encryptData(data);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should throw error for empty data', () => {
      expect(() => encryptData('')).toThrow('Data to encrypt cannot be empty');
    });

    it('should throw error for empty encrypted data', () => {
      expect(() => decryptData('')).toThrow('Encrypted data cannot be empty');
    });

    it('should handle special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;\':",./<>?`~\n\t';
      const encrypted = encryptData(specialChars);
      const decrypted = decryptData(encrypted);

      expect(decrypted).toBe(specialChars);
    });

    it('should handle unicode characters', () => {
      const unicode = '你好世界 🌍 Привет мир مرحبا';
      const encrypted = encryptData(unicode);
      const decrypted = decryptData(encrypted);

      expect(decrypted).toBe(unicode);
    });

    it('should handle long strings', () => {
      const longString = 'a'.repeat(10000);
      const encrypted = encryptData(longString);
      const decrypted = decryptData(encrypted);

      expect(decrypted).toBe(longString);
    });
  });

  describe('encryptObject and decryptObject', () => {
    it('should encrypt and decrypt objects correctly', () => {
      const obj = { name: 'John', age: 30, email: 'john@example.com' };
      const encrypted = encryptObject(obj);
      const decrypted = decryptObject<typeof obj>(encrypted);

      expect(decrypted).toEqual(obj);
    });

    it('should handle nested objects', () => {
      const obj = {
        user: {
          id: 1,
          profile: {
            name: 'Jane',
            address: {
              city: 'NYC',
              zip: '10001',
            },
          },
        },
        tags: ['admin', 'user'],
      };
      const encrypted = encryptObject(obj);
      const decrypted = decryptObject<typeof obj>(encrypted);

      expect(decrypted).toEqual(obj);
    });

    it('should handle arrays', () => {
      const arr = [1, 2, 3, 'four', { five: 5 }];
      const encrypted = encryptObject(arr);
      const decrypted = decryptObject<typeof arr>(encrypted);

      expect(decrypted).toEqual(arr);
    });

    it('should throw error for null object', () => {
      expect(() => encryptObject(null as any)).toThrow(
        'Object to encrypt cannot be null or undefined'
      );
    });

    it('should throw error for undefined object', () => {
      expect(() => encryptObject(undefined as any)).toThrow(
        'Object to encrypt cannot be null or undefined'
      );
    });

    it('should handle empty object', () => {
      const obj = {};
      const encrypted = encryptObject(obj);
      const decrypted = decryptObject<typeof obj>(encrypted);

      expect(decrypted).toEqual(obj);
    });
  });
});
