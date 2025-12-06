import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { TrendingUp, Layers, Bitcoin, AlertCircle } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import type { SelectedAsset, AssetType } from '../BasketCreationFlow';

interface AllocationStepProps {
  assets: SelectedAsset[];
  onNext: (assets: SelectedAsset[]) => void;
  onBack: () => void;
}

export const AllocationStep: React.FC<AllocationStepProps> = ({
  assets,
  onNext,
  onBack,
}) => {
  const [allocations, setAllocations] = useState<Record<string, string>>(
    assets.reduce((acc, asset) => {
      acc[asset.id] = asset.allocation > 0 ? asset.allocation.toString() : '';
      return acc;
    }, {} as Record<string, string>)
  );

  const totalAllocation = useMemo(() => {
    return Object.values(allocations).reduce((sum, val) => {
      const num = parseFloat(val);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  }, [allocations]);

  const remainingAllocation = 100 - totalAllocation;
  const isValid = totalAllocation === 100;

  const handleAllocationChange = (assetId: string, value: string) => {
    // Only allow numbers and decimals
    const cleaned = value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
    
    // Limit to 2 decimal places
    const withDecimals = formatted.includes('.')
      ? `${formatted.split('.')[0]}.${formatted.split('.')[1]?.slice(0, 2) || ''}`
      : formatted;

    setAllocations((prev) => ({
      ...prev,
      [assetId]: withDecimals,
    }));
  };

  const distributeEvenly = () => {
    const evenSplit = (100 / assets.length).toFixed(2);
    const newAllocations: Record<string, string> = {};
    
    assets.forEach((asset, index) => {
      if (index === assets.length - 1) {
        // Last asset gets the remainder to ensure 100%
        const sumSoFar = Object.values(newAllocations).reduce(
          (sum, val) => sum + parseFloat(val),
          0
        );
        newAllocations[asset.id] = (100 - sumSoFar).toFixed(2);
      } else {
        newAllocations[asset.id] = evenSplit;
      }
    });
    
    setAllocations(newAllocations);
  };

  const getAssetIcon = (type: AssetType) => {
    switch (type) {
      case 'stock':
        return <TrendingUp size={16} color="#6B7280" strokeWidth={2} />;
      case 'etf':
        return <Layers size={16} color="#6B7280" strokeWidth={2} />;
      case 'crypto':
        return <Bitcoin size={16} color="#6B7280" strokeWidth={2} />;
    }
  };

  const handleNext = () => {
    if (isValid) {
      const updatedAssets = assets.map((asset) => ({
        ...asset,
        allocation: parseFloat(allocations[asset.id] || '0'),
      }));
      onNext(updatedAssets);
    }
  };

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Allocation Summary */}
        <View className="mb-6 rounded-2xl bg-[#F9FAFB] p-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-[16px] font-body-semibold text-gray-600">
              Total Allocated
            </Text>
            <Text
              className={`text-[32px] font-body-bold ${
                totalAllocation > 100
                  ? 'text-red-600'
                  : totalAllocation === 100
                  ? 'text-[#4A90E2]'
                  : 'text-[#070914]'
              }`}
            >
              {totalAllocation.toFixed(1)}%
            </Text>
          </View>

          {/* Progress Bar */}
          <View className="mb-3 h-3 w-full overflow-hidden rounded-full bg-white">
            <View
              className={`h-full ${
                totalAllocation > 100
                  ? 'bg-red-500'
                  : totalAllocation === 100
                  ? 'bg-[#4A90E2]'
                  : 'bg-[#D4E7F7]'
              }`}
              style={{ width: `${Math.min(totalAllocation, 100)}%` }}
            />
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-[14px] font-body-medium text-gray-500">
              {remainingAllocation > 0 ? 'Remaining' : remainingAllocation < 0 ? 'Exceeded' : 'Complete'}
            </Text>
            <Text
              className={`text-[16px] font-body-bold ${
                remainingAllocation === 0 ? 'text-[#4A90E2]' : remainingAllocation < 0 ? 'text-red-600' : 'text-gray-700'
              }`}
            >
              {Math.abs(remainingAllocation).toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Quick Action */}
        <TouchableOpacity
          onPress={distributeEvenly}
          className="mb-6 flex-row items-center justify-center rounded-2xl border border-[#D4E7F7] bg-[#F0F8FF] py-3"
          activeOpacity={0.7}
        >
          <Text className="text-[15px] font-body-bold text-[#4A90E2]">
            Distribute Evenly ({(100 / assets.length).toFixed(1)}% each)
          </Text>
        </TouchableOpacity>

        {/* Asset Allocations */}
        <Text className="mb-4 text-[16px] font-body-bold text-[#070914]">
          Set Allocation for Each Asset
        </Text>

        {assets.map((asset, index) => (
          <View
            key={asset.id}
            className="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-[#F9FAFB]"
          >
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-1 flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
                  {getAssetIcon(asset.type)}
                </View>
                <View className="flex-1">
                  <Text className="text-[16px] font-body-bold text-[#070914]">
                    {asset.symbol}
                  </Text>
                  <Text className="text-[13px] font-body-medium text-gray-500">
                    {asset.name}
                  </Text>
                </View>
              </View>

              {/* Allocation Input */}
              <View className="flex-row items-center gap-2">
                <TextInput
                  value={allocations[asset.id]}
                  onChangeText={(value) => handleAllocationChange(asset.id, value)}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  className="w-20 rounded-xl border border-gray-300 bg-white px-3 py-2 text-right text-[18px] font-body-bold text-[#070914]"
                  maxLength={6}
                />
                <Text className="text-[18px] font-body-bold text-[#070914]">%</Text>
              </View>
            </View>

            {/* Visual Allocation Bar */}
            {allocations[asset.id] && parseFloat(allocations[asset.id]) > 0 && (
              <View className="px-4 pb-3">
                <View className="h-2 w-full overflow-hidden rounded-full bg-white">
                  <View
                    className="h-full bg-[#4A90E2]"
                    style={{
                      width: `${Math.min(parseFloat(allocations[asset.id]), 100)}%`,
                    }}
                  />
                </View>
              </View>
            )}
          </View>
        ))}

        {/* Validation Message */}
        {totalAllocation > 100 && (
          <View className="mt-4 flex-row items-start gap-3 rounded-xl bg-red-50 p-4">
            <AlertCircle size={20} color="#DC2626" strokeWidth={2} />
            <View className="flex-1">
              <Text className="text-[14px] font-body-bold text-red-900">
                Total exceeds 100%
              </Text>
              <Text className="mt-1 text-[13px] font-body-medium text-red-700">
                Please reduce allocations by {(totalAllocation - 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        )}

        {totalAllocation < 100 && totalAllocation > 0 && (
          <View className="mt-4 flex-row items-start gap-3 rounded-xl bg-[#F0F8FF] p-4">
            <AlertCircle size={20} color="#4A90E2" strokeWidth={2} />
            <View className="flex-1">
              <Text className="text-[14px] font-body-bold text-blue-900">
                {remainingAllocation.toFixed(1)}% remaining
              </Text>
              <Text className="mt-1 text-[13px] font-body-medium text-blue-700">
                Allocate the remaining percentage to complete your basket
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer Actions */}
      <View className="border-t border-gray-100 px-6 py-4">
        <Button
          title="Continue to Investment"
          onPress={handleNext}
          disabled={!isValid}
          className="mb-3 bg-[#070914]"
        />
      </View>
    </View>
  );
};
