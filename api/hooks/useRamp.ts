/**
 * RampHub React Query Hooks
 * NGN on/off ramp — fund with Naira, withdraw to local bank account.
 * Status values: pending | paid | processing | completed | failed  (all lowercase)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rampService } from '../services/ramp.service';
import { useAuthStore } from '../../stores/authStore';

export const rampKeys = {
  all: ['ramp'] as const,
  quote: (side: string, amount: number, currency: string) =>
    [...rampKeys.all, 'quote', side, amount, currency] as const,
  banks: () => [...rampKeys.all, 'banks'] as const,
  orders: () => [...rampKeys.all, 'orders'] as const,
  orderStatus: (id: string) => [...rampKeys.all, 'order', id] as const,
};

const isTerminalStatus = (status?: string) => status === 'completed' || status === 'failed';

/** Best rate for a corridor. Uses a probe amount when none is entered yet. */
export function useRampQuote(side: 'onramp' | 'offramp', amount = 10_000, currency = 'NGN') {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: rampKeys.quote(side, amount, currency),
    queryFn: () => rampService.getQuote(side, amount, currency),
    enabled: isAuthenticated,
    staleTime: 5 * 60_000, // no background interval (Redis cost); refresh on focus — rates move slowly enough
  });
}

/** List of Nigerian banks supported by RampHub */
export function useRampBanks() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: rampKeys.banks(),
    queryFn: () => rampService.getBanks(),
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  });
}

/** Resolve a bank account number to get the account holder name */
export function useRampResolveBankAccount() {
  return useMutation({
    mutationFn: ({
      bankCode,
      accountNumber,
      bankName,
    }: {
      bankCode: string;
      accountNumber: string;
      bankName?: string;
    }) => rampService.resolveBankAccount(bankCode, accountNumber, bankName),
  });
}

/** Create NGN → USDC deposit order */
export function useRampOnramp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ amount, currency = 'NGN' }: { amount: number; currency?: string }) =>
      rampService.createOnramp(amount, currency),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funding'] });
      queryClient.invalidateQueries({ queryKey: ['station'] });
      queryClient.invalidateQueries({ queryKey: ['gameplay'] });
    },
  });
}

/** Create USDC → NGN withdrawal order (passcode-protected endpoint) */
export function useRampOfframp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bankCode,
      accountNumber,
      amount,
      currency = 'NGN',
      bankName,
      category,
      expectedRate,
    }: {
      bankCode: string;
      accountNumber: string;
      amount: number;
      currency?: string;
      bankName?: string;
      category?: string;
      expectedRate?: number;
    }) =>
      rampService.createOfframp(
        bankCode,
        accountNumber,
        amount,
        currency,
        bankName,
        category,
        expectedRate
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funding'] });
      queryClient.invalidateQueries({ queryKey: ['station'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: rampKeys.orders() });
    },
  });
}

/** User's ramp order history */
export function useRampOrders() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: rampKeys.orders(),
    queryFn: () => rampService.getOrders(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

/** Poll order status until terminal (completed | failed).
 *  Push notifications via deposit_confirmed invalidate ['ramp'] and snap the
 *  screen instantly, so this poll is only a fallback — 15 s keeps it well above
 *  the backend's 5-s Redis rate-limit window and roughly halves the Redis cost
 *  of an in-progress deposit/withdrawal versus the old 8 s. */
export function useRampOrderStatus(transactionId: string, enabled = true) {
  return useQuery({
    queryKey: rampKeys.orderStatus(transactionId),
    queryFn: () => rampService.getOrderStatus(transactionId),
    enabled: enabled && !!transactionId,
    refetchInterval: (query) => {
      if (isTerminalStatus(query.state.data?.status)) return false;
      return 15_000;
    },
    staleTime: 0,
  });
}
