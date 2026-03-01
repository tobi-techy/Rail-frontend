/**
 * Chain Utilities
 * Helper functions for multi-chain operations
 */

import type { WalletChain } from '@/api/types';

export const SOLANA_TESTNET_CHAIN: WalletChain = 'SOL-DEVNET';

export interface ChainConfig {
  chain: WalletChain;
  label: string;
  shortLabel: string;
  color: string;
  warning: string;
}

export const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    chain: 'SOL-DEVNET',
    label: 'Solana',
    shortLabel: 'SOL',
    color: '#9945FF',
    warning: 'Only send USDC on Solana to this address.',
  },
  {
    chain: 'MATIC-AMOY',
    label: 'Polygon',
    shortLabel: 'MATIC',
    color: '#8247E5',
    warning: 'Only send USDC on Polygon to this address.',
  },
  {
    chain: 'AVAX-FUJI',
    label: 'Avalanche',
    shortLabel: 'AVAX',
    color: '#E84142',
    warning: 'Only send USDC on Avalanche C-Chain to this address.',
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

export function getTestnetChain(): WalletChain {
  return SOLANA_TESTNET_CHAIN;
}
