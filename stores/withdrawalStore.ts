import { create } from 'zustand';
import { walletService } from '../api/services';
import type { Token, Network } from '@/lib/domain/wallet/models';
import { MOCK_TOKENS } from '@/__mocks__/wallet.mock';
import { ERROR_MESSAGES } from '@/lib/constants/messages';

export type { Token, Network } from '@/lib/domain/wallet/models';

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

const MOCK_RECIPIENTS: Recipient[] = [
  {
    id: '1',
    name: 'Solana Wallet 1',
    type: 'address',
    address: '8gVkP2aGZxK4u3Hj9JkMPVz7eQQaQ2W5FnE4cTdR3xYq',
  },
  {
    id: '2',
    name: 'Solana Wallet 2',
    type: 'address',
    address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  },
];

const MOCK_NETWORKS: Network[] = [
  { id: 'solana', name: 'Solana', symbol: 'SOL', icon: 'solana' },
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
  accountName: 'Solana Account',
  accountAddress: '8gVkP2aGZxK4u3Hj9JkMPVz7eQQaQ2W5FnE4cTdR3xYq',
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
    
    const numAmount = parseFloat(amount);
    const usdAmount = (numAmount * 1).toFixed(2); // Assuming 1:1 for USDC
    
    const transaction: TransactionDetails = {
      fromAccount: accountName,
      fromAddress: accountAddress,
      recipientName: recipientAddress.slice(0, 6) + '...' + recipientAddress.slice(-4),
      recipientAddress: recipientAddress,
      token: selectedToken,
      amount: `${numAmount.toFixed(2)} ${selectedToken.symbol}`,
      usdAmount: `$${usdAmount}`,
      fromNetwork: { id: 'solana', name: 'Solana', symbol: 'SOL', icon: 'solana' },
      toNetwork: { id: 'solana', name: 'Solana', symbol: 'SOL', icon: 'solana' },
      fee: '0.00001 SOL',
      bridgeProvider: { id: 'solana', name: 'Solana Network', estimatedTime: '1-2 seconds' },
    };
    
    set({ transaction });
  },

  submitWithdrawal: async () => {
    if (!get().validateAmount()) return;
    
    set({ showConfirmModal: false, step: 'processing', isLoading: true });
    
    try {
      const { recipientAddress, selectedToken, amount } = get();
      
      if (!selectedToken || !recipientAddress || !amount) {
        throw new Error('Missing required fields');
      }
      
      // Call real API to create transfer
      const response = await walletService.createTransfer({
        toAddress: recipientAddress,
        tokenId: selectedToken.symbol,
        amount,
        network: selectedToken.network, // Use network from selected token
      });
      
      // Update transaction with real data from API
      const transaction = get().transaction;
      if (transaction) {
        transaction.timestamp = new Date(response.transaction.timestamp).toLocaleString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        transaction.txHash = response.transaction.txHash || response.transaction.id;
        set({ transaction });
      }
      
      // Success
      set({ step: 'success', isLoading: false });
    } catch (error) {
      console.error('[WithdrawalStore] Withdrawal failed:', error);
      set({ 
        step: 'amount',
        showConfirmModal: false,
        isLoading: false,
        errors: { 
          general: error instanceof Error ? error.message : ERROR_MESSAGES.WALLET.TRANSFER_FAILED
        }
      });
    }
  },

  // Validation
  validateAmount: () => {
    const { amount, selectedToken } = get();
    const numAmount = parseFloat(amount);
    
    if (!amount || amount === '0') {
      set({ errors: { amount: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD } });
      return false;
    }
    
    if (isNaN(numAmount) || numAmount <= 0) {
      set({ errors: { amount: ERROR_MESSAGES.VALIDATION.INVALID_AMOUNT } });
      return false;
    }
    
    if (selectedToken && numAmount > selectedToken.balance) {
      set({ errors: { amount: ERROR_MESSAGES.WALLET.INSUFFICIENT_BALANCE } });
      return false;
    }
    
    return true;
  },

  validateAddress: () => {
    const { recipientAddress } = get();
    
    if (!recipientAddress.trim()) {
      set({ errors: { address: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD } });
      return false;
    }
    
    const isValidSolanaAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(recipientAddress);
    
    if (!isValidSolanaAddress) {
      set({ errors: { address: ERROR_MESSAGES.WALLET.INVALID_ADDRESS } });
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