/**
 * Wallet Hooks
 * React Query hooks for wallet operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../client';
import { walletService } from '../services';
import { queryKeys, invalidateQueries } from '../queryClient';
import { useAnalytics, ANALYTICS_EVENTS } from '../../utils/analytics';
import type {
  GetTransactionsRequest,
  CreateTransferRequest,
  ValidateAddressRequest,
  EstimateFeeRequest,
  GetDepositAddressRequest,
  GetPricesRequest,
  GetWalletAddressesRequest,
  WalletChain,
} from '../types';

/**
 * Get wallet balance
 * Optimized for fast loading with aggressive caching:
 * - Uses cached data immediately if available
 * - Refetches in background after 15 seconds (faster than 30s to show updates quicker)
 * - Refetches every 45 seconds (balance is critical, monitor frequently)
 * - Prefers cached data on mount (avoids zero flash)
 */
export function useWalletBalance() {
  return useQuery({
    queryKey: queryKeys.wallet.balance(),
    queryFn: () => walletService.getBalance(),
    staleTime: 2 * 60 * 1000, // 2 min — no background interval (Redis cost); refresh on focus/reconnect + mutation invalidation
    refetchOnWindowFocus: true, // Refetch when app comes to foreground
    refetchOnReconnect: true, // Refetch when connection restored
  });
}

/**
 * Get transactions
 */
export function useTransactions(params?: GetTransactionsRequest) {
  return useQuery({
    queryKey: queryKeys.wallet.transactions(params),
    queryFn: () => walletService.getTransactions(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Get single transaction details
 */
export function useTransaction(txId: string) {
  return useQuery({
    queryKey: queryKeys.wallet.transaction(txId),
    queryFn: () => walletService.getTransactionDetail(txId),
    enabled: !!txId,
  });
}

/**
 * Create transfer mutation
 */
export function useCreateTransfer() {
  const queryClient = useQueryClient();
  const { track } = useAnalytics();

  return useMutation({
    mutationFn: (data: CreateTransferRequest) => walletService.createTransfer(data),
    onSuccess: (response, variables) => {
      // Track transfer completed
      track(ANALYTICS_EVENTS.TRANSFER_COMPLETED, {
        transfer_id: response.transaction.id,
        amount: variables.amount,
        recipient: variables.toAddress?.slice(0, 6) + '...', // Partial for privacy
        network: variables.network,
      });

      // Invalidate wallet queries to refresh balance and transactions
      invalidateQueries.wallet();
    },
    onError: (error, variables) => {
      track(ANALYTICS_EVENTS.TRANSFER_FAILED, {
        amount: variables.amount,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Validate address mutation
 */
export function useValidateAddress() {
  return useMutation({
    mutationFn: (data: ValidateAddressRequest) => walletService.validateAddress(data),
  });
}

/**
 * Estimate fee mutation
 */
export function useEstimateFee() {
  return useMutation({
    mutationFn: (data: EstimateFeeRequest) => walletService.estimateFee(data),
  });
}

/**
 * Query-based withdrawal fee — auto-fetches the actual backend fee for a withdrawal.
 * Falls back to hardcoded values ($0.10 crypto, $1.00 fiat) while loading.
 */
export function useWithdrawalFee(params: {
  amount: number;
  type: 'crypto' | 'fiat';
  currency?: string;
  destChain?: string;
}) {
  return useQuery({
    queryKey: [...queryKeys.wallet.all, 'withdrawal-fee', params],
    queryFn: async () => {
      const response = await apiClient.get<any>('/v1/withdrawals/fees', {
        params: {
          type: params.type,
          amount: params.amount,
          currency: params.currency || (params.type === 'crypto' ? 'USDC' : 'USD'),
          dest_chain: params.destChain || 'SOL',
        },
      });
      return {
        fee: Number(response?.amount ?? 0),
        networkFee: Number(response?.breakdown?.network_fee ?? 0),
        serviceFee: Number(response?.breakdown?.service_fee ?? 0),
      };
    },
    enabled: params.amount > 0,
    staleTime: 60_000,
    placeholderData: {
      fee: params.type === 'crypto' ? 0.1 : 1.0,
      networkFee: params.type === 'crypto' ? 0.1 : 0,
      serviceFee: params.type === 'crypto' ? 0 : 1.0,
    },
  });
}

/**
 * Get deposit address mutation
 */
export function useGetDepositAddress() {
  return useMutation({
    mutationFn: (data: GetDepositAddressRequest) => walletService.getDepositAddress(data),
  });
}

/**
 * Query version — auto-fetches deposit address for a chain, creating the wallet if needed.
 */
export function useDepositAddress(chain: string) {
  return useQuery({
    queryKey: [...queryKeys.wallet.all, 'deposit-address', chain],
    queryFn: () => walletService.getDepositAddress({ tokenId: 'usdc', network: chain }),
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Get token prices
 */
export function useTokenPrices(tokenIds: string[]) {
  return useQuery({
    queryKey: queryKeys.wallet.prices(tokenIds),
    queryFn: () => walletService.getPrices({ tokenIds }),
    staleTime: 2 * 60 * 1000, // 2 min — no background interval (Redis cost); refresh on focus
    enabled: tokenIds.length > 0,
  });
}

/**
 * Get available networks
 */
export function useNetworks() {
  return useQuery({
    queryKey: queryKeys.wallet.networks(),
    queryFn: () => walletService.getNetworks(),
    staleTime: 60 * 60 * 1000, // 1 hour (networks rarely change)
  });
}

/**
 * Get wallet addresses, optionally filtered by chain
 *
 * Optimizations:
 * - 5min stale time (addresses rarely change)
 * - Cached per chain filter for efficient lookups
 * - Prevents refetch on window focus
 *
 * Note: Returns error if:
 * - 401: User not authenticated or token expired
 * - 404: Endpoint not implemented
 */
export function useWalletAddresses(chain?: WalletChain) {
  const query = useQuery({
    queryKey: queryKeys.wallet.addresses(chain),
    queryFn: async () => {
      // Use the deposit address endpoint which returns the liquidation address
      // (the correct address for receiving deposits) instead of the raw custody wallet.
      const result = await walletService.getDepositAddress({
        tokenId: 'usdc',
        network: chain || 'SOL',
      });
      return {
        address: result.address,
        chain: (chain || 'SOL') as WalletChain,
        status: 'live' as const,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      const status = error?.status;
      if (status === 401 || status === 403) return false;
      // Retry up to 5x if wallet is being provisioned
      if (status === 404 && error?.data?.provisioning) return failureCount < 5;
      if (status === 404) return false;
      return failureCount < 1;
    },
    retryDelay: (attempt) => Math.min(3000 * (attempt + 1), 15000),
  });

  const isProvisioning = (query.error as any)?.data?.provisioning === true;
  return { ...query, isProvisioning };
}
