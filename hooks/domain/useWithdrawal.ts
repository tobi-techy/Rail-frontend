import { useWithdrawalStore } from '@/stores/withdrawalStore';
import { useMemo } from 'react';

export function useWithdrawal() {
  const store = useWithdrawalStore();

  const isValid = useMemo(() => {
    return store.validateAmount() && store.validateAddress();
  }, [store.amount, store.recipientAddress, store.selectedToken]);

  return {
    // State
    amount: store.amount,
    recipientAddress: store.recipientAddress,
    selectedToken: store.selectedToken,
    transaction: store.transaction,
    errors: store.errors,
    isLoading: store.isLoading,
    step: store.step,
    showConfirmModal: store.showConfirmModal,
    
    // Computed
    isValid,
    
    // Actions
    setAmount: store.setAmount,
    setRecipientAddress: store.setRecipientAddress,
    setSelectedToken: store.setSelectedToken,
    handleNumberPress: store.handleNumberPress,
    handleDeletePress: store.handleDeletePress,
    prepareTransaction: store.prepareTransaction,
    submitWithdrawal: store.submitWithdrawal,
    setShowConfirmModal: store.setShowConfirmModal,
    setStep: store.setStep,
    reset: store.reset,
  };
}
