/**
 * Input Sanitization Utility
 * Prevents XSS and injection attacks by sanitizing user input
 *
 * SECURITY FIX (L-1): Expanded sanitization to cover data: URIs, SVG vectors,
 * style injection, and other non-obvious XSS payloads.
 */

export function sanitizeText(input: string): string {
  if (!input) return '';

  return String(input)
    .normalize('NFKC') // SECURITY FIX (NEW-M3): Normalize Unicode to prevent fullwidth/confusable bypasses
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript\s*:/gi, '') // Remove javascript: protocol (with optional whitespace)
    .replace(/data\s*:/gi, '') // Remove data: URIs (SVG/HTML injection vector)
    .replace(/vbscript\s*:/gi, '') // Remove vbscript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers (onclick=, onerror=, etc.)
    .replace(/style\s*=/gi, '') // Remove inline style injection
    .replace(/expression\s*\(/gi, '') // Remove CSS expression()
    .replace(/url\s*\(/gi, '') // Remove CSS url() injection
    .replace(/-moz-binding\s*:/gi, '') // Remove Firefox XBL binding
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
    '`': '&#96;',
  };

  return String(text).replace(/[&<>"'/`]/g, (char) => map[char]);
}
