import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { ArrowRight, ExternalLink } from 'lucide-react-native';
import { TransactionDetails } from '@/stores/withdrawalStore';

interface TransactionSuccessViewProps {
  transaction: TransactionDetails | null;
}

export const TransactionSuccessView: React.FC<TransactionSuccessViewProps> = ({ transaction }) => {
  if (!transaction) return null;

  const handleViewOnExplorer = () => {
    // Open Solscan or appropriate explorer
    const explorerUrl = `https://solscan.io/tx/${transaction.txHash}`;
    Linking.openURL(explorerUrl).catch(() => {});
  };

  return (
    <ScrollView className="flex-1 bg-white px-6" showsVerticalScrollIndicator={false}>
      {/* View on Explorer Link */}
      <TouchableOpacity
        onPress={handleViewOnExplorer}
        className="mb-4 mt-2 min-h-[44px] flex-row items-center self-end px-2"
        activeOpacity={0.7}
        accessibilityRole="link"
        accessibilityLabel="View transaction on Solscan"
        accessibilityHint="Opens in browser">
        <Text className="font-body-medium mr-1 text-[12px] text-[#8B5CF6]">View on Solscan</Text>
        <ExternalLink size={12} color="#8B5CF6" strokeWidth={2} />
      </TouchableOpacity>

      {/* Amount & Status */}
      <View className="mb-8 items-center">
        <Text className="font-body-bold mb-2 text-[40px] text-[#0B1120]">
          {transaction.usdAmount}
        </Text>
        <View className="mb-3 flex-row items-center">
          <Text className="font-body-medium mr-3 text-[16px] text-[#6B7280]">
            {transaction.amount}
          </Text>
          <View className="flex-row items-center rounded-full bg-[#10B981] px-3 py-1">
            <View className="mr-2 h-2 w-2 rounded-full bg-white" />
            <Text className="font-body-bold text-[11px] text-white">Successful</Text>
          </View>
        </View>
      </View>

      {/* Token Transfer Visual */}
      <View className="mb-6 flex-row items-center justify-center">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-[#2775CA]">
          <Text className="text-lg font-bold text-white">$</Text>
        </View>
        <View className="mx-4 flex-row items-center">
          <View className="h-0.5 w-8 bg-[#E5E7EB]" />
          <ArrowRight size={16} color="#6B7280" className="mx-1" />
          <View className="h-0.5 w-8 bg-[#E5E7EB]" />
        </View>
        <View className="h-12 w-12 items-center justify-center rounded-full bg-[#8B5CF6]">
          <Text className="font-semibold text-white">
            {transaction.recipientName.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Transaction Info Card */}
      <View className="mb-6 rounded-3xl bg-[#F8FAFC] p-5">
        {/* Timestamp */}
        {transaction.timestamp && (
          <View className="mb-5">
            <Text className="font-body-medium text-center text-[12px] text-[#6B7280]">
              {transaction.timestamp}
            </Text>
          </View>
        )}

        {/* From */}
        <View className="mb-4">
          <Text className="font-body-medium mb-2 text-[12px] text-[#6B7280]">From</Text>
          <View className="flex-row items-center justify-between">
            <Text className="font-body-medium text-[14px] text-[#0B1120]">
              {transaction.fromAccount}
            </Text>
            <View className="flex-row items-center rounded-lg bg-white px-2 py-1">
              <View className="mr-1 h-1 w-1 rounded-full bg-[#6B7280]" />
              <Text className="font-body-medium text-[11px] text-[#6B7280]">
                {transaction.fromAddress}
              </Text>
            </View>
          </View>
        </View>

        {/* Receiving Address */}
        <View className="mb-4">
          <Text className="font-body-medium mb-2 text-[12px] text-[#6B7280]">
            Receiving address
          </Text>
          <View className="flex-row items-center justify-between">
            <Text className="font-body-medium text-[14px] text-[#0B1120]">
              {transaction.recipientName}
            </Text>
            <Text className="font-body-medium rounded-lg bg-white px-2 py-1 text-[11px] text-[#6B7280]">
              {transaction.recipientAddress}
            </Text>
          </View>
        </View>

        {/* Token */}
        <View className="mb-4">
          <Text className="font-body-medium mb-2 text-[12px] text-[#6B7280]">Token</Text>
          <View className="flex-row items-center justify-between">
            <Text className="font-body-bold text-[14px] text-[#0B1120]">{transaction.amount}</Text>
            <Text className="font-body-medium text-[12px] text-[#6B7280]">
              {transaction.usdAmount}
            </Text>
          </View>
        </View>

        {/* Network */}
        <View className="mb-4">
          <Text className="font-body-medium mb-2 text-[12px] text-[#6B7280]">Network</Text>
          <View className="flex-row items-center">
            <View className="h-7 w-7 items-center justify-center rounded-full bg-[#14F195]">
              <Text className="font-body-bold text-[11px] text-[#0B1120]">S</Text>
            </View>
            <Text className="font-body-medium ml-2 text-[12px] text-[#0B1120]">
              {transaction.fromNetwork.name}
            </Text>
            <ArrowRight size={14} color="#6B7280" strokeWidth={2} style={{ marginHorizontal: 8 }} />
            <View className="h-7 w-7 items-center justify-center rounded-full bg-[#627EEA]">
              <Text className="font-body-bold text-[11px] text-white">E</Text>
            </View>
            <Text className="font-body-medium ml-2 text-[12px] text-[#0B1120]">
              {transaction.toNetwork.name}
            </Text>
          </View>
        </View>

        {/* Fee */}
        <View className="mb-4">
          <Text className="font-body-medium mb-2 text-[12px] text-[#6B7280]">Fee</Text>
          <View className="flex-row items-center">
            <View className="mr-2 h-5 w-5 items-center justify-center rounded-full bg-red-500">
              <Text className="text-[10px] text-white">⛽</Text>
            </View>
            <Text className="font-body-medium text-[12px] text-[#0B1120]">{transaction.fee}</Text>
          </View>
        </View>

        {/* Bridge Provider */}
        <View>
          <Text className="font-body-medium mb-2 text-[12px] text-[#6B7280]">Bridge provider</Text>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="mr-2 h-5 w-5 items-center justify-center rounded-full bg-[#8B5CF6]">
                <Text className="font-body-bold text-[10px] text-white">B</Text>
              </View>
              <Text className="font-body-medium text-[12px] text-[#0B1120]">
                {transaction.bridgeProvider.name}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};
