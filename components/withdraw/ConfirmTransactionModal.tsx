import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { ArrowRight, ChevronRight } from 'lucide-react-native';
import { TransactionDetails } from '@/stores/withdrawalStore';

interface ConfirmTransactionModalProps {
  visible: boolean;
  transaction: TransactionDetails | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const ConfirmTransactionModal: React.FC<ConfirmTransactionModalProps> = ({
  visible,
  transaction,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!transaction) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        className="flex-1 bg-black/50 justify-center items-center px-6"
        onPress={onClose}
      >
        {/* Modal Content */}
        <Pressable 
          className="w-full max-w-md bg-white rounded-3xl overflow-hidden"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="px-6 pt-6 pb-5">
            <Text className="text-[20px] font-body-bold text-[#0B1120] text-center mb-2">
              Confirm Transaction
            </Text>
            <Text className="text-[12px] font-body-medium text-[#6B7280] text-center leading-5">
              Please review all details carefully, transactions once{'\n'}completed are irreversible.
            </Text>
          </View>

          {/* Amount */}
          <View className="items-center pb-6 px-6">
            <Text className="text-[40px] font-body-bold text-[#0B1120] mb-1">
              {transaction.usdAmount}
            </Text>
            <Text className="text-[16px] font-body-medium text-[#6B7280]">
              {transaction.amount}
            </Text>
          </View>

          {/* Transaction Details */}
          <View className="px-6 pb-4">
            {/* From */}
            <View className="mb-4">
              <Text className="text-[12px] font-body-medium text-[#6B7280] mb-2">From</Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-[14px] font-body-medium text-[#0B1120]">
                  {transaction.fromAccount}
                </Text>
                <View className="flex-row items-center bg-[#F3F4F6] rounded-lg px-2 py-1">
                  <View className="h-1 w-1 rounded-full bg-[#6B7280] mr-1" />
                  <Text className="text-[11px] font-body-medium text-[#6B7280]">
                    {transaction.fromAddress}
                  </Text>
                </View>
              </View>
            </View>

            {/* Receiving Address */}
            <View className="mb-4">
              <Text className="text-[12px] font-body-medium text-[#6B7280] mb-2">Receiving address</Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-[14px] font-body-medium text-[#0B1120]">
                  {transaction.recipientName}
                </Text>
                <Text className="text-[11px] font-body-medium text-[#6B7280] bg-[#F3F4F6] rounded-lg px-2 py-1">
                  {transaction.recipientAddress}
                </Text>
              </View>
            </View>

            {/* Token */}
            <View className="mb-4">
              <Text className="text-[12px] font-body-medium text-[#6B7280] mb-2">Token</Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-[14px] font-body-bold text-[#0B1120]">
                  {transaction.amount}
                </Text>
                <Text className="text-[12px] font-body-medium text-[#6B7280]">
                  {transaction.usdAmount}
                </Text>
              </View>
            </View>

            {/* Network */}
            <View className="mb-4">
              <Text className="text-[12px] font-body-medium text-[#6B7280] mb-2">Network</Text>
              <View className="flex-row items-center">
                <View className="h-7 w-7 items-center justify-center rounded-full bg-[#14F195]">
                  <Text className="text-[11px] font-body-bold text-[#0B1120]">S</Text>
                </View>
                <Text className="ml-2 text-[12px] font-body-medium text-[#0B1120]">
                  {transaction.fromNetwork.name}
                </Text>
                <ArrowRight size={14} color="#6B7280" strokeWidth={2} style={{ marginHorizontal: 8 }} />
                <View className="h-7 w-7 items-center justify-center rounded-full bg-[#627EEA]">
                  <Text className="text-[11px] font-body-bold text-white">E</Text>
                </View>
                <Text className="ml-2 text-[12px] font-body-medium text-[#0B1120]">
                  {transaction.toNetwork.name}
                </Text>
              </View>
            </View>

            {/* Fee */}
            <View className="mb-4">
              <Text className="text-[12px] font-body-medium text-[#6B7280] mb-2">Fee</Text>
              <View className="flex-row items-center">
                <View className="h-5 w-5 items-center justify-center rounded-full bg-red-500 mr-2">
                  <Text className="text-white text-[10px]">⛽</Text>
                </View>
                <Text className="text-[12px] font-body-medium text-[#0B1120]">
                  {transaction.fee}
                </Text>
              </View>
            </View>

            {/* Bridge Provider */}
            <View className="mb-2">
              <Text className="text-[12px] font-body-medium text-[#6B7280] mb-2">Bridge provider</Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="h-5 w-5 items-center justify-center rounded-full bg-[#8B5CF6] mr-2">
                    <Text className="text-white text-[10px] font-body-bold">B</Text>
                  </View>
                  <Text className="text-[12px] font-body-medium text-[#0B1120]">
                    {transaction.bridgeProvider.name}
                  </Text>
                </View>
                <ChevronRight size={14} color="#6B7280" strokeWidth={2} />
              </View>
            </View>
          </View>

          {/* Action Button */}
          <View className="px-6 pb-6 pt-4">
            <TouchableOpacity
              onPress={onConfirm}
              disabled={isLoading}
              className="bg-[#0B1120] rounded-2xl py-4 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-white text-[16px] font-body-bold">
                {isLoading ? 'Processing...' : 'Confirm'}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

