type PasskeyPromptMode = 'auto' | 'manual';

const DEFAULT_AUTO_COOLDOWN_MS = 45_000;
const DEFAULT_RECENT_SUCCESS_COOLDOWN_MS = 12_000;

let globalPromptInFlight = false;
const autoPromptSuppressedUntil = new Map<string, number>();
const recentPasskeySuccessUntil = new Map<string, number>();

export const canStartPasskeyPrompt = (scope: string, mode: PasskeyPromptMode): boolean => {
  if (globalPromptInFlight) return false;

  if (mode === 'auto') {
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
};
