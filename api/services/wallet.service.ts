/**
 * Wallet API Service
 * Handles Solana wallet, balance, and transaction-related API calls
 */

import apiClient from '../client';
import type {
  WalletBalance,
  GetTransactionsRequest,
  GetTransactionsResponse,
  CreateTransferRequest,
  CreateTransferResponse,
  ValidateAddressRequest,
  ValidateAddressResponse,
  EstimateFeeRequest,
  EstimateFeeResponse,
  GetDepositAddressRequest,
  GetDepositAddressResponse,
  GetPricesRequest,
  GetPricesResponse,
  GetNetworksResponse,
  GetWalletAddressesRequest,
  WalletAddressesResponse,
  ApiResponse,
} from '../types';

const WALLET_ENDPOINTS = {
  BALANCE: '/wallet/balance',
  TRANSACTIONS: '/wallet/transactions',
  TRANSACTION_DETAIL: '/wallet/transactions/:id',
  TRANSFER: '/wallet/transfer',
  VALIDATE_ADDRESS: '/wallet/validate-address',
  ESTIMATE_FEE: '/wallet/estimate-fee',
  DEPOSIT_ADDRESS: '/wallet/deposit-address',
  PRICES: '/wallet/prices',
  NETWORKS: '/wallet/networks',
  ADDRESSES: '/v1/wallets/:chain/address', // Full path: /api/v1/wallets/:chain/address
};

export const walletService = {
  /**
   * Get wallet balance and tokens
   */
  async getBalance(): Promise<WalletBalance> {
    return apiClient.get<WalletBalance>(WALLET_ENDPOINTS.BALANCE);
  },

  /**
   * Get transaction history
   */
  async getTransactions(params?: GetTransactionsRequest): Promise<GetTransactionsResponse> {
    return apiClient.get<GetTransactionsResponse>(
      WALLET_ENDPOINTS.TRANSACTIONS,
      { params }
    );
  },

  /**
   * Get single transaction details
   */
  async getTransactionDetail(txId: string): Promise<any> {
    return apiClient.get(
      WALLET_ENDPOINTS.TRANSACTION_DETAIL.replace(':id', txId)
    );
  },

  /**
   * Create transfer/withdrawal
   */
  async createTransfer(data: CreateTransferRequest): Promise<CreateTransferResponse> {
    return apiClient.post<CreateTransferResponse>(
      WALLET_ENDPOINTS.TRANSFER,
      data
    );
  },

  /**
   * Validate wallet address
   */
  async validateAddress(data: ValidateAddressRequest): Promise<ValidateAddressResponse> {
    return apiClient.post<ValidateAddressResponse>(
      WALLET_ENDPOINTS.VALIDATE_ADDRESS,
      data
    );
  },

  /**
   * Estimate transaction fee
   */
  async estimateFee(data: EstimateFeeRequest): Promise<EstimateFeeResponse> {
    return apiClient.post<EstimateFeeResponse>(
      WALLET_ENDPOINTS.ESTIMATE_FEE,
      data
    );
  },

  /**
   * Get deposit address for a token
   */
  async getDepositAddress(data: GetDepositAddressRequest): Promise<GetDepositAddressResponse> {
    return apiClient.post<GetDepositAddressResponse>(
      WALLET_ENDPOINTS.DEPOSIT_ADDRESS,
      data
    );
  },

  /**
   * Get token prices
   */
  async getPrices(data: GetPricesRequest): Promise<GetPricesResponse> {
    return apiClient.post<GetPricesResponse>(
      WALLET_ENDPOINTS.PRICES,
      data
    );
  },

  /**
   * Get available networks
   */
  async getNetworks(): Promise<GetNetworksResponse> {
    return apiClient.get<GetNetworksResponse>(WALLET_ENDPOINTS.NETWORKS);
  },

  /**
   * Get Solana wallet address
   */
  async getWalletAddresses(params?: GetWalletAddressesRequest): Promise<WalletAddressesResponse> {
    const chain = params?.chain || 'SOL-DEVNET'; // Default to Solana testnet
    const endpoint = WALLET_ENDPOINTS.ADDRESSES.replace(':chain', chain);
    return apiClient.get<WalletAddressesResponse>(endpoint);
  },
};

export default walletService;
