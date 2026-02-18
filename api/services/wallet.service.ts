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
  BALANCE: '/v1/balances',
  TRANSACTIONS: '/v1/withdrawals',
  TRANSACTION_DETAIL: '/v1/withdrawals/:id',
  TRANSFER: '/v1/withdrawals/crypto',
  DEPOSIT_ADDRESS: '/v1/funding/deposit/address',
  ADDRESSES: '/v1/wallets/:chain/address', // Full path: /api/v1/wallets/:chain/address
};

export const walletService = {
  /**
   * Get wallet balance and tokens
   */
  async getBalance(): Promise<WalletBalance> {
    const response = await apiClient.get<any>(WALLET_ENDPOINTS.BALANCE);
    const total = String(response?.total_usdc ?? response?.totalUSDC ?? '0');
    const spending = String(response?.spending_balance ?? response?.spendingBalance ?? total);

    return {
      totalBalanceUSD: total,
      updatedAt: response?.last_updated || response?.lastUpdated || new Date().toISOString(),
      tokens: [
        {
          id: 'usdc',
          symbol: 'USDC',
          name: 'USD Coin',
          balance: spending,
          decimals: 6,
          usdValue: spending,
          priceChange24h: 0,
          network: 'Solana',
        },
      ],
    };
  },

  /**
   * Get transaction history
   */
  async getTransactions(params?: GetTransactionsRequest): Promise<GetTransactionsResponse> {
    const limit = params?.limit ?? 20;
    const offset = Number(params?.cursor || 0);
    const response = await apiClient.get<any>(WALLET_ENDPOINTS.TRANSACTIONS, {
      params: { limit, offset },
    });

    const rows = Array.isArray(response) ? response : response?.items || [];
    const items = rows.map((tx: any) => ({
      id: tx?.id || tx?.withdrawal_id || '',
      type: 'withdraw',
      tokenId: 'USDC',
      amount: String(tx?.amount ?? '0'),
      usdAmount: String(tx?.amount ?? '0'),
      from: '',
      to: tx?.destination_address || '',
      timestamp: tx?.created_at || tx?.updated_at || new Date().toISOString(),
      status: tx?.status || 'pending',
      txHash: tx?.tx_hash || undefined,
      network: tx?.destination_chain || 'SOL-DEVNET',
      fee: undefined,
      confirmations: undefined,
    }));

    return {
      items,
      total: response?.total ?? items.length,
      nextCursor: items.length >= limit ? String(offset + limit) : undefined,
    };
  },

  /**
   * Get single transaction details
   */
  async getTransactionDetail(txId: string): Promise<any> {
    const tx = await apiClient.get<any>(WALLET_ENDPOINTS.TRANSACTION_DETAIL.replace(':id', txId));
    return {
      id: tx?.id || tx?.withdrawal_id || txId,
      type: 'withdraw',
      tokenId: 'USDC',
      amount: String(tx?.amount ?? '0'),
      usdAmount: String(tx?.amount ?? '0'),
      from: '',
      to: tx?.destination_address || '',
      timestamp: tx?.created_at || tx?.updated_at || new Date().toISOString(),
      status: tx?.status || 'pending',
      txHash: tx?.tx_hash || undefined,
      network: tx?.destination_chain || 'SOL-DEVNET',
      fee: undefined,
      confirmations: undefined,
    };
  },

  /**
   * Create transfer/withdrawal
   */
  async createTransfer(data: CreateTransferRequest): Promise<CreateTransferResponse> {
    const response = await apiClient.post<any>(WALLET_ENDPOINTS.TRANSFER, {
      amount: parseFloat(data.amount),
      destination_address: data.toAddress,
    });

    return {
      estimatedFee: '0',
      estimatedTime: '1-2 minutes',
      transaction: {
        id: response?.withdrawal_id || '',
        type: 'withdraw',
        tokenId: data.tokenId,
        amount: data.amount,
        usdAmount: data.amount,
        from: '',
        to: data.toAddress,
        timestamp: new Date().toISOString(),
        status: response?.status || 'pending',
        txHash: response?.withdrawal_id || undefined,
        network: 'SOL',
      },
    };
  },

  /**
   * Validate wallet address
   */
  async validateAddress(data: ValidateAddressRequest): Promise<ValidateAddressResponse> {
    const isValid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test((data.address || '').trim());
    return {
      valid: isValid,
      addressType: 'wallet',
      resolvedAddress: isValid ? data.address.trim() : undefined,
    };
  },

  /**
   * Estimate transaction fee
   */
  async estimateFee(data: EstimateFeeRequest): Promise<EstimateFeeResponse> {
    return {
      fee: '0',
      feeUSD: '0',
      estimatedTime: '1-2 minutes',
    };
  },

  /**
   * Get deposit address for a token
   */
  async getDepositAddress(data: GetDepositAddressRequest): Promise<GetDepositAddressResponse> {
    const chain = data.network?.toUpperCase().includes('SOL') ? 'SOL-DEVNET' : 'SOL-DEVNET';
    const response = await apiClient.post<any>(WALLET_ENDPOINTS.DEPOSIT_ADDRESS, { chain });
    return {
      address: response?.address || '',
      network: response?.chain || chain,
      qrCode: response?.qrCode || '',
      memo: undefined,
      minimumDeposit: undefined,
    };
  },

  /**
   * Get token prices
   */
  async getPrices(data: GetPricesRequest): Promise<GetPricesResponse> {
    return {
      prices: data.tokenIds.map((tokenId) => ({
        tokenId,
        symbol: tokenId,
        price: '1',
        priceChange24h: 0,
        updatedAt: new Date().toISOString(),
      })),
    };
  },

  /**
   * Get available networks
   */
  async getNetworks(): Promise<GetNetworksResponse> {
    return {
      networks: [
        {
          id: 'solana-devnet',
          name: 'Solana Devnet',
          symbol: 'SOL',
          chainId: 0,
          rpcUrl: '',
          explorerUrl: 'https://solscan.io',
          isTestnet: true,
          nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
        },
      ],
    };
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
