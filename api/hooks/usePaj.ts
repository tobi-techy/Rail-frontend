/**
 * Paj Cash React Query Hooks
 * NGN on/off ramp — fund with Naira, withdraw to local bank account
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pajService } from '../services/paj.service';
import { useAuthStore } from '../../stores/authStore';

const pajKeys = {
  all: ['paj'] as const,
  rates: () => [...pajKeys.all, 'rates'] as const,
  banks: () => [...pajKeys.all, 'banks'] as const,
  savedBanks: () => [...pajKeys.all, 'savedBanks'] as const,
  orders: () => [...pajKeys.all, 'orders'] as const,
  orderStatus: (id: string) => [...pajKeys.all, 'order', id] as const,
};

/** Current NGN/USD exchange rates */
export function usePajRates() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: pajKeys.rates(),
    queryFn: () => pajService.getRates(),
    enabled: isAuthenticated,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/** List of Nigerian banks */
export function usePajBanks() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: pajKeys.banks(),
    queryFn: () => pajService.getBanks(),
    enabled: isAuthenticated,
    staleTime: 5 * 60_000, // banks don't change often
  });
}

/** User's saved bank accounts */
export function usePajSavedBanks() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: pajKeys.savedBanks(),
    queryFn: () => pajService.getSavedBanks(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

/** Trigger OTP for Paj session */
export function usePajInitiate() {
  return useMutation({
    mutationFn: () => pajService.initiate(),
  });
}

/** Verify OTP */
export function usePajVerify() {
  return useMutation({
    mutationFn: (otp: string) => pajService.verify(otp),
  });
}

/** Resolve bank account name */
export function usePajResolveBankAccount() {
  return useMutation({
    mutationFn: ({ bankId, accountNumber }: { bankId: string; accountNumber: string }) =>
      pajService.resolveBankAccount(bankId, accountNumber),
  });
}

/** Save a bank account */
export function usePajAddBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bankId, accountNumber }: { bankId: string; accountNumber: string }) =>
      pajService.addBankAccount(bankId, accountNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pajKeys.savedBanks() });
    },
  });
}

/** Create NGN → USDC deposit order */
export function usePajOnramp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ amount, currency = 'NGN' }: { amount: number; currency?: string }) =>
      pajService.createOnramp(amount, currency),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funding'] });
      queryClient.invalidateQueries({ queryKey: ['station'] });
      queryClient.invalidateQueries({ queryKey: ['gameplay'] });
    },
  });
}

/** Create USDC → NGN withdrawal order */
export function usePajOfframp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bankId,
      accountNumber,
      amount,
      currency = 'NGN',
    }: {
      bankId: string;
      accountNumber: string;
      amount: number;
      currency?: string;
    }) => pajService.createOfframp(bankId, accountNumber, amount, currency),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funding'] });
      queryClient.invalidateQueries({ queryKey: ['station'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: pajKeys.orders() });
    },
  });
}

/** User's Paj order history for transaction display */
export function usePajOrders() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: pajKeys.orders(),
    queryFn: () => pajService.getOrders(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

/** Poll order status */
export function usePajOrderStatus(orderId: string, enabled = true) {
  return useQuery({
    queryKey: pajKeys.orderStatus(orderId),
    queryFn: () => pajService.getOrderStatus(orderId),
    enabled: enabled && !!orderId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'COMPLETED' || status === 'FAILED') return false;
      return 5_000; // poll every 5s until terminal
    },
    staleTime: 0,
  });
}
