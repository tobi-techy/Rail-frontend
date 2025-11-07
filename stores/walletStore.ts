import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { walletService } from '../api/services';
import { encryptObject, decryptObject } from '../utils/encryption';

export interface Token {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  priceChange: number;
  network: string;
  icon: string;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap' | 'deposit' | 'withdraw';
  token: Token;
  amount: string;
  usdAmount: string;
  from?: string;
  to?: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
  fee?: string;
}

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

// Mock data - Solana tokens only
const MOCK_TOKENS: Token[] = [
  {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    balance: 199.9,
    usdValue: 199.9,
    priceChange: -0.01,
    network: 'Solana',
    icon: 'usdc',
  },
  {
    id: 'usdt',
    symbol: 'USDT',
    name: 'Tether',
    balance: 500,
    usdValue: 500,
    priceChange: 0.02,
    network: 'Solana',
    icon: 'usdt',
  },
  {
    id: 'sol',
    symbol: 'SOL',
    name: 'Solana',
    balance: 2.5,
    usdValue: 312.5,
    priceChange: 5.3,
    network: 'Solana',
    icon: 'sol',
  },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'receive',
    token: MOCK_TOKENS[0],
    amount: '50.00 USDC',
    usdAmount: '$50.00',
    from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    timestamp: new Date().toISOString(),
    status: 'completed',
    txHash: '0xabc123',
  },
];

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
        return decryptObject(encrypted);
      }
      return null;
    } catch (error) {
      console.error('Encrypted storage getItem error:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      const encrypted = encryptObject(JSON.parse(value));
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
          
          // Transform API response to match store structure
          const tokens: Token[] = balance.tokens.map(token => ({
            id: token.symbol.toLowerCase(),
            symbol: token.symbol,
            name: token.name,
            balance: parseFloat(token.balance),
            usdValue: parseFloat(token.usdValue),
            priceChange: token.priceChange24h || 0,
            network: token.network || 'Solana',
            icon: token.symbol.toLowerCase(),
          }));
          
          set({
            tokens,
            isLoading: false,
          });
          
          get().calculateTotalBalance();
        } catch (error) {
          console.error('[WalletStore] Failed to fetch tokens:', error);
          // Fallback to mock data if API fails
          set({
            tokens: MOCK_TOKENS,
            error: error instanceof Error ? error.message : 'Failed to fetch tokens',
            isLoading: false,
          });
          get().calculateTotalBalance();
        }
      },

      updateTokenBalance: (tokenId: string, balance: number) => {
        const { tokens } = get();
        const updatedTokens = tokens.map(token =>
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
          const tokenIds = tokens.map(t => t.symbol);
          
          // Fetch latest prices from API
          const pricesResponse = await walletService.getPrices({ tokenIds });
          
          const updatedTokens = tokens.map(token => {
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
          console.error('[WalletStore] Failed to refresh prices:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to refresh prices',
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
          const transactions: Transaction[] = txResponse.data.map(tx => ({
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
          console.error('[WalletStore] Failed to fetch transactions:', error);
          // Fallback to mock data if API fails
          set({
            transactions: MOCK_TRANSACTIONS,
            error: error instanceof Error ? error.message : 'Failed to fetch transactions',
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
        const updatedTransactions = transactions.map(tx =>
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
        const total = tokens.reduce((sum, token) => sum + token.usdValue, 0);
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
      partialize: (state) => ({
        tokens: state.tokens, // Sensitive: balances and holdings
        transactions: state.transactions, // Sensitive: transaction history
        selectedToken: state.selectedToken,
      }),
    }
  )
);
