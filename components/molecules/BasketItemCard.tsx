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
    <View className={`bg-white border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden ${className || ''}`}>
      
      {/* Header with code and badges */}
      <View className="flex-row justify-between items-center px-[14px] pt-3 pb-2">
        <Text className="text-gray-800 font-body-bold  text-[18px]">{code}</Text>
        <View className="flex-row">
          {badges.map((badge, index) => (
            <View 
              key={index} 
              className="w-6 h-6 rounded-full items-center justify-center ml-1"
              style={{ backgroundColor: badge.color }}
            >
              {badge.icon && <Ionicons name={badge.icon} size={14} color="white" />}
            </View>
          ))}
        </View>
      </View>
      
      {/* Status indicator */}
      <View className="px-[14px] pb-2">
        <View className={`flex-row items-center ${status === 'Safe' ? 'bg-green-100' : 'bg-orange-100'} rounded-full px-2 py-[2px] self-start`}>
          <View className={`w-2 h-2 rounded-full ${status === 'Safe' ? 'bg-green-500' : 'bg-orange-500'} mr-1`} />
          <Text className={`text-xs font-medium ${status === 'Safe' ? 'text-green-700' : 'text-orange-700'}`}>{status}</Text>
        </View>
      </View>
      
      {/* AUM and performance indicators */}
      <View className="flex-row justify-between px-[14px] pb-3">
        <View className="flex-row items-center">
          <Ionicons name="wallet-outline" size={16} color="#6B7280" />
          <Text className="text-gray-700 font-body-medium ml-1 text-sm">{aum} <Text className='font-body-bold'>AUM</Text></Text>
        </View>
        
        <View className="flex-row items-center">
          <View className={`w-5 h-5 rounded-full items-center justify-center ${performanceType === 'positive' ? 'bg-green-100' : 'bg-red-100'} mr-1`}>
            <Ionicons 
              name={performanceType === 'positive' ? 'arrow-up' : 'arrow-down'} 
              size={12} 
              color={performanceType === 'positive' ? '#10B981' : '#EF4444'} 
            />
          </View>
          <Text 
            className={`font-medium text-sm ${performanceType === 'positive' ? 'text-green-600' : 'text-red-600'}`}
          >
            {performance}
          </Text>
        </View>
      </View>
    </View>
  );
};