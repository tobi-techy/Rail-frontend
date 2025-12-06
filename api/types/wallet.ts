// ============= Wallet Types =============

import { PaginationParams, PaginatedResponse } from './common';

// Solana testnet only (simplified configuration)
export type TestnetChain = 'SOL-DEVNET';

// Mainnet chains (for future production use)
export type MainnetChain = 'SOL';

// All supported wallet chains (Solana only)
export type WalletChain = TestnetChain | MainnetChain;

export type WalletStatus = 'creating' | 'live' | 'failed';

export interface WalletAddressResponse {
  chain: WalletChain;
  address: string;
  status: WalletStatus;
}

// Note: API returns a single wallet object for a specific chain, not an array
export interface WalletAddressesResponse {
  chain: WalletChain;
  address: string;
  status: WalletStatus;
}

export interface GetWalletAddressesRequest {
  chain?: WalletChain;
}

export interface Token {
  id: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  usdValue: string;
  priceChange24h: number;
  network: string;
  contractAddress?: string;
  logoUrl?: string;
}

export interface WalletBalance {
  totalBalanceUSD: string;
  tokens: Token[];
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap' | 'deposit' | 'withdraw';
  tokenId: string;
  amount: string;
  usdAmount: string;
  from: string;
  to: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  txHash?: string;
  fee?: string;
  network: string;
  confirmations?: number;
}

export interface GetTransactionsRequest extends PaginationParams {
  type?: Transaction['type'];
  status?: Transaction['status'];
  tokenId?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetTransactionsResponse extends PaginatedResponse<Transaction> {}
