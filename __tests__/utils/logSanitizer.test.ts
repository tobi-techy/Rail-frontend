import { sanitizeForLog, sanitizeObject } from '../../utils/logSanitizer';

describe('logSanitizer', () => {
  describe('sanitizeForLog', () => {
    it('should remove newlines', () => {
      const result = sanitizeForLog('test\nvalue\r\nhere');
      expect(result).toBe('test value  here');
    });

    it('should remove control characters', () => {
      const result = sanitizeForLog('test\x00\x1Fvalue');
      expect(result).toBe('testvalue');
    });

    it('should truncate long strings', () => {
      const longString = 'a'.repeat(600);
      const result = sanitizeForLog(longString);
      expect(result.length).toBeLessThan(600);
      expect(result).toContain('(truncated)');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeForLog(null)).toBe('null');
      expect(sanitizeForLog(undefined)).toBe('null');
    });
  });

  describe('sanitizeObject', () => {
    it('should redact sensitive fields', () => {
      const obj = {
        email: 'test@example.com',
        password: 'secret123',
        token: 'abc123',
        name: 'John',
      };

      const result = sanitizeObject(obj);
      expect(result.password).toBe('[REDACTED]');
      expect(result.token).toBe('[REDACTED]');
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('John');
    });

    it('should handle nested objects', () => {
      const obj = {
        user: {
          email: 'test@example.com',
          password: 'secret',
        },
      };

      const result = sanitizeObject(obj);
      expect(result.user.password).toBe('[REDACTED]');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should handle arrays', () => {
      const arr = ['value1', 'value2\nwith\nnewlines'];
      const result = sanitizeObject(arr);
      expect(result[0]).toBe('value1');
      expect(result[1]).not.toContain('\n');
    });
  });
});
