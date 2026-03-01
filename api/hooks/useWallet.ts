/**
 * Wallet Hooks
 * React Query hooks for wallet operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
    staleTime: 15 * 1000, // 15 seconds - balance becomes stale faster
    refetchInterval: 45 * 1000, // Refetch every 45 seconds (more frequent for balance)
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
 * Get deposit address mutation
 */
export function useGetDepositAddress() {
  return useMutation({
    mutationFn: (data: GetDepositAddressRequest) => walletService.getDepositAddress(data),
  });
}

/**
 * Get token prices
 */
export function useTokenPrices(tokenIds: string[]) {
  return useQuery({
    queryKey: queryKeys.wallet.prices(tokenIds),
    queryFn: () => walletService.getPrices({ tokenIds }),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
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
    queryFn: () => walletService.getWalletAddresses(chain ? { chain } : undefined),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    // Poll every 4s when wallet is being provisioned (404), stop once we have data
    refetchInterval: (q) => {
      if (q.state.data) return false;
      const status = (q.state.error as any)?.status;
      return status === 404 ? 4000 : false;
    },
    retry: (failureCount, error: any) => {
      const status = error?.status;
      if (status === 401 || status === 403) return false;
      // Keep retrying 404 (provisioning in progress) up to 15 times (~1 min)
      if (status === 404) return failureCount < 15;
      return failureCount < 1;
    },
    retryDelay: 4000,
  });

  const isProvisioning = !query.data && (query.error as any)?.status === 404;
  return { ...query, isProvisioning };
}
