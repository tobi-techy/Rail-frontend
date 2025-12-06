/**
 * Stores index - Central export point for all Zustand stores
 */

// Auth store
export { useAuthStore } from './authStore';
export type { User } from './authStore';

// Wallet store
export { useWalletStore } from './walletStore';
export type { Token, Transaction } from './walletStore';

// Withdrawal store
export { useWithdrawalStore } from './withdrawalStore';
export type {
  Network,
  BridgeProvider,
  Recipient,
  TransactionDetails,
} from './withdrawalStore';

// UI store
export { useUIStore } from './uiStore';
