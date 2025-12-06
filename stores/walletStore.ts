import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { walletService } from '../api/services';
import { encryptObject, decryptObject } from '../utils/encryption';
import { safeError } from '../utils/logSanitizer';
import type { Token, Transaction } from '@/lib/domain/wallet/models';
import { MOCK_TOKENS, MOCK_TRANSACTIONS } from '@/__mocks__/wallet.mock';
import { ERROR_MESSAGES } from '@/lib/constants/messages';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type { Token, Transaction } from '@/lib/domain/wallet/models';

interface WalletState {
  // Balances
  tokens: Token[];
  totalBalanceUSD: number;
  
  // Transactions
  transactions: Transaction[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Selected items
  selectedToken: Token | null;
}

interface WalletActions {
  // Token operations
  fetchTokens: () => Promise<void>;
  updateTokenBalance: (tokenId: string, balance: number) => void;
  refreshPrices: () => Promise<void>;
  
  // Transaction operations
  fetchTransactions: () => Promise<void>;
  addTransaction: (transaction: Transaction) => void;
  updateTransactionStatus: (txId: string, status: Transaction['status']) => void;
  
  // Selection
  setSelectedToken: (token: Token | null) => void;
  
  // Calculations
  calculateTotalBalance: () => void;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Reset
  reset: () => void;
}



const initialState: WalletState = {
  tokens: MOCK_TOKENS,
  totalBalanceUSD: 0,
  transactions: MOCK_TRANSACTIONS,
  isLoading: false,
  error: null,
  selectedToken: null,
};

// Custom storage with encryption for sensitive wallet data
const createEncryptedStorage = () => ({
  getItem: async (name: string) => {
    try {
      const encrypted = await AsyncStorage.getItem(name);
      if (encrypted) {
        return JSON.parse(decryptObject(encrypted));
      }
      return null;
    } catch (error) {
      console.error('Encrypted storage getItem error:', error);
      return null;
    }
  },
  setItem: async (name: string, value: any) => {
    try {
      const encrypted = encryptObject(value);
      await AsyncStorage.setItem(name, encrypted);
    } catch (error) {
      console.error('Encrypted storage setItem error:', error);
    }
  },
  removeItem: async (name: string) => {
    try {
      await AsyncStorage.removeItem(name);
    } catch (error) {
      console.error('Encrypted storage removeItem error:', error);
    }
  },
});

export const useWalletStore = create<WalletState & WalletActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Token operations
      fetchTokens: async () => {
        set({ isLoading: true, error: null });
        try {
          const balance = await walletService.getBalance();
          
          if (!balance || !balance.tokens) {
            throw new Error('Invalid response from wallet service');
          }
          
          // Transform API response to match store structure
          const tokens: Token[] = balance.tokens.map((token: any) => {
            if (!token.symbol || !token.name) {
              safeError('[WalletStore] Invalid token data', { hasSymbol: !!token.symbol, hasName: !!token.name });
              return null;
            }
            return {
              id: token.symbol.toLowerCase(),
              symbol: token.symbol,
              name: token.name,
              balance: parseFloat(token.balance) || 0,
              usdValue: parseFloat(token.usdValue) || 0,
              priceChange: token.priceChange24h || 0,
              network: token.network || 'Solana',
              icon: token.symbol.toLowerCase(),
            };
          }).filter(Boolean) as Token[];
          
          if (tokens.length === 0) {
            safeError('[WalletStore] No valid tokens received, using mock data');
            set({
              tokens: MOCK_TOKENS,
              isLoading: false,
            });
          } else {
            set({
              tokens,
              isLoading: false,
            });
          }
          
          get().calculateTotalBalance();
        } catch (error: any) {
          safeError('[WalletStore] Failed to fetch tokens:', error);
          const errorMessage = error?.error?.message || error?.message || ERROR_MESSAGES.WALLET.LOAD_FAILED;
          
          // Fallback to mock data if API fails
          set({
            tokens: MOCK_TOKENS,
            error: errorMessage,
            isLoading: false,
          });
          get().calculateTotalBalance();
        }
      },

