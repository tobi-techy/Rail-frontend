/**
 * React Query Configuration
 * Sets up QueryClient with default options for caching, retries, and error handling
 */

import { QueryClient } from '@tanstack/react-query';
import type { TransformedApiError } from './types';
import { safeWarn } from '../utils/logSanitizer';

function isTransformedApiError(error: unknown): error is TransformedApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as TransformedApiError).status === 'number'
  );
}

/**
 * Create and export query client
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: (failureCount, error: unknown) => {
        // Only skip retry for confirmed 4xx API errors
        if (isTransformedApiError(error) && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: false,
      onError: (error) => {
        if (__DEV__) safeWarn('[Mutation Error]', error);
      },
    },
  },
});

/**
 * Query key factory for consistent key generation
 */
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
    passcode: () => [...queryKeys.auth.all, 'passcode'] as const,
  },
  portfolio: {
    all: ['portfolio'] as const,
    overview: () => [...queryKeys.portfolio.all, 'overview'] as const,
  },
  station: {
    all: ['station'] as const,
    home: () => [...queryKeys.station.all, 'home'] as const,
  },
  wallet: {
    all: ['wallet'] as const,
    balance: () => [...queryKeys.wallet.all, 'balance'] as const,
    transactions: (filters?: unknown) =>
      [...queryKeys.wallet.all, 'transactions', filters] as const,
    transaction: (id: string) => [...queryKeys.wallet.all, 'transaction', id] as const,
    prices: (tokenIds: string[]) => [...queryKeys.wallet.all, 'prices', tokenIds] as const,
    networks: () => [...queryKeys.wallet.all, 'networks'] as const,
    addresses: (chain?: string) => [...queryKeys.wallet.all, 'addresses', chain] as const,
  },
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    settings: () => [...queryKeys.user.all, 'settings'] as const,
    kycBridgeLink: () => [...queryKeys.user.all, 'kyc-bridge-link'] as const,
    kycStatus: () => [...queryKeys.user.all, 'kyc-status'] as const,
    devices: () => [...queryKeys.user.all, 'devices'] as const,
  },
};

/**
 * Helper to invalidate related queries
 */
export const invalidateQueries = {
  auth: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.all }),
  portfolio: () => queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all }),
  station: () => queryClient.invalidateQueries({ queryKey: queryKeys.station.all }),
  wallet: () => queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all }),
  user: () => queryClient.invalidateQueries({ queryKey: queryKeys.user.all }),
  all: () => queryClient.invalidateQueries(),
};

export default queryClient;
