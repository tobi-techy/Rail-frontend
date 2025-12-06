/**
 * Chain Utilities
 * Helper functions for Solana blockchain operations
 */

import type { TestnetChain } from '@/api/types';

/**
 * Solana testnet configuration
 * Application is configured to use Solana testnet only
 */
export const SOLANA_TESTNET_CHAIN: TestnetChain = 'SOL-DEVNET';

/**
 * Get testnet chain (always returns Solana testnet)
 */
export function getTestnetChain(networkId?: string): TestnetChain {
  return SOLANA_TESTNET_CHAIN;
}

/**
 * Check if a chain is a testnet (always true for our Solana configuration)
 */
export function isTestnetChain(chain: string): boolean {
  return chain === 'SOL-DEVNET' || chain.includes('DEVNET');
}

/**
 * Get display name for Solana testnet
 */
export function getChainDisplayName(chain: TestnetChain): string {
  return 'Solana Devnet';
}
