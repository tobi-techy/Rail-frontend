import { create } from 'zustand';
import type { NudgeResponse } from '@/api/types/ai';

interface MiriamNudgeState {
  nudge: NudgeResponse | null;
  loading: boolean;
  lastScreen: string | null;
  lastFetchedAt: number;
  dismissed: boolean;
  cooldownMs: number;
}

interface MiriamNudgeActions {
  setNudge: (nudge: NudgeResponse | null) => void;
  setLoading: (loading: boolean) => void;
  dismiss: () => void;
  canFetch: (screen: string) => boolean;
  markFetched: (screen: string) => void;
  reset: () => void;
}

const COOLDOWN = 60_000; // 1 min between nudges per screen

export const useMiriamNudgeStore = create<MiriamNudgeState & MiriamNudgeActions>()(
  (set, get) => ({
    nudge: null,
    loading: false,
    lastScreen: null,
    lastFetchedAt: 0,
    dismissed: false,
    cooldownMs: COOLDOWN,

    setNudge: (nudge) => set({ nudge, dismissed: false }),
    setLoading: (loading) => set({ loading }),
    dismiss: () => set({ nudge: null, dismissed: true }),

    canFetch: (screen) => {
      const { lastScreen, lastFetchedAt, loading } = get();
      if (loading) return false;
      if (lastScreen === screen && Date.now() - lastFetchedAt < COOLDOWN) return false;
      return true;
    },

    markFetched: (screen) => set({ lastScreen: screen, lastFetchedAt: Date.now() }),

    reset: () =>
      set({
        nudge: null,
        loading: false,
        lastScreen: null,
        lastFetchedAt: 0,
        dismissed: false,
      }),
  })
);
