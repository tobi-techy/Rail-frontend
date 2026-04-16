/**
 * Feature gate — hides features in TestFlight/production builds.
 * Accessible only in development mode (__DEV__).
 */

export function isFeatureEnabled(feature: string): boolean {
  // All gated features are dev-only for now
  return __DEV__;
}

// Named gates for clarity
export const FeatureGates = {
  AI_CHAT: 'ai_chat',
  GAMEPLAY: 'gameplay',
} as const;
