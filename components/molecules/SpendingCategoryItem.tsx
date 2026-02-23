import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Icon } from '../atoms/Icon';

export interface SpendingCategoryItemProps {
  id: string;
  title: string;
  transactionCount: number;
  amount: number;
  percentage: number;
  iconName?: string;
  onPress?: () => void;
}

export const SpendingCategoryItem: React.FC<SpendingCategoryItemProps> = ({
  title,
  transactionCount,
  amount,
  percentage,
  iconName = 'layers-3',
  onPress,
}) => {
  const formattedAmount = amount < 0 ? `-$${Math.abs(amount).toFixed(2)}` : `$${amount.toFixed(2)}`;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center justify-between py-4">
      <View className="flex-row items-center">
        {/* Icon Circle */}
        <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-[#F4F5FA]">
          <Icon name={iconName} size={22} color="#555" />
        </View>

        {/* Title and Transaction Count */}
        <View>
          <Text className="font-body-bold text-[16px] text-[#111827]">{title}</Text>
          <Text className="mt-0.5 font-body text-[13px] text-[#6B7280]">
            {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Amount and Percentage */}
      <View className="items-end">
        <Text className="font-subtitle text-[16px] text-[#111827]">{formattedAmount}</Text>
        <Text className="mt-0.5 font-body text-[12px] text-[#9CA3AF]">{percentage}%</Text>
      </View>
    </TouchableOpacity>
  );
};
