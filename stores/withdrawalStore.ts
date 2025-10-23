import { create } from 'zustand';

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

export interface Network {
  id: string;
  name: string;
  symbol: string;
  icon: string;
}

export interface BridgeProvider {
  id: string;
  name: string;
  estimatedTime: string;
}

export interface Recipient {
  id: string;
  name: string;
  type: 'ens' | 'address';
  address: string;
}

export interface TransactionDetails {
  fromAccount: string;
  fromAddress: string;
  recipientName: string;
  recipientAddress: string;
  token: Token;
  amount: string;
  usdAmount: string;
  fromNetwork: Network;
  toNetwork: Network;
  fee: string;
  bridgeProvider: BridgeProvider;
  timestamp?: string;
  txHash?: string;
}

export interface WithdrawalState {
  // Selected data
  recipientAddress: string;
  selectedToken: Token | null;
  amount: string;
  
  // Transaction details
  transaction: TransactionDetails | null;
  
  // Validation states
  errors: {
    amount?: string;
    address?: string;
    general?: string;
  };
  
  // UI states
  isLoading: boolean;
  step: 'amount' | 'confirm' | 'processing' | 'success';
  showConfirmModal: boolean;
  
  // Available data
  availableRecipients: Recipient[];
  availableTokens: Token[];
  availableNetworks: Network[];
  
  // User data
  accountName: string;
  accountAddress: string;
}

export interface WithdrawalActions {
  // Selections
  setRecipientAddress: (address: string) => void;
  setSelectedToken: (token: Token) => void;
  setAmount: (amount: string) => void;
  
  // Modal controls
  setShowConfirmModal: (show: boolean) => void;
  
  // Navigation
  setStep: (step: WithdrawalState['step']) => void;
  goBack: () => void;
  
  // Keypad actions
  handleNumberPress: (num: string) => void;
  handleDeletePress: () => void;
  
  // Transaction
  prepareTransaction: () => void;
  submitWithdrawal: () => Promise<void>;
  
  // Validation
  validateAmount: () => boolean;
  validateAddress: () => boolean;
  clearErrors: () => void;
  
  // Reset
  reset: () => void;
}

// Mock data
const MOCK_RECIPIENTS: Recipient[] = [
  {
    id: '1',
    name: 'Dvn.eth',
    type: 'ens',
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  },
  {
    id: '2',
    name: 'Alice.eth',
    type: 'ens',
    address: '0x8c7e4f8a5d6b3c2e1f9a8b7c6d5e4f3a2b1c0d9e',
  },
];

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
];

const MOCK_NETWORKS: Network[] = [
  { id: 'solana', name: 'Solana', symbol: 'SOL', icon: 'solana' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', icon: 'ethereum' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC', icon: 'matic' },
];

const initialState: WithdrawalState = {
  recipientAddress: '',
  selectedToken: MOCK_TOKENS[0],
  amount: '',
  transaction: null,
  errors: {},
  isLoading: false,
  step: 'amount',
  showConfirmModal: false,
  availableRecipients: MOCK_RECIPIENTS,
  availableTokens: MOCK_TOKENS,
  availableNetworks: MOCK_NETWORKS,
  accountName: 'Account 1',
  accountAddress: '0X45679...',
};

