type PasskeyPromptMode = 'auto' | 'manual';

const DEFAULT_AUTO_COOLDOWN_MS = 45_000;
const DEFAULT_RECENT_SUCCESS_COOLDOWN_MS = 12_000;
// How long after a successful auto-trigger to suppress re-firing (covers app foreground cycles)
const POST_SUCCESS_SUPPRESS_MS = 60_000;

let globalPromptInFlight = false;
const autoPromptSuppressedUntil = new Map<string, number>();
const recentPasskeySuccessUntil = new Map<string, number>();
// Tracks whether auto-trigger has already fired for a scope in this JS session
const autoFiredScopes = new Set<string>();

export const canStartPasskeyPrompt = (scope: string, mode: PasskeyPromptMode): boolean => {
  if (globalPromptInFlight) return false;

  if (mode === 'auto') {
    // Never re-fire auto if it already ran for this scope in this JS session
    if (autoFiredScopes.has(scope)) return false;

    const recentlySucceededUntil = recentPasskeySuccessUntil.get(scope) ?? 0;
    if (Date.now() < recentlySucceededUntil) return false;

    const suppressedUntil = autoPromptSuppressedUntil.get(scope) ?? 0;
    if (Date.now() < suppressedUntil) return false;
  }

  return true;
};

export const beginPasskeyPrompt = (): boolean => {
  if (globalPromptInFlight) return false;
  globalPromptInFlight = true;
  return true;
};

export const endPasskeyPrompt = (): void => {
  globalPromptInFlight = false;
};

export const isPasskeyPromptInFlight = (): boolean => globalPromptInFlight;

export const suppressAutoPasskeyPrompt = (
  scope: string,
  cooldownMs: number = DEFAULT_AUTO_COOLDOWN_MS
): void => {
  autoPromptSuppressedUntil.set(scope, Date.now() + Math.max(0, cooldownMs));
};

export const markPasskeyPromptSuccess = (
  scope: string,
  cooldownMs: number = DEFAULT_RECENT_SUCCESS_COOLDOWN_MS
): void => {
  recentPasskeySuccessUntil.set(scope, Date.now() + Math.max(0, cooldownMs));
  // Suppress auto re-trigger for a full minute after success
  autoPromptSuppressedUntil.set(scope, Date.now() + POST_SUCCESS_SUPPRESS_MS);
};

/** Call before firing auto-trigger so remounts don't re-fire within the same JS session */
export const recordAutoFired = (scope: string): void => {
  autoFiredScopes.add(scope);
};

/** Clear the fired record for a scope (e.g. after logout/account switch) */
export const clearAutoFired = (scope: string): void => {
  autoFiredScopes.delete(scope);
};
