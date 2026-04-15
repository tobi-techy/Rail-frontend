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
} from '../types';
import type { Transaction } from '../types/wallet';

const WALLET_ENDPOINTS = {
  BALANCE: '/v1/balances',
  TRANSACTIONS: '/v1/funding/transactions',
  TRANSACTION_DETAIL: '/v1/withdrawals/:id',
  TRANSFER: '/v1/withdrawals/crypto',
  DEPOSIT_ADDRESS: '/v1/funding/deposit/address',
  ADDRESSES: '/v1/wallets/:chain/address', // Full path: /api/v1/wallets/:chain/address
};

function isNotFoundError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'status' in error &&
    (error as { status?: number }).status === 404
  );
}

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

    const rows = Array.isArray(response)
      ? response
      : response?.transactions ||
        response?.items ||
        response?.withdrawals ||
        response?.data?.transactions ||
        response?.data?.items ||
        [];
    const items = rows.map((tx: any) => ({
      id: tx?.id || tx?.withdrawal_id || '',
      type: (tx?.type as Transaction['type']) || 'withdraw',
      tokenId: tx?.currency || 'USDC',
      amount: String(tx?.amount ?? '0'),
      usdAmount: String(tx?.amount ?? '0'),
      from: '',
      to: tx?.destination_address || tx?.address || '',
      timestamp: tx?.created_at || tx?.updated_at || new Date().toISOString(),
      status: tx?.status || 'pending',
      txHash: tx?.tx_hash || undefined,
      network: tx?.chain || tx?.destination_chain || 'SOL',
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
      type: (tx?.type as Transaction['type']) || 'withdraw',
      tokenId: 'USDC',
      amount: String(tx?.amount ?? '0'),
      usdAmount: String(tx?.amount ?? '0'),
      from: '',
      to: tx?.destination_address || '',
      timestamp: tx?.created_at || tx?.updated_at || new Date().toISOString(),
      status: tx?.status || 'pending',
      txHash: tx?.tx_hash || undefined,
      network: tx?.destination_chain || 'SOL',
      fee: undefined,
      confirmations: undefined,
    };
  },

  /**
   * Create transfer/withdrawal
   */
  async createTransfer(data: CreateTransferRequest): Promise<CreateTransferResponse> {
    const payload: any = {
      amount: parseFloat(data.amount),
      destination_address: data.toAddress,
    };

    // Include network if provided
    if (data.network) {
      payload.destination_chain = data.network;
    }

    let response: any;
    try {
      response = await apiClient.post<any>(WALLET_ENDPOINTS.TRANSFER, payload);
    } catch (error) {
      // Compatibility fallback for environments that have not mounted /withdrawals/crypto yet.
      if (isNotFoundError(error)) {
        response = await apiClient.post<any>(WALLET_ENDPOINTS.TRANSACTIONS, payload);
      } else {
        throw error;
      }
    }

    return {
      estimatedFee: '0',
      estimatedTime: '1-2 minutes',
      transaction: {
        id: response?.withdrawal_id || '',
        type: 'withdraw' as const,
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
    const address = (data.address || '').trim();
    const network = data.network?.toUpperCase() || 'SOL';

    let isValid = false;

    // Validate based on network type
    if (network === 'SOL' || network === 'SOL-DEVNET') {
      // Solana address validation (base58, 32-44 characters)
      isValid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    } else {
      // EVM chains (MATIC, CELO, BASE, AVAX, ETH) - Ethereum-style addresses
      // 0x prefix + 40 hex characters (with optional checksum)
      isValid = /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    return {
      valid: isValid,
      addressType: 'wallet',
      resolvedAddress: isValid ? address : undefined,
    };
  },

  /**
   * Estimate transaction fee via backend
   */
  async estimateFee(data: EstimateFeeRequest): Promise<EstimateFeeResponse> {
    try {
      const response = await apiClient.get<any>('/v1/withdrawals/fees', {
        params: {
          amount: data.amount,
          withdrawal_type: data.network?.startsWith('fiat') ? 'fiat' : 'crypto',
          source_chain: data.network || 'SOL',
          dest_chain: data.network || 'SOL',
          currency: 'USDC',
        },
      });
      return {
        fee: String(response?.fee_amount ?? '0'),
        feeUSD: String(response?.fee_usd ?? response?.fee_amount ?? '0'),
        estimatedTime: response?.estimated_time || '1-2 minutes',
      };
    } catch {
      // Fallback to zero fee if endpoint unavailable
      return { fee: '0', feeUSD: '0', estimatedTime: '1-2 minutes' };
    }
  },

  /**
   * Get deposit address for a token
   */
  async getDepositAddress(data: GetDepositAddressRequest): Promise<GetDepositAddressResponse> {
    const chain = data.network || 'SOL';
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
          id: 'solana',
          name: 'Solana',
          symbol: 'SOL',
          chainId: 0,
          rpcUrl: '',
          explorerUrl: 'https://solscan.io',
          isTestnet: false,
          nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
        },
        {
          id: 'polygon',
          name: 'Polygon',
          symbol: 'MATIC',
          chainId: 137,
          rpcUrl: '',
          explorerUrl: 'https://polygonscan.com',
          isTestnet: false,
          nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        },
        {
          id: 'celo',
          name: 'Celo',
          symbol: 'CELO',
          chainId: 42220,
          rpcUrl: '',
          explorerUrl: 'https://celoscan.io',
          isTestnet: false,
          nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
        },
        {
          id: 'tron',
          name: 'Tron',
          symbol: 'TRX',
          chainId: -1, // Tron uses a different chain ID system
          rpcUrl: '',
          explorerUrl: 'https://tronscan.org',
          isTestnet: false,
          nativeCurrency: { name: 'Tron', symbol: 'TRX', decimals: 6 },
        },
        {
          id: 'base',
          name: 'Base',
          symbol: 'ETH',
          chainId: 8453,
          rpcUrl: '',
          explorerUrl: 'https://basescan.org',
          isTestnet: false,
          nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
        },
        {
          id: 'avalanche',
          name: 'Avalanche',
          symbol: 'AVAX',
          chainId: 43114,
          rpcUrl: '',
          explorerUrl: 'https://snowscan.io',
          isTestnet: false,
          nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
        },
      ],
    };
  },

  /**
   * Get Solana wallet address
   */
  async getWalletAddresses(params?: GetWalletAddressesRequest): Promise<WalletAddressesResponse> {
    const chain = params?.chain || 'SOL';
    const endpoint = WALLET_ENDPOINTS.ADDRESSES.replace(':chain', chain);
    return apiClient.get<WalletAddressesResponse>(endpoint);
  },
};

export default walletService;
