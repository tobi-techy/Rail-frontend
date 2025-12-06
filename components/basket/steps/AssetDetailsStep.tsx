import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import type { AssetType } from '../BasketCreationFlow';

interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  price: number;
  logoColor: string;
  logoInitials: string;
  description?: string;
  marketCap?: string;
  volume?: string;
  change24h?: number;
}

interface AssetDetailsStepProps {
  asset: Asset;
  onSelect: (asset: Asset) => void;
  onBack: () => void;
}

export const AssetDetailsStep: React.FC<AssetDetailsStepProps> = ({
  asset,
  onSelect,
  onBack,
}) => {
  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="border-b border-gray-100 px-6 pb-4 pt-3">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={onBack}
            className="mr-4 h-10 w-10 items-center justify-center"
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
          <Text className="flex-1 text-[17px] font-body-semibold text-[#000000]">
            Asset Details
          </Text>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Asset Header */}
        <View className="items-center border-b border-gray-100 px-6 py-8">
          <View 
            className="mb-4 h-[80px] w-[80px] items-center justify-center rounded-full"
            style={{ backgroundColor: asset.logoColor }}
          >
            <Text className="text-[32px] font-body-bold text-white">
              {asset.logoInitials}
            </Text>
          </View>
          <Text className="text-[24px] font-body-bold text-[#000000]">
            {asset.name}
          </Text>
          <Text className="mt-1 text-[17px] font-body text-[#8E8E93]">
            {asset.symbol}
          </Text>
          <Text className="mt-4 text-[32px] font-body-bold text-[#000000]">
            ${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          {asset.change24h !== undefined && (
            <Text 
              className="mt-2 text-[15px] font-body-semibold"
              style={{ color: asset.change24h >= 0 ? '#34C759' : '#FF3B30' }}
            >
              {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}% (24h)
            </Text>
          )}
        </View>

        {/* Asset Info */}
        <View className="px-6 py-6">
          <Text className="mb-4 text-[20px] font-body-bold text-[#000000]">
            About
          </Text>
          <Text className="text-[15px] font-body leading-6 text-[#3C3C43]">
            {asset.description || `${asset.name} (${asset.symbol}) is a ${asset.type === 'stock' ? 'publicly traded stock' : asset.type === 'etf' ? 'exchange-traded fund' : 'cryptocurrency'} available for investment. View real-time pricing and add to your basket to start building your portfolio.`}
          </Text>

          {/* Stats Grid */}
          <View className="mt-6">
            <View className="mb-4 flex-row justify-between rounded-2xl bg-[#F5F5F5] p-4">
              <View>
                <Text className="text-[13px] font-body text-[#8E8E93]">
                  Type
                </Text>
                <Text className="mt-1 text-[17px] font-body-semibold text-[#000000]">
                  {asset.type.toUpperCase()}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-[13px] font-body text-[#8E8E93]">
                  Price
                </Text>
                <Text className="mt-1 text-[17px] font-body-semibold text-[#000000]">
                  ${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            {asset.marketCap && (
              <View className="mb-4 rounded-2xl bg-[#F5F5F5] p-4">
                <Text className="text-[13px] font-body text-[#8E8E93]">
                  Market Cap
                </Text>
                <Text className="mt-1 text-[17px] font-body-semibold text-[#000000]">
                  {asset.marketCap}
                </Text>
              </View>
            )}

            {asset.volume && (
              <View className="mb-4 rounded-2xl bg-[#F5F5F5] p-4">
                <Text className="text-[13px] font-body text-[#8E8E93]">
                  24h Volume
                </Text>
                <Text className="mt-1 text-[17px] font-body-semibold text-[#000000]">
                  {asset.volume}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-6 py-4">
        <TouchableOpacity
          onPress={() => onSelect(asset)}
          className="w-full items-center justify-center rounded-full bg-[#FB088F] py-4"
          activeOpacity={0.8}
        >
          <Text className="text-[17px] font-body-semibold text-white">
            Select Asset
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

