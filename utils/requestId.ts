/**
 * Request ID Generator
 * Generates unique request IDs for API tracing
 */

export function generateRequestId(): string {
  return crypto.randomUUID();
}
