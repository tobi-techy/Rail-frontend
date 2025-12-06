/**
 * Root store - Re-exports all application stores
 * This provides a single entry point for importing stores throughout the app
 */

export { useAuthStore } from '../stores/authStore';
export type { User } from '../stores/authStore';

export { useWalletStore } from '../stores/walletStore';
export type { Token, Transaction } from '../stores/walletStore';

export { useWithdrawalStore } from '../stores/withdrawalStore';
export type {
  Network,
  BridgeProvider,
  Recipient,
  TransactionDetails,
} from '../stores/withdrawalStore';
