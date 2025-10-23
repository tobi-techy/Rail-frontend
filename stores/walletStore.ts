import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

// Mock data
const MOCK_TOKENS: Token[] = [
  {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    balance: 199.9,
    usdValue: 199.9,
    priceChange: -0.01,
    network: 'USDC (SOL)',
    icon: 'usdc',
  },
  {
    id: 'usdt',
    symbol: 'USDT',
    name: 'Tether',
    balance: 500,
    usdValue: 500,
    priceChange: 0.02,
    network: 'USDT (ETH)',
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

export const useWalletStore = create<WalletState & WalletActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Token operations
      fetchTokens: async () => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Replace with actual API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          set({
            tokens: MOCK_TOKENS,
            isLoading: false,
          });
          
          get().calculateTotalBalance();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch tokens',
            isLoading: false,
          });
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
          // TODO: Replace with actual API call to get latest prices
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { tokens } = get();
          const updatedTokens = tokens.map(token => ({
            ...token,
            priceChange: (Math.random() - 0.5) * 10, // Mock price change
          }));
          
          set({
            tokens: updatedTokens,
            isLoading: false,
          });
          
          get().calculateTotalBalance();
        } catch (error) {
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
          // TODO: Replace with actual API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          set({
            transactions: MOCK_TRANSACTIONS,
            isLoading: false,
          });
        } catch (error) {
          set({
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
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tokens: state.tokens,
        transactions: state.transactions,
        selectedToken: state.selectedToken,
      }),
    }
  )
);
