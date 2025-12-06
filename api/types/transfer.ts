// ============= Transfer/Withdrawal Types =============

import { Transaction } from './wallet';

export interface CreateTransferRequest {
  tokenId: string;
  toAddress: string;
  amount: string;
  network: string;
  memo?: string;
}

export interface CreateTransferResponse {
  transaction: Transaction;
  estimatedFee: string;
  estimatedTime: string;
}

export interface ValidateAddressRequest {
  address: string;
  network: string;
}

export interface ValidateAddressResponse {
  valid: boolean;
  addressType?: 'wallet' | 'contract' | 'ens';
  resolvedAddress?: string;
}

export interface EstimateFeeRequest {
  tokenId: string;
  toAddress: string;
  amount: string;
  network: string;
}

export interface EstimateFeeResponse {
  fee: string;
  feeUSD: string;
  estimatedTime: string;
}
