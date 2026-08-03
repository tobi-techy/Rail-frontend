import { create } from 'zustand';

export type WithdrawalEventStatus = 'completed' | 'failed';

export interface WithdrawalEvent {
  withdrawalId: string;
  status: WithdrawalEventStatus;
}

interface WithdrawalEventStore {
  lastEvent: WithdrawalEvent | null;
  dispatch: (event: WithdrawalEvent) => void;
  consume: (withdrawalId: string) => WithdrawalEvent | null;
}

export const useWithdrawalEventStore = create<WithdrawalEventStore>((set, get) => ({
  lastEvent: null,
  dispatch: (event) => set({ lastEvent: event }),
  consume: (withdrawalId) => {
    const { lastEvent } = get();
    if (lastEvent?.withdrawalId !== withdrawalId) return null;
    set({ lastEvent: null });
    return lastEvent;
  },
}));
