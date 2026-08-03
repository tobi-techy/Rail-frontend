import { create } from 'zustand';
import type { Transaction } from '@/components/molecules/TransactionItem';

/**
 * Transient hand-off for the full-screen transaction detail route.
 *
 * The selected Transaction carries non-serializable fields (its `icon` holds
 * live SVG components), so it can't ride through Expo Router params. Instead the
 * list stashes it here and `app/transaction-detail.tsx` reads it back. Not
 * persisted — it only needs to survive a single navigation.
 */
interface TransactionDetailState {
  transaction: Transaction | null;
  open: (transaction: Transaction) => void;
  clear: () => void;
}

export const useTransactionDetailStore = create<TransactionDetailState>((set) => ({
  transaction: null,
  open: (transaction) => set({ transaction }),
  clear: () => set({ transaction: null }),
}));
