/**
 * Stores index - Central export point for all Zustand stores
 */

// Auth store
export { useAuthStore } from './authStore';

// Wallet store
export { useWalletStore } from './walletStore';
export type { Token, Transaction } from './walletStore';

// Withdrawal store
export { useWithdrawalStore } from './withdrawalStore';
export type { Network, BridgeProvider, Recipient, TransactionDetails } from './withdrawalStore';

// Withdrawal event store (push-notification driven status updates)
export { useWithdrawalEventStore } from './withdrawalEventStore';
export type { WithdrawalEvent, WithdrawalEventStatus } from './withdrawalEventStore';

// UI store
export { useUIStore } from './uiStore';
export { useFeedbackPopupStore } from './feedbackPopupStore';

// Auth store types (modular)
export * from './auth/types';

// AI Chat store
export { useAIChatStore } from './aiChatStore';

// Transaction detail (transient hand-off for the full-screen detail route)
export { useTransactionDetailStore } from './transactionDetailStore';
