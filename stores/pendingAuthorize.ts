import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Holds a Miriam approval intent captured from a deep link that arrived before
 * the user was authenticated (cold start / logged out). Once the user signs in
 * and reaches home, the intent is consumed and the authorize screen is reopened.
 * Intents are short-lived so a stale link never resurfaces.
 */
const INTENT_TTL_MS = 5 * 60 * 1000;

interface PendingAuthorizeState {
  conv: string | null;
  savedAt: number | null;
  setIntent: (conv: string) => void;
  /** Returns a fresh intent's conv id (and clears it), or null if none/stale. */
  consumeIntent: () => string | null;
  clear: () => void;
}

export const usePendingAuthorize = create<PendingAuthorizeState>()(
  persist(
    (set, get) => ({
      conv: null,
      savedAt: null,
      setIntent: (conv) => set({ conv, savedAt: Date.now() }),
      consumeIntent: () => {
        const { conv, savedAt } = get();
        set({ conv: null, savedAt: null });
        if (!conv || !savedAt) return null;
        if (Date.now() - savedAt > INTENT_TTL_MS) return null;
        return conv;
      },
      clear: () => set({ conv: null, savedAt: null }),
    }),
    {
      name: 'pending-authorize',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
