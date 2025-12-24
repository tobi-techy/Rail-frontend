import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '../atoms/SafeIonicons';

interface BasketItemCardProps {
  code: string;
  status: 'Safe' | 'Review';
  aum: string;
  performance: string;
  performanceType: 'positive' | 'negative';
  badges: {
    color: string;
    icon?: string;
  }[];
  className?: string;
}

export const BasketItemCard: React.FC<BasketItemCardProps> = ({
  code,
  status,
  aum,
  performance,
  performanceType,
  badges,
  className,
}) => {
  return (
    <View
      className={`overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm ${className || ''}`}>
      {/* Header with code and badges */}
      <View className="flex-row items-center justify-between px-[14px] pb-[14px] pt-[14px]">
        <Text className="font-subtitle text-subtitle">{code}</Text>
        <View className="flex-row">
          {badges.map((badge, index) => (
            <View
              key={index}
              className="ml-1 h-6 w-6 items-center justify-center rounded-full"
              style={{ backgroundColor: badge.color }}>
              {badge.icon && <Ionicons name={badge.icon} size={14} color="white" />}
            </View>
          ))}
        </View>
      </View>

      {/* Status indicator */}
      {/*<View className="px-[14px] pb-2">
        <View
          className={`flex-row items-center ${status === 'Safe' ? 'bg-green-100' : 'bg-orange-100'} self-start rounded-full px-2 py-[2px]`}>
          <View
            className={`h-2 w-2 rounded-full ${status === 'Safe' ? 'bg-green-500' : 'bg-orange-500'} mr-1`}
          />
          <Text
            className={`text-xs font-medium ${status === 'Safe' ? 'text-green-700' : 'text-orange-700'}`}>
            {status}
          </Text>
        </View>
      </View>*/}

      {/* AUM and performance indicators */}
      <View className="flex-row justify-between px-[14px] pb-3">
        <View className="flex-row items-center">
          <Ionicons name="wallet-outline" size={16} color="#6B7280" />
          <Text className="ml-1 font-body text-sm text-gray-700">
            {aum} <Text className="font-body-bold">AUM</Text>
          </Text>
        </View>

        <View className="flex-row items-center">
          <View
            className={`h-5 w-5 items-center justify-center rounded-full ${performanceType === 'positive' ? 'bg-green-100' : 'bg-red-100'} mr-1`}>
            <Ionicons
              name={performanceType === 'positive' ? 'arrow-up' : 'arrow-down'}
              size={12}
              color={performanceType === 'positive' ? '#10B981' : '#EF4444'}
            />
          </View>
          <Text
            className={`font-body text-sm ${performanceType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
            {performance}
          </Text>
        </View>
      </View>
    </View>
  );
};
