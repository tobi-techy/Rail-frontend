/**
 * Chain Utilities
 * Helper functions for multi-chain operations
 */

import type { WalletChain } from '@/api/types';

export const SOLANA_MAINNET_CHAIN: WalletChain = 'SOL';

export interface ChainConfig {
  chain: WalletChain;
  label: string;
  shortLabel: string;
  color: string;
  warning: string;
}

export const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    chain: 'SOL',
    label: 'Solana',
    shortLabel: 'SOL',
    color: '#9945FF',
    warning: 'Only send USDC on Solana to this address.',
  },
];

export function getChainConfig(chain: WalletChain): ChainConfig {
  return SUPPORTED_CHAINS.find((c) => c.chain === chain) ?? SUPPORTED_CHAINS[0];
}

export function getChainDisplayName(chain: WalletChain): string {
  return getChainConfig(chain).label;
}

export function isTestnetChain(chain: string): boolean {
  return chain.includes('DEVNET') || chain.includes('AMOY') || chain.includes('FUJI');
}

export function getDefaultChain(): WalletChain {
  return SOLANA_MAINNET_CHAIN;
}

export function getDefaultWithdrawalChain(): WalletChain {
  return SOLANA_MAINNET_CHAIN;
}

export function getDefaultReceiveChain(): WalletChain {
  return SOLANA_MAINNET_CHAIN;
}
