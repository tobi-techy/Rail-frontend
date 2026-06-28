import { useEnableMiriamAmbient } from './useEnableMiriamAmbient';

/**
 * Enables "Hey Miriam" for the homescreen. Delegates to `useEnableMiriamAmbient`.
 * Kept as a named export for backwards compat — import the generic hook directly
 * when adding wake word to other screens.
 */
export function useAmbientHomescreen() {
  useEnableMiriamAmbient();
}
