/**
 * React Query Configuration
 * Sets up QueryClient with default options for caching, retries, and error handling
 */

import { QueryClient } from '@tanstack/react-query';
import type { ApiError } from './types';
import { safeError } from '../utils/logSanitizer';

/**
 * Default query options
 */
const defaultQueryOptions = {
  queries: {
    // Time before a query is considered stale (5 minutes)
    staleTime: 5 * 60 * 1000,
    
    // Time before inactive queries are garbage collected (10 minutes)
    gcTime: 10 * 60 * 1000,
    
    // Retry failed requests
    retry: (failureCount: number, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.error?.code?.startsWith('4')) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    
    // Retry delay with exponential backoff
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Don't refetch on window focus by default (can be overridden per query)
    refetchOnWindowFocus: false,
    
    // Refetch on reconnect
    refetchOnReconnect: true,
    
    // Refetch on mount if data is stale
    refetchOnMount: true,
  },
  
  mutations: {
    // Retry mutations once
    retry: 1,
    
    // Error handling for mutations
    onError: (error: Error) => {
      // Global error handling for mutations
      if (__DEV__) {
        safeError('[Mutation Error]', error);
      }
      
      // You can add global error notifications here
      // e.g., Toast.show({ type: 'error', message: error.message });
    },
  },
};

/**
 * Create and export query client
 */
export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
});

/**
 * Query key factory for consistent key generation
 */
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
    passcode: () => [...queryKeys.auth.all, 'passcode'] as const,
  },
  
  // Portfolio
  portfolio: {
    all: ['portfolio'] as const,
    overview: () => [...queryKeys.portfolio.all, 'overview'] as const,
  },
  
  // Wallet
  wallet: {
    all: ['wallet'] as const,
    balance: () => [...queryKeys.wallet.all, 'balance'] as const,
    transactions: (filters?: any) => 
      [...queryKeys.wallet.all, 'transactions', filters] as const,
    transaction: (id: string) => 
      [...queryKeys.wallet.all, 'transaction', id] as const,
    prices: (tokenIds: string[]) => 
      [...queryKeys.wallet.all, 'prices', tokenIds] as const,
    networks: () => [...queryKeys.wallet.all, 'networks'] as const,
    addresses: (chain?: string) => 
      [...queryKeys.wallet.all, 'addresses', chain] as const,
  },
  
  // User
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    settings: () => [...queryKeys.user.all, 'settings'] as const,
    kycStatus: () => [...queryKeys.user.all, 'kyc-status'] as const,
    notifications: (filters?: any) => 
      [...queryKeys.user.all, 'notifications', filters] as const,
    devices: () => [...queryKeys.user.all, 'devices'] as const,
  },
};

/**
 * Helper to invalidate related queries
 */
export const invalidateQueries = {
  auth: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.all }),
  portfolio: () => queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all }),
  wallet: () => queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all }),
  user: () => queryClient.invalidateQueries({ queryKey: queryKeys.user.all }),
  all: () => queryClient.invalidateQueries(),
};

export default queryClient;
