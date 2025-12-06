import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { SendAmountKeypad } from '@/components/withdraw/SendAmountKeypad';
import { ConfirmTransactionModal } from '@/components/withdraw/ConfirmTransactionModal';
import { useWithdrawalStore } from '@/stores/withdrawalStore';
import { Button } from '@/components/ui';

export default function SendTokenScreen() {
  const {
    recipientAddress,
    selectedToken,
    amount,
    transaction,
    showConfirmModal,
    errors,
    isLoading,
    step,
    setRecipientAddress,
    handleNumberPress,
    handleDeletePress,
    setShowConfirmModal,
    prepareTransaction,
    submitWithdrawal,
    validateAmount,
    validateAddress,
    reset,
  } = useWithdrawalStore();

  // Navigate to success screen when transaction succeeds
  useEffect(() => {
    if (step === 'success') {
      router.push('/withdraw/success');
    }
  }, [step]);

  const handleBack = () => {
    router.dismiss();
  };

  const handleReview = () => {
    const isAmountValid = validateAmount();
    
    if (!isAmountValid) {
      return;
    }
    
    prepareTransaction();
    setShowConfirmModal(true);
  };

  const handleTokenPress = () => {
    // Open token selector (can be implemented as a modal)
    Alert.alert('Token Selector', 'This feature will allow selecting different tokens');
  };

  const handleConfirm = () => {
    submitWithdrawal();
  };

  const canReview = amount && parseFloat(amount) > 0 && recipientAddress.trim();

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-[#F3F4F6]">
        <TouchableOpacity
          onPress={handleBack}
          className="h-10 w-10 items-center justify-center"
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#0B1120" strokeWidth={2} />
        </TouchableOpacity>
        
        <Text className="text-[18px] font-body-bold  text-[#0B1120]">
          Send token
        </Text>
        
        <View className="w-10" />
      </View>

      {/* Content */}
      <SendAmountKeypad
        recipientAddress={recipientAddress}
        selectedToken={selectedToken}
        amount={amount}
        onAddressChange={setRecipientAddress}
        onTokenPress={handleTokenPress}
        onNumberPress={handleNumberPress}
        onDeletePress={handleDeletePress}
        addressError={errors.address}
      />

      {/* Error Message */}
      {errors.amount && (
        <View className="px-6 py-2">
          <Text className="text-[12px] font-body-medium text-red-500 text-center">
            {errors.amount}
          </Text>
        </View>
      )}

      {/* Review Button */}
      <View className="px-6 pb-6 pt-2">
        <Button
          title="Review"
          onPress={handleReview}
          disabled={!canReview}
        />
      </View>

      {/* Confirm Transaction Modal */}
      <ConfirmTransactionModal
        visible={showConfirmModal}
        transaction={transaction}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirm}
        isLoading={isLoading}
      />
    </SafeAreaView>
  );
}