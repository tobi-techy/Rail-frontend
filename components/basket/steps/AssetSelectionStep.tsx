import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Search, ChevronRight, ArrowLeft } from 'lucide-react-native';
import type { SelectedAsset, AssetType } from '../BasketCreationFlow';

// Mock data - replace with actual API data
export const AVAILABLE_ASSETS = [
  // Stocks
  { 
    id: 'AMC', 
    symbol: 'AMC', 
    name: 'AMC Entertainment', 
    type: 'stock' as AssetType, 
    price: 178.50,
    logoColor: '#E11F26',
    logoInitials: 'AMC',
    description: 'AMC Entertainment Holdings, Inc. is an American movie theater chain. Founded in 1920, it has become the largest movie theater chain in the world.',
    marketCap: '$2.1B',
    volume: '$856M',
    change24h: 2.34
  },
  { 
    id: 'AMD', 
    symbol: 'AMD', 
    name: 'AMD', 
    type: 'stock' as AssetType, 
    price: 378.91,
    logoColor: '#000000',
    logoInitials: 'AMD',
    description: 'Advanced Micro Devices, Inc. is an American multinational semiconductor company that develops computer processors and related technologies.',
    marketCap: '$612B',
    volume: '$12.4B',
    change24h: -1.23
  },
  { 
    id: 'ARKB', 
    symbol: 'ARKB', 
    name: 'ARK 21Shares Bitcoin ETF', 
    type: 'etf' as AssetType, 
    price: 140.23,
    logoColor: '#F7931A',
    logoInitials: '₿',
    description: 'The ARK 21Shares Bitcoin ETF provides exposure to bitcoin through a traditional investment vehicle.',
    marketCap: '$3.2B',
    volume: '$245M',
    change24h: 5.67
  },
  { 
    id: 'ARKK', 
    symbol: 'ARKK', 
    name: 'ARK Innovation ETF', 
    type: 'etf' as AssetType, 
    price: 242.84,
    logoColor: '#1C1C1C',
    logoInitials: 'ARK',
    description: 'ARK Innovation ETF is an actively managed exchange-traded fund that invests in companies relevant to disruptive innovation.',
    marketCap: '$6.8B',
    volume: '$892M',
    change24h: 1.89
  },
  { 
    id: 'ARKX', 
    symbol: 'ARKX', 
    name: 'ARK Space Exploration & Innovation', 
    type: 'etf' as AssetType, 
    price: 495.22,
    logoColor: '#1C1C1C',
    logoInitials: 'ARK',
    description: 'ARK Space Exploration & Innovation ETF invests in companies that are leading the way in space exploration and innovation.',
    marketCap: '$524M',
    volume: '$78M',
    change24h: 3.12
  },
  { 
    id: 'ADBE', 
    symbol: 'ADBE', 
    name: 'Adobe', 
    type: 'stock' as AssetType, 
    price: 445.67,
    logoColor: '#FF0000',
    logoInitials: 'Ai',
    description: 'Adobe Inc. is an American multinational computer software company known for its creative software products like Photoshop, Illustrator, and Premiere Pro.',
    marketCap: '$203B',
    volume: '$4.2B',
    change24h: 0.87
  },
  { 
    id: 'BABA', 
    symbol: 'BABA', 
    name: 'Alibaba Group Holding Limited', 
    type: 'stock' as AssetType, 
    price: 381.29,
    logoColor: '#FF6A00',
    logoInitials: '阿',
    description: 'Alibaba Group is a Chinese multinational technology company specializing in e-commerce, retail, internet, and technology.',
    marketCap: '$234B',
    volume: '$8.9B',
    change24h: -2.45
  },
  { 
    id: 'BOXX', 
    symbol: 'BOXX', 
    name: 'Alpha Architect 1-3 Month Box ETF', 
    type: 'etf' as AssetType, 
    price: 234.56,
    logoColor: '#4A90E2',
    logoInitials: '↗',
    description: 'Alpha Architect 1-3 Month Box ETF provides exposure to short-term treasury securities with a focus on capital preservation.',
    marketCap: '$456M',
    volume: '$34M',
    change24h: 0.12
  },
  { 
    id: 'AMZN', 
    symbol: 'AMZN', 
    name: 'Amazon', 
    type: 'stock' as AssetType, 
    price: 43250.00,
    logoColor: '#000000',
    logoInitials: 'a',
    description: 'Amazon.com, Inc. is an American multinational technology company focusing on e-commerce, cloud computing, digital streaming, and artificial intelligence.',
    marketCap: '$1.8T',
    volume: '$45.6B',
    change24h: 1.56
  },
];

export interface Asset {
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

interface AssetSelectionStepProps {
  initialAssets: SelectedAsset[];
  onNext: (assets: SelectedAsset[]) => void;
  onBack: () => void;
  onAssetPress?: (asset: Asset) => void;
}

export const AssetSelectionStep: React.FC<AssetSelectionStepProps> = ({
  initialAssets,
  onNext,
  onBack,
  onAssetPress,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssets = AVAILABLE_ASSETS.filter((asset) => {
    const matchesSearch =
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleAssetPress = (asset: Asset) => {
    if (onAssetPress) {
      onAssetPress(asset);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="border-b border-gray-100 px-6 pb-4 pt-3">
        <View className="mb-4 flex-row items-center">
          <TouchableOpacity 
            onPress={onBack}
            className="mr-4 h-10 w-10 items-center justify-center"
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-[17px] font-body-semibold text-[#000000]">
            The market is closed
          </Text>
          <View className="h-10 w-10" />
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center rounded-xl bg-[#F5F5F5] px-4 py-3">
          <Search size={18} color="#8E8E93" strokeWidth={2.5} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search"
            placeholderTextColor="#8E8E93"
            className="ml-2 flex-1 text-[16px] font-body text-[#000000]"
          />
        </View>
      </View>

      {/* Stocks Section */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-3 px-6 text-[22px] font-body-bold text-[#000000]">
          Stocks
        </Text>

        {/* Asset List */}
        <View className="px-6">
          {filteredAssets.map((asset, index) => (
            <TouchableOpacity
              key={asset.id}
              onPress={() => handleAssetPress(asset)}
              className="flex-row items-center justify-between py-4"
              style={{
                borderBottomWidth: index < filteredAssets.length - 1 ? 1 : 0,
                borderBottomColor: '#F0F0F0',
              }}
              activeOpacity={0.6}
            >
              <View className="flex-1 flex-row items-center">
                {/* Asset Logo */}
                <View 
                  className="mr-4 h-[52px] w-[52px] items-center justify-center rounded-full"
                  style={{ backgroundColor: asset.logoColor }}
                >
                  <Text className="text-[18px] font-body-bold text-white">
                    {asset.logoInitials}
                  </Text>
                </View>

                {/* Asset Info */}
                <View className="flex-1">
                  <Text className="text-[17px] font-body-semibold text-[#000000]">
                    {asset.name}
                  </Text>
                  <Text className="mt-1 text-[15px] font-body text-[#8E8E93]">
                    {asset.symbol}
                  </Text>
                </View>
              </View>

              {/* Chevron */}
              <ChevronRight size={20} color="#C7C7CC" strokeWidth={2.5} />
            </TouchableOpacity>
          ))}

          {filteredAssets.length === 0 && (
            <View className="items-center py-16">
              <Text className="text-[17px] font-body text-[#8E8E93]">
                No assets found
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};
