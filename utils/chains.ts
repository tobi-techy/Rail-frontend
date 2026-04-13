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
  /** Whether this chain is routed via Bridge direct (vs ChainRails) */
  via: 'bridge' | 'chainrails';
}

/**
 * All chains supported for withdrawal (off-ramp).
 * Ordered: Bridge-direct first (faster), then ChainRails.
 */
export const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    chain: 'SOL',
    label: 'Solana',
    shortLabel: 'SOL',
    color: '#9945FF',
    warning: 'Only send USDC on Solana to this address.',
    nativeCurrency: 'SOL',
    token: 'USDC',
    via: 'bridge',
  },
  {
    chain: 'ETH',
    label: 'Ethereum',
    shortLabel: 'ETH',
    color: '#627EEA',
    warning: 'Only send USDC on Ethereum to this address.',
    nativeCurrency: 'ETH',
    token: 'USDC',
    via: 'bridge',
  },
  {
    chain: 'BASE',
    label: 'Base',
    shortLabel: 'BASE',
    color: '#0052FF',
    warning: 'Only send USDC on Base to this address.',
    nativeCurrency: 'ETH',
    token: 'USDC',
    via: 'bridge',
  },
  {
    chain: 'ARB',
    label: 'Arbitrum',
    shortLabel: 'ARB',
    color: '#12AAFF',
    warning: 'Only send USDC on Arbitrum to this address.',
    nativeCurrency: 'ETH',
    token: 'USDC',
    via: 'bridge',
  },
  {
    chain: 'OP',
    label: 'Optimism',
    shortLabel: 'OP',
    color: '#FF0420',
    warning: 'Only send USDC on Optimism to this address.',
    nativeCurrency: 'ETH',
    token: 'USDC',
    via: 'bridge',
  },
  {
    chain: 'MATIC',
    label: 'Polygon',
    shortLabel: 'MATIC',
    color: '#8247E5',
    warning: 'Only send USDC on Polygon to this address.',
    nativeCurrency: 'MATIC',
    token: 'USDC',
    via: 'bridge',
  },
  {
    chain: 'AVAX',
    label: 'Avalanche',
    shortLabel: 'AVAX',
    color: '#E84142',
    warning: 'Only send USDC on Avalanche to this address.',
    nativeCurrency: 'AVAX',
    token: 'USDC',
    via: 'bridge',
  },
  {
    chain: 'BSC',
    label: 'BNB Chain',
    shortLabel: 'BNB',
    color: '#F3BA2F',
    warning: 'Only send USDC on BNB Chain to this address.',
    nativeCurrency: 'BNB',
    token: 'USDC',
    via: 'chainrails',
  },
  {
    chain: 'STARKNET',
    label: 'Starknet',
    shortLabel: 'STRK',
    color: '#EC796B',
    warning: 'Only send USDC on Starknet to this address.',
    nativeCurrency: 'STRK',
    token: 'USDC',
    via: 'chainrails',
  },
  {
    chain: 'MONAD',
    label: 'Monad',
    shortLabel: 'MON',
    color: '#836EF9',
    warning: 'Only send USDC on Monad to this address.',
    nativeCurrency: 'MON',
    token: 'USDC',
    via: 'chainrails',
  },
  {
    chain: 'HYPEREVM',
    label: 'HyperEVM',
    shortLabel: 'HYPE',
    color: '#00FF87',
    warning: 'Only send USDC on HyperEVM to this address.',
    nativeCurrency: 'HYPE',
    token: 'USDC',
    via: 'chainrails',
  },
  {
    chain: 'LISK',
    label: 'Lisk',
    shortLabel: 'LSK',
    color: '#4070F4',
    warning: 'Only send USDC on Lisk to this address.',
    nativeCurrency: 'LSK',
    token: 'USDC',
    via: 'chainrails',
  },
];

export function isEVMChain(chain: WalletChain): boolean {
  return ['ETH', 'BASE', 'ARB', 'OP', 'MATIC', 'AVAX', 'BSC', 'BNB', 'STARKNET', 'MONAD', 'HYPEREVM', 'LISK'].includes(chain);
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

export function isTestnetChain(_chain: string): boolean {
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

/**
 * Deposit (on-ramp) chains per stablecoin — via ChainRails PaymentModal.
 * All 11 deposit chains support USDC.
 */
export const STABLECOIN_CHAINS: Record<string, WalletChain[]> = {
  USDC: ['SOL', 'ETH', 'BASE', 'ARB', 'OP', 'MATIC', 'AVAX', 'BSC', 'STARKNET', 'MONAD', 'HYPEREVM'],
  USDT: ['SOL'],
  EURC: ['SOL', 'BASE'],
  PYUSD: ['SOL'],
};

export type StablecoinCode = keyof typeof STABLECOIN_CHAINS;

export const STABLECOIN_CODES: StablecoinCode[] = ['USDC', 'USDT', 'EURC', 'PYUSD'];

export function isStablecoin(code: string): code is StablecoinCode {
  return code in STABLECOIN_CHAINS;
}
