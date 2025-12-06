import { sanitizeText, sanitizeEmail, escapeHtml } from '../../utils/sanitizeInput';

describe('sanitizeText', () => {
  it('should remove angle brackets', () => {
    const input = '<script>alert("xss")</script>Hello';
    const result = sanitizeText(input);
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  it('should handle normal text', () => {
    const input = 'Hello World';
    const result = sanitizeText(input);
    expect(result).toBe('Hello World');
  });

  it('should handle empty string', () => {
    const result = sanitizeText('');
    expect(result).toBe('');
  });

  it('should remove javascript protocol', () => {
    const input = 'javascript:alert(1)';
    const result = sanitizeText(input);
    expect(result).not.toContain('javascript:');
  });
});

describe('sanitizeEmail', () => {
  it('should lowercase email', () => {
    expect(sanitizeEmail('Test@Example.COM')).toBe('test@example.com');
  });

  it('should trim whitespace', () => {
    expect(sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
  });
});

describe('escapeHtml', () => {
  it('should escape HTML entities', () => {
    const result = escapeHtml('<div>Test</div>');
    expect(result).toBe('&lt;div&gt;Test&lt;&#x2F;div&gt;');
  });
});