      updateTokenBalance: (tokenId: string, balance: number) => {
        const { tokens } = get();
        const updatedTokens = tokens.map((token: Token) =>
          token.id === tokenId
            ? { ...token, balance, usdValue: balance }
            : token
        );
        
        set({ tokens: updatedTokens });
        get().calculateTotalBalance();
      },

      refreshPrices: async () => {
        set({ isLoading: true });
        try {
          const { tokens } = get();
          const tokenIds = tokens.map((t: Token) => t.symbol);
          
          // Fetch latest prices from API
          const pricesResponse = await walletService.getPrices({ tokenIds });
          
          const updatedTokens = tokens.map((token: Token) => {
            const priceData = pricesResponse.prices.find(p => p.symbol === token.symbol);
            return {
              ...token,
              priceChange: priceData?.priceChange24h || 0,
              usdValue: token.balance * (parseFloat(priceData?.price || '1')),
            };
          });
          
          set({
            tokens: updatedTokens,
            isLoading: false,
          });
          
          get().calculateTotalBalance();
        } catch (error) {
          safeError('[WalletStore] Failed to refresh prices:', error);
          set({
            error: error instanceof Error ? error.message : ERROR_MESSAGES.WALLET.LOAD_FAILED,
            isLoading: false,
          });
        }
      },

      // Transaction operations
      fetchTransactions: async () => {
        set({ isLoading: true, error: null });
        try {
          const txResponse = await walletService.getTransactions({ limit: 50 });
          
          // Transform API transactions to store format
          const transactions: Transaction[] = txResponse.data.map((tx: any) => ({
            id: tx.id,
            type: tx.type as Transaction['type'],
            token: {
              id: tx.tokenId.toLowerCase(),
              symbol: tx.tokenId,
              name: tx.tokenId,
              balance: 0,
              usdValue: parseFloat(tx.usdAmount),
              priceChange: 0,
              network: 'Solana',
              icon: tx.tokenId.toLowerCase(),
            },
            amount: tx.amount,
            usdAmount: tx.usdAmount,
            from: tx.from,
            to: tx.to,
            timestamp: tx.timestamp,
            status: tx.status as Transaction['status'],
            txHash: tx.txHash,
            fee: tx.fee,
          }));
          
          set({
            transactions,
            isLoading: false,
          });
        } catch (error) {
          safeError('[WalletStore] Failed to fetch transactions:', error);
          // Fallback to mock data if API fails
          set({
            transactions: MOCK_TRANSACTIONS,
            error: error instanceof Error ? error.message : ERROR_MESSAGES.WALLET.LOAD_FAILED,
            isLoading: false,
          });
        }
      },

      addTransaction: (transaction: Transaction) => {
        const { transactions } = get();
        set({ transactions: [transaction, ...transactions] });
      },

      updateTransactionStatus: (txId: string, status: Transaction['status']) => {
        const { transactions } = get();
        const updatedTransactions = transactions.map((tx: Transaction) =>
          tx.id === txId ? { ...tx, status } : tx
        );
        set({ transactions: updatedTransactions });
      },

      // Selection
      setSelectedToken: (token: Token | null) => {
        set({ selectedToken: token });
      },

      // Calculations
      calculateTotalBalance: () => {
        const { tokens } = get();
        const total = tokens.reduce((sum: number, token: Token) => sum + token.usdValue, 0);
        set({ totalBalanceUSD: total });
      },

      // Error handling
      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      // Reset
      reset: () => {
        set({
          ...initialState,
          tokens: MOCK_TOKENS,
          transactions: MOCK_TRANSACTIONS,
        });
        get().calculateTotalBalance();
      },
    }),
    {
      name: 'wallet-storage',
      storage: createEncryptedStorage(),
      partialize: (state: WalletState & WalletActions) => ({
        tokens: state.tokens,
        transactions: state.transactions,
        selectedToken: state.selectedToken,
      }),
    }
  )
);
