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
  nativeCurrency: string;
  token: 'USDC' | 'USDT';
}

export const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    chain: 'SOL',
    label: 'Solana',
    shortLabel: 'SOL',
    color: '#9945FF',
    warning: 'Only send USDC on Solana to this address.',
    nativeCurrency: 'SOL',
    token: 'USDC',
  },
  {
    chain: 'CELO',
    label: 'Celo',
    shortLabel: 'CELO',
    color: '#FCFF52',
    warning: 'Only send USDC on Celo to this address.',
    nativeCurrency: 'CELO',
    token: 'USDC',
  },
  {
    chain: 'MATIC',
    label: 'Polygon',
    shortLabel: 'MATIC',
    color: '#8247E5',
    warning: 'Only send USDC on Polygon to this address.',
    nativeCurrency: 'MATIC',
    token: 'USDC',
  },
  {
    chain: 'BASE',
    label: 'Base',
    shortLabel: 'BASE',
    color: '#0052FF',
    warning: 'Only send USDC on Base to this address.',
    nativeCurrency: 'ETH',
    token: 'USDC',
  },
  {
    chain: 'AVAX',
    label: 'Avalanche',
    shortLabel: 'AVAX',
    color: '#E84142',
    warning: 'Only send USDC on Avalanche to this address.',
    nativeCurrency: 'AVAX',
    token: 'USDC',
  },
];

export function isEVMChain(chain: WalletChain): boolean {
  return chain === 'MATIC' || chain === 'CELO' || chain === 'BASE' || chain === 'AVAX';
}

export function isSolanaChain(chain: WalletChain): boolean {
  return chain === 'SOL';
}

export function getChainConfig(chain: WalletChain): ChainConfig {
  return SUPPORTED_CHAINS.find((c) => c.chain === chain) ?? SUPPORTED_CHAINS[0];
}

export function getChainDisplayName(chain: WalletChain): string {
  return getChainConfig(chain).label;
}

export function isTestnetChain(chain: string): boolean {
  return false;
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
