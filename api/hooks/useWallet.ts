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
