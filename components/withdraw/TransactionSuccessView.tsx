import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { ArrowRight, ExternalLink } from 'lucide-react-native';
import { TransactionDetails } from '@/stores/withdrawalStore';

interface TransactionSuccessViewProps {
  transaction: TransactionDetails | null;
}

export const TransactionSuccessView: React.FC<TransactionSuccessViewProps> = ({
  transaction,
}) => {
  if (!transaction) return null;

  const handleViewOnExplorer = () => {
    // Open Solscan or appropriate explorer
    const explorerUrl = `https://solscan.io/tx/${transaction.txHash}`;
    Linking.openURL(explorerUrl).catch(err => console.error('Failed to open URL:', err));
  };

  return (
    <ScrollView className="flex-1 bg-white px-6" showsVerticalScrollIndicator={false}>
      {/* View on Explorer Link */}
      <TouchableOpacity 
        onPress={handleViewOnExplorer}
        className="self-end flex-row items-center mb-4 mt-2"
        activeOpacity={0.7}
      >
        <Text className="text-[12px] font-body-medium text-[#8B5CF6] mr-1">
          View on Solscan
        </Text>
        <ExternalLink size={12} color="#8B5CF6" strokeWidth={2} />
      </TouchableOpacity>

      {/* Amount & Status */}
      <View className="items-center mb-8">
        <Text className="text-[40px] font-body-bold text-[#0B1120] mb-2">
          {transaction.usdAmount}
        </Text>
        <View className="flex-row items-center mb-3">
          <Text className="text-[16px] font-body-medium text-[#6B7280] mr-3">
            {transaction.amount}
          </Text>
          <View className="bg-[#10B981] rounded-full px-3 py-1 flex-row items-center">
            <View className="h-2 w-2 rounded-full bg-white mr-2" />
            <Text className="text-white text-[11px] font-body-bold">Successful</Text>
          </View>
        </View>
      </View>

      {/* Token Transfer Visual */}
      <View className="flex-row items-center justify-center mb-6">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-[#2775CA]">
          <Text className="text-white text-lg font-bold">$</Text>
        </View>
        <View className="mx-4 flex-row items-center">
          <View className="h-0.5 w-8 bg-[#E5E7EB]" />
          <ArrowRight size={16} color="#6B7280" className="mx-1" />
          <View className="h-0.5 w-8 bg-[#E5E7EB]" />
        </View>
        <View className="h-12 w-12 items-center justify-center rounded-full bg-[#8B5CF6]">
          <Text className="text-white font-semibold">
            {transaction.recipientName.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Transaction Info Card */}
      <View className="bg-[#F8FAFC] rounded-3xl p-5 mb-6">
        {/* Timestamp */}
        {transaction.timestamp && (
          <View className="mb-5">
            <Text className="text-[12px] font-body-medium text-[#6B7280] text-center">
              {transaction.timestamp}
            </Text>
          </View>
        )}

        {/* From */}
        <View className="mb-4">
          <Text className="text-[12px] font-body-medium text-[#6B7280] mb-2">From</Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-[14px] font-body-medium text-[#0B1120]">
              {transaction.fromAccount}
            </Text>
            <View className="flex-row items-center bg-white rounded-lg px-2 py-1">
              <View className="h-1 w-1 rounded-full bg-[#6B7280] mr-1" />
              <Text className="text-[11px] font-body-medium text-[#6B7280]">{transaction.fromAddress}</Text>
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
            <Text className="text-[11px] font-body-medium text-[#6B7280] bg-white rounded-lg px-2 py-1">
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
        <View>
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
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

