import {
  sanitizeText,
  sanitizeNumber,
  sanitizeEmail,
  sanitizeUrl,
  escapeHtml,
} from '../../utils/sanitizeInput';

describe('sanitizeInput', () => {
  describe('sanitizeText', () => {
    it('should remove angle brackets', () => {
      const result = sanitizeText('Hello <script>alert("xss")</script>');
      expect(result).toBe('Hello scriptalert("xss")/script');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should remove javascript: protocol', () => {
      const result = sanitizeText('javascript:alert(1)');
      expect(result).toBe('alert(1)');
    });

    it('should remove event handlers', () => {
      const result = sanitizeText('text onclick=alert(1)');
      expect(result).toBe('text alert(1)');
    });

    it('should trim whitespace', () => {
      const result = sanitizeText('  hello world  ');
      expect(result).toBe('hello world');
    });

    it('should handle empty strings', () => {
      expect(sanitizeText('')).toBe('');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeText(null as any)).toBe('');
      expect(sanitizeText(undefined as any)).toBe('');
    });

    it('should handle multiple XSS vectors', () => {
      const malicious = '<img src=x onerror=alert(1)> javascript:void(0)';
      const result = sanitizeText(malicious);
      expect(result).not.toContain('<');
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('onerror=');
    });
  });

  describe('sanitizeNumber', () => {
    it('should keep valid numeric characters', () => {
      expect(sanitizeNumber('123.45')).toBe('123.45');
      expect(sanitizeNumber('1,234.56')).toBe('1,234.56');
      expect(sanitizeNumber('-42')).toBe('-42');
    });

    it('should keep currency symbols', () => {
      expect(sanitizeNumber('$100')).toBe('$100');
      expect(sanitizeNumber('€50.00')).toBe('€50.00');
      expect(sanitizeNumber('£25')).toBe('£25');
      expect(sanitizeNumber('¥1000')).toBe('¥1000');
      expect(sanitizeNumber('₹500')).toBe('₹500');
    });

    it('should remove letters and special characters', () => {
      expect(sanitizeNumber('123abc')).toBe('123');
      expect(sanitizeNumber('$100 USD')).toBe('$100');
      expect(sanitizeNumber('1@2#3')).toBe('123');
    });

    it('should handle string and number inputs', () => {
      expect(sanitizeNumber(42)).toBe('42');
      expect(sanitizeNumber('42')).toBe('42');
    });
  });

  describe('sanitizeEmail', () => {
    it('should convert to lowercase', () => {
      const result = sanitizeEmail('TEST@EXAMPLE.COM');
      expect(result).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const result = sanitizeEmail('  user@example.com  ');
      expect(result).toBe('user@example.com');
    });

    it('should remove dangerous characters', () => {
      const result = sanitizeEmail('user<script>@example.com');
      expect(result).toBe('userscript@example.com');
    });

    it('should handle quotes', () => {
      const result = sanitizeEmail('user"test\'@example.com');
      expect(result).not.toContain('"');
      expect(result).not.toContain("'");
    });

    it('should handle empty strings', () => {
      expect(sanitizeEmail('')).toBe('');
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow valid HTTP URLs', () => {
      const url = 'http://example.com/path';
      const result = sanitizeUrl(url);
      expect(result).toBe(url);
    });

    it('should allow valid HTTPS URLs', () => {
      const url = 'https://example.com/path?query=1';
      const result = sanitizeUrl(url);
      expect(result).toBe(url);
    });

    it('should reject javascript: protocol', () => {
      const result = sanitizeUrl('javascript:alert(1)');
      expect(result).toBe('');
    });

    it('should reject data: protocol', () => {
      const result = sanitizeUrl('data:text/html,<script>alert(1)</script>');
      expect(result).toBe('');
    });

    it('should reject file: protocol', () => {
      const result = sanitizeUrl('file:///etc/passwd');
      expect(result).toBe('');
    });

    it('should handle invalid URLs', () => {
      expect(sanitizeUrl('not a url')).toBe('');
      expect(sanitizeUrl('')).toBe('');
    });

    it('should normalize URLs', () => {
      const result = sanitizeUrl('https://example.com:443/path');
      expect(result).toContain('https://example.com');
    });
  });

  describe('escapeHtml', () => {
    it('should escape ampersands', () => {
      const result = escapeHtml('Tom & Jerry');
      expect(result).toBe('Tom &amp; Jerry');
    });

    it('should escape angle brackets', () => {
      const result = escapeHtml('<div>content</div>');
      expect(result).toBe('&lt;div&gt;content&lt;/div&gt;');
    });

    it('should escape quotes', () => {
      const result = escapeHtml('"quoted" and \'single\'');
      expect(result).toBe('&quot;quoted&quot; and &#x27;single&#x27;');
    });

    it('should escape all HTML entities', () => {
      const result = escapeHtml('<script>alert("XSS")</script>');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });

    it('should handle empty strings', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle text without special chars', () => {
      const text = 'normal text 123';
      expect(escapeHtml(text)).toBe(text);
    });
  });
});