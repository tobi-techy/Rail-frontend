import { useWalletStore } from '../../stores/walletStore';
import type { Token } from '../../lib/domain/wallet/models';

describe('walletStore', () => {
  beforeEach(() => {
    useWalletStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useWalletStore.getState();
      
      expect(state.tokens).toEqual(expect.any(Array));
      expect(state.transactions).toEqual(expect.any(Array));
      expect(state.totalBalanceUSD).toBe(0);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.selectedToken).toBeNull();
    });
  });

  describe('token operations', () => {
    it('should update token balance', () => {
      const store = useWalletStore.getState();
      const tokenId = 'btc';
      const newBalance = 2.5;
      
      store.updateTokenBalance(tokenId, newBalance);
      
      const updatedToken = store.tokens.find(t => t.id === tokenId);
      expect(updatedToken?.balance).toBe(newBalance);
    });

    it('should set selected token', () => {
      const store = useWalletStore.getState();
      const token: Token = {
        id: 'eth',
        symbol: 'ETH',
        name: 'Ethereum',
        balance: 1.5,
        balanceUSD: 3000,
        price: 2000,
        change24h: 5.2,
        network: 'ethereum',
        address: '0x123',
        icon: 'eth-icon',
      };
      
      store.setSelectedToken(token);
      
      expect(store.selectedToken).toEqual(token);
    });

    it('should clear selected token', () => {
      const store = useWalletStore.getState();
      const token: Token = {
        id: 'eth',
        symbol: 'ETH',
        name: 'Ethereum',
        balance: 1.5,
        balanceUSD: 3000,
        price: 2000,
        change24h: 5.2,
        network: 'ethereum',
        address: '0x123',
        icon: 'eth-icon',
      };
      
      store.setSelectedToken(token);
      expect(store.selectedToken).toEqual(token);
      
      store.setSelectedToken(null);
      expect(store.selectedToken).toBeNull();
    });
  });

  describe('transaction operations', () => {
    it('should add new transaction', () => {
      const store = useWalletStore.getState();
      const initialCount = store.transactions.length;
      
      const newTransaction = {
        id: 'tx-123',
        type: 'send' as const,
        tokenSymbol: 'BTC',
        amount: 0.5,
        amountUSD: 25000,
        timestamp: new Date().toISOString(),
        status: 'pending' as const,
        from: '0xabc',
        to: '0xdef',
      };
      
      store.addTransaction(newTransaction);
      
      expect(store.transactions).toHaveLength(initialCount + 1);
      expect(store.transactions[0]).toEqual(newTransaction);
    });

    it('should update transaction status', () => {
      const store = useWalletStore.getState();
      
      const transaction = {
        id: 'tx-456',
        type: 'send' as const,
        tokenSymbol: 'ETH',
        amount: 1.0,
        amountUSD: 2000,
        timestamp: new Date().toISOString(),
        status: 'pending' as const,
        from: '0xabc',
        to: '0xdef',
      };
      
      store.addTransaction(transaction);
      store.updateTransactionStatus('tx-456', 'completed');
      
      const updated = store.transactions.find(t => t.id === 'tx-456');
      expect(updated?.status).toBe('completed');
    });
  });

  describe('balance calculations', () => {
    it('should calculate total balance', () => {
      const store = useWalletStore.getState();
      
      store.calculateTotalBalance();
      
      expect(typeof store.totalBalanceUSD).toBe('number');
      expect(store.totalBalanceUSD).toBeGreaterThanOrEqual(0);
    });
  });

  describe('error handling', () => {
    it('should set error', () => {
      const store = useWalletStore.getState();
      const errorMessage = 'Failed to load wallet';
      
      store.setError(errorMessage);
      
      expect(store.error).toBe(errorMessage);
    });

    it('should clear error', () => {
      const store = useWalletStore.getState();
      
      store.setError('Some error');
      expect(store.error).not.toBeNull();
      
      store.clearError();
      expect(store.error).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      const store = useWalletStore.getState();
      
      store.setError('error');
      const token: Token = {
        id: 'btc',
        symbol: 'BTC',
        name: 'Bitcoin',
        balance: 1,
        balanceUSD: 50000,
        price: 50000,
        change24h: 2,
        network: 'bitcoin',
        address: 'bc1...',
        icon: 'btc-icon',
      };
      store.setSelectedToken(token);
      
      store.reset();
      
      expect(store.error).toBeNull();
      expect(store.selectedToken).toBeNull();
      expect(store.isLoading).toBe(false);
    });
  });
});