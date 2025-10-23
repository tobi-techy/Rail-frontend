import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { ChevronDown, XIcon } from 'lucide-react-native';
import { Token } from '@/stores/withdrawalStore';
import { InputField } from '../atoms/InputField';

interface SendAmountKeypadProps {
  recipientAddress: string;
  selectedToken: Token | null;
  amount: string;
  onAddressChange: (address: string) => void;
  onTokenPress: () => void;
  onNumberPress: (num: string) => void;
  onDeletePress: () => void;
  addressError?: string;
}

export const SendAmountKeypad: React.FC<SendAmountKeypadProps> = ({
  recipientAddress,
  selectedToken,
  amount,
  onAddressChange,
  onTokenPress,
  onNumberPress,
  onDeletePress,
  addressError,
}) => {
  const displayAmount = amount || '0';
  const numAmount = parseFloat(amount) || 0;
  const usdValue = selectedToken ? (numAmount * 1).toFixed(2) : '0.00';

  const keypadButtons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'delete'],
  ];

  return (
    <View className="flex-1 px-6 pt-6">
      {/* Wallet Address Input */}
      <View className="mb-2">
        <InputField
          label="Enter wallet address or ENS name"
          value={recipientAddress}
          onChangeText={onAddressChange}
          error={addressError}
        />
      </View>

      {/* Token Selector */}
      <TouchableOpacity
        onPress={onTokenPress}
        className="mb-8 flex-row items-center justify-between rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3"
        activeOpacity={0.7}
      >
        <View className="flex-row items-center flex-1">
          {selectedToken && (
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6]">
              <View className="h-6 w-6 items-center justify-center">
                {selectedToken.icon === 'usdc' && (
                  <View className="h-6 w-6 items-center justify-center rounded-full bg-[#2775CA]">
                    <Text className="text-white text-xs font-bold">$</Text>
                  </View>
                )}
                {selectedToken.icon === 'usdt' && (
                  <View className="h-6 w-6 items-center justify-center rounded-full bg-[#26A17B]">
                    <Text className="text-white text-xs font-bold">₮</Text>
                  </View>
                )}
              </View>
            </View>
          )}
          <View className="flex-1">
            <Text className="text-[20px] font-body-medium text-[#0B1120]">
              {selectedToken?.symbol || 'Select token'}
            </Text>
            <Text className="text-[14px] font-body-medium text-[#6B7280]">
              {selectedToken?.network || ''}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-[18px] font-body-bold text-[#0B1120]">
            ${selectedToken?.usdValue.toFixed(1) || '0.0'}
          </Text>
          <Text className={`text-[14px] font-body-bold ${
            (selectedToken?.priceChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {(selectedToken?.priceChange || 0) >= 0 ? '+' : ''}{selectedToken?.priceChange || 0}%
          </Text>
        </View>
        <ChevronDown size={20} color="#6B7280" strokeWidth={2} className="ml-2" />
      </TouchableOpacity>

      {/* Amount Display */}
      <View className="mb-8 items-center">
        <View className="flex-row items-center justify-center mb-2">
          <Text className="text-[50px] font-body-bold text-[#0B1120] mr-2">
            {displayAmount}
          </Text>
          <Text className="text-[50px] font-body-bold text-[#9CA3AF]">
            {selectedToken?.symbol || 'USDC'}
          </Text>
        </View>
        <Text className="text-[24px] font-body-medium text-[#6B7280]">
          ${usdValue}
        </Text>
      </View>

      {/* Keypad */}
      <View className="flex-1 justify-end pb-6">
        {keypadButtons.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row justify-between mb-4">
            {row.map((button) => (
              <TouchableOpacity
                key={button}
                onPress={() => {
                  if (button === 'delete') {
                    onDeletePress();
                  } else {
                    onNumberPress(button);
                  }
                }}
                className={`h-16 w-[30%] items-center justify-center rounded-2xl ${
                  button === 'delete' ? 'bg-transparent' : ''
                }`}
                activeOpacity={0.7}
              >
                {button === 'delete' ? (
                  <XIcon size={24} color="#0B1120" strokeWidth={2} />
                ) : (
                  <Text className="text-[24px] font-body-bold text-[#0B1120]">
                    {button}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

