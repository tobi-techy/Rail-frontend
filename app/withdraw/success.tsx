import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { TransactionSuccessView } from '@/components/withdraw/TransactionSuccessView';
import { useWithdrawalStore } from '@/stores/withdrawalStore';

export default function TransactionSuccessScreen() {
  const { transaction, reset } = useWithdrawalStore();

  const handleClose = () => {
    reset();
    router.dismissAll();
  };

  const handleSendAgain = () => {
    reset();
    router.replace('/withdraw/');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Content */}
      <TransactionSuccessView transaction={transaction} />

      {/* Action Buttons */}
      <View className="px-6 pb-6 pt-4">
        <TouchableOpacity
          onPress={handleClose}
          className="bg-[#F3F4F6] rounded-2xl py-4 items-center mb-3"
          activeOpacity={0.8}
        >
          <Text className="text-[#0B1120] text-[16px] font-body-bold">
            Close
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={handleSendAgain}
          className="bg-[#0B1120] rounded-2xl py-4 items-center"
          activeOpacity={0.8}
        >
          <Text className="text-white text-[16px] font-body-bold">
            Send again
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

