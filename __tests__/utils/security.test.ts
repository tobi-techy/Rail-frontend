import { rateLimiter, maskSensitiveData, isSafeInput, RATE_LIMITS } from '../../utils/security';

describe('rateLimiter', () => {
  beforeEach(() => {
    rateLimiter.reset('test-key');
  });

  it('should allow requests within limit', () => {
    expect(rateLimiter.check('test-key', 3, 1000)).toBe(true);
    expect(rateLimiter.check('test-key', 3, 1000)).toBe(true);
    expect(rateLimiter.check('test-key', 3, 1000)).toBe(true);
  });

  it('should block requests exceeding limit', () => {
    rateLimiter.check('test-key', 2, 1000);
    rateLimiter.check('test-key', 2, 1000);
    expect(rateLimiter.check('test-key', 2, 1000)).toBe(false);
  });

  it('should reset after window expires', async () => {
    rateLimiter.check('test-key', 1, 50);
    expect(rateLimiter.check('test-key', 1, 50)).toBe(false);
    
    await new Promise(resolve => setTimeout(resolve, 60));
    expect(rateLimiter.check('test-key', 1, 50)).toBe(true);
  });
});

describe('maskSensitiveData', () => {
  it('should mask password fields', () => {
    const data = { email: 'test@example.com', password: 'secret123' };
    const masked = maskSensitiveData(data);
    
    expect(masked.email).toBe('test@example.com');
    expect(masked.password).toBe('***REDACTED***');
  });

  it('should mask token fields', () => {
    const data = { accessToken: 'abc123', refreshToken: 'xyz789' };
    const masked = maskSensitiveData(data);
    
    expect(masked.accessToken).toBe('***REDACTED***');
    expect(masked.refreshToken).toBe('***REDACTED***');
  });

  it('should not modify non-sensitive fields', () => {
    const data = { name: 'John', email: 'john@example.com' };
    const masked = maskSensitiveData(data);
    
    expect(masked).toEqual(data);
  });
});

describe('isSafeInput', () => {
  it('should return true for safe input', () => {
    expect(isSafeInput('Hello World')).toBe(true);
    expect(isSafeInput('test@example.com')).toBe(true);
    expect(isSafeInput('123-456-7890')).toBe(true);
  });

  it('should return false for script tags', () => {
    expect(isSafeInput('<script>alert("xss")</script>')).toBe(false);
  });

  it('should return false for javascript protocol', () => {
    expect(isSafeInput('javascript:alert(1)')).toBe(false);
  });

  it('should return false for event handlers', () => {
    expect(isSafeInput('onclick=alert(1)')).toBe(false);
    expect(isSafeInput('onerror=alert(1)')).toBe(false);
  });
});