export const useWithdrawalStore = create<WithdrawalState & WithdrawalActions>((set, get) => ({
  ...initialState,

  // Selections
  setRecipientAddress: (address: string) => {
    set({ recipientAddress: address });
    get().clearErrors();
  },

  setSelectedToken: (token: Token) => {
    set({ selectedToken: token, amount: '' });
    get().clearErrors();
  },

  setAmount: (amount: string) => {
    set({ amount });
    get().clearErrors();
  },

  // Modal controls
  setShowConfirmModal: (show: boolean) => {
    set({ showConfirmModal: show });
  },

  // Navigation
  setStep: (step: WithdrawalState['step']) => {
    set({ step });
  },

  goBack: () => {
    const { step } = get();
    if (step === 'amount') {
      // Can go back to previous screen or dismiss
    }
  },

  // Keypad actions
  handleNumberPress: (num: string) => {
    const { amount } = get();
    
    // Handle decimal point
    if (num === '.') {
      if (amount.includes('.')) return; // Already has decimal
      if (!amount) {
        set({ amount: '0.' });
        return;
      }
    }
    
    // Prevent leading zeros
    if (amount === '0' && num !== '.') {
      set({ amount: num });
      return;
    }
    
    // Limit decimal places to 2
    if (amount.includes('.')) {
      const [, decimals] = amount.split('.');
      if (decimals && decimals.length >= 2) return;
    }
    
    set({ amount: amount + num });
    get().clearErrors();
  },

  handleDeletePress: () => {
    const { amount } = get();
    if (amount) {
      set({ amount: amount.slice(0, -1) });
    }
  },

  // Transaction
  prepareTransaction: () => {
    const { recipientAddress, selectedToken, amount, accountName, accountAddress } = get();
    
    if (!recipientAddress || !selectedToken || !amount) return;
    
    // Check if it's an ENS name
    const isENS = recipientAddress.toLowerCase().endsWith('.eth');
    
    const numAmount = parseFloat(amount);
    const usdAmount = (numAmount * 1).toFixed(2); // Assuming 1:1 for USDC
    
    const transaction: TransactionDetails = {
      fromAccount: accountName,
      fromAddress: accountAddress,
      recipientName: isENS ? recipientAddress : recipientAddress.slice(0, 6) + '...' + recipientAddress.slice(-4),
      recipientAddress: isENS ? 'ENS ID' : recipientAddress,
      token: selectedToken,
      amount: `${numAmount.toFixed(2)} ${selectedToken.symbol}`,
      usdAmount: `$${usdAmount}`,
      fromNetwork: { id: 'solana', name: 'Solana', symbol: 'SOL', icon: 'solana' },
      toNetwork: { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', icon: 'ethereum' },
      fee: '0.00001 USDC',
      bridgeProvider: { id: 'bungee', name: 'Bungee', estimatedTime: '2-5 minutes' },
    };
    
    set({ transaction });
  },

  submitWithdrawal: async () => {
    if (!get().validateAmount()) return;
    
    set({ showConfirmModal: false, step: 'processing', isLoading: true });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add timestamp and tx hash
      const transaction = get().transaction;
      if (transaction) {
        transaction.timestamp = new Date().toLocaleString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        transaction.txHash = '0x' + Math.random().toString(16).substr(2, 64);
        set({ transaction });
      }
      
      // Success
      set({ step: 'success', isLoading: false });
    } catch (error) {
      set({ 
        step: 'amount',
        showConfirmModal: false,
        isLoading: false,
        errors: { 
          general: error instanceof Error ? error.message : 'Transaction failed. Please try again.' 
        }
      });
    }
  },

  // Validation
  validateAmount: () => {
    const { amount, selectedToken } = get();
    const numAmount = parseFloat(amount);
    
    if (!amount || amount === '0') {
      set({ errors: { amount: 'Please enter an amount' } });
      return false;
    }
    
    if (isNaN(numAmount) || numAmount <= 0) {
      set({ errors: { amount: 'Please enter a valid amount' } });
      return false;
    }
    
    if (selectedToken && numAmount > selectedToken.balance) {
      set({ errors: { amount: 'Insufficient balance' } });
      return false;
    }
    
    return true;
  },

  validateAddress: () => {
    const { recipientAddress } = get();
    
    if (!recipientAddress.trim()) {
      set({ errors: { address: 'Please enter a wallet address' } });
      return false;
    }
    
    // Basic validation for ENS or Ethereum address
    const isENS = recipientAddress.toLowerCase().endsWith('.eth');
    const isValidEthAddress = /^0x[a-fA-F0-9]{40}$/.test(recipientAddress);
    
    if (!isENS && !isValidEthAddress) {
      set({ errors: { address: 'Invalid wallet address or ENS name' } });
      return false;
    }
    
    return true;
  },

  clearErrors: () => {
    set({ errors: {} });
  },

  // Reset
  reset: () => {
    set({
      ...initialState,
      recipientAddress: '',
      selectedToken: get().selectedToken,
    });
  },
}));