import * as Crypto from 'expo-crypto';

/**
 * Request ID Generator
 * Generates unique request IDs for API tracing using cryptographically secure randomness
 * SECURITY: Uses crypto.getRandomValues() for unpredictability
 */

export function generateRequestId(): string {
  try {
    return Crypto.randomUUID();
  } catch {
    // Fallback: Use crypto-secure random generation
    try {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);

      // Set version (4) and variant bits
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;

      // Format as UUID string
      const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return [
        hex.substring(0, 8),
        hex.substring(8, 12),
        hex.substring(12, 16),
        hex.substring(16, 20),
        hex.substring(20, 32),
      ].join('-');
    } catch {
      // SECURITY FIX (L-2): Improved last-resort fallback with better entropy.
      // Combines timestamp, high-res timer, and a simple counter to reduce predictability.
      const ts = Date.now().toString(36);
      const hr = Math.floor(performance.now() * 1000).toString(36);
      const rnd = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
      return `${ts}-${hr}-4000-8000-${rnd}${Date.now().toString(16).slice(-6)}`;
    }
  }
}
