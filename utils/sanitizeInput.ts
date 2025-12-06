/**
 * Input Sanitization Utility
 * Prevents XSS and injection attacks by sanitizing user input
 */

export function sanitizeText(input: string): string {
  if (!input) return '';
  
  return String(input)
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

export function sanitizeNumber(input: string | number): string {
  const str = String(input);
  // Only allow numbers, decimal point, comma, and currency symbols
  return str.replace(/[^\d.,\$€£¥₹-]/g, '');
}

export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  return String(email)
    .toLowerCase()
    .trim()
    .replace(/[<>'"]/g, '');
}

export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return String(text).replace(/[&<>"'/]/g, (char) => map[char]);
}
