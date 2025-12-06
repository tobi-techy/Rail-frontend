/**
 * Wallet Hooks
 * React Query hooks for wallet operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { walletService } from '../services';
import { queryKeys, invalidateQueries } from '../queryClient';
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
 */
export function useWalletBalance() {
  return useQuery({
    queryKey: queryKeys.wallet.balance(),
    queryFn: () => walletService.getBalance(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
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

  return useMutation({
    mutationFn: (data: CreateTransferRequest) => walletService.createTransfer(data),
    onSuccess: () => {
      // Invalidate wallet queries to refresh balance and transactions
      invalidateQueries.wallet();
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
  return useQuery({
    queryKey: queryKeys.wallet.addresses(chain),
    queryFn: () => walletService.getWalletAddresses(chain ? { chain } : undefined),
    staleTime: 5 * 60 * 1000, // 5 minutes (addresses rarely change)
    refetchOnWindowFocus: false,
    refetchInterval: false, // Disable automatic refetch to prevent auth error spam
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (auth error) or 404 (not found)
      const errorCode = error?.error?.code;
      if (errorCode === 'HTTP_401' || errorCode === 'HTTP_404') {
        return false;
      }
      // Retry once for other errors
      return failureCount < 1;
    },
  });
}
