/**
 * Wallet API Service
 * Handles wallet, balance, and transaction-related API calls
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
};

export const walletService = {
  /**
   * Get wallet balance and tokens
   */
  async getBalance(): Promise<WalletBalance> {
    return apiClient.get<ApiResponse<WalletBalance>>(WALLET_ENDPOINTS.BALANCE);
  },

  /**
   * Get transaction history
   */
  async getTransactions(params?: GetTransactionsRequest): Promise<GetTransactionsResponse> {
    return apiClient.get<ApiResponse<GetTransactionsResponse>>(
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
    return apiClient.post<ApiResponse<CreateTransferResponse>>(
      WALLET_ENDPOINTS.TRANSFER,
      data
    );
  },

  /**
   * Validate wallet address
   */
  async validateAddress(data: ValidateAddressRequest): Promise<ValidateAddressResponse> {
    return apiClient.post<ApiResponse<ValidateAddressResponse>>(
      WALLET_ENDPOINTS.VALIDATE_ADDRESS,
      data
    );
  },

  /**
   * Estimate transaction fee
   */
  async estimateFee(data: EstimateFeeRequest): Promise<EstimateFeeResponse> {
    return apiClient.post<ApiResponse<EstimateFeeResponse>>(
      WALLET_ENDPOINTS.ESTIMATE_FEE,
      data
    );
  },

  /**
   * Get deposit address for a token
   */
  async getDepositAddress(data: GetDepositAddressRequest): Promise<GetDepositAddressResponse> {
    return apiClient.post<ApiResponse<GetDepositAddressResponse>>(
      WALLET_ENDPOINTS.DEPOSIT_ADDRESS,
      data
    );
  },

  /**
   * Get token prices
   */
  async getPrices(data: GetPricesRequest): Promise<GetPricesResponse> {
    return apiClient.post<ApiResponse<GetPricesResponse>>(
      WALLET_ENDPOINTS.PRICES,
      data
    );
  },

  /**
   * Get available networks
   */
  async getNetworks(): Promise<GetNetworksResponse> {
    return apiClient.get<ApiResponse<GetNetworksResponse>>(WALLET_ENDPOINTS.NETWORKS);
  },
};

export default walletService;
