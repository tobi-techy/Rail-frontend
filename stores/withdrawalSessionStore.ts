import { create } from 'zustand';

const SESSION_TTL_MS = 30 * 60_000; // 30 minutes

interface Session {
  withdrawalId: string;
  createdAt: number;
}

interface WithdrawalSessionStore {
  sessions: Record<string, Session>;
  set: (key: string, withdrawalId: string) => void;
  get: (key: string) => string | null;
  clear: (key: string) => void;
}

export const useWithdrawalSessionStore = create<WithdrawalSessionStore>((set, get) => ({
  sessions: {},
  set: (key, withdrawalId) =>
    set((s) => ({
      sessions: { ...s.sessions, [key]: { withdrawalId, createdAt: Date.now() } },
    })),
  get: (key) => {
    const s = get().sessions[key];
    if (!s) return null;
    if (Date.now() - s.createdAt > SESSION_TTL_MS) return null;
    return s.withdrawalId;
  },
  clear: (key) =>
    set((s) => {
      const { [key]: _, ...rest } = s.sessions;
      return { sessions: rest };
    }),
}));
