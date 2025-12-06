import React, { useState, useMemo } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { BasketInfoStep } from './steps/BasketInfoStep';
import { AssetSelectionStep, Asset } from './steps/AssetSelectionStep';
import { AssetDetailsStep } from './steps/AssetDetailsStep';
import { AllocationStep } from './steps/AllocationStep';
import { InvestmentAmountStep } from './steps/InvestmentAmountStep';

export type AssetType = 'stock' | 'etf' | 'crypto';

export interface SelectedAsset {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  allocation: number;
  currentPrice?: number;
}

export interface BasketInfo {
  name: string;
  ticker: string;
  description: string;
  lockPeriod: string;
  maturityDate?: string;
}

interface BasketCreationFlowProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (data: {
    basketInfo: BasketInfo;
    assets: SelectedAsset[];
    investmentAmount: string;
  }) => void;
}

type FlowStep = 'info' | 'selection' | 'assetDetails' | 'allocation' | 'amount';

export const BasketCreationFlow: React.FC<BasketCreationFlowProps> = ({
  visible,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('info');
  const [basketInfo, setBasketInfo] = useState<BasketInfo>({
    name: '',
    ticker: '',
    description: '',
    lockPeriod: '1m',
  });
  const [selectedAssets, setSelectedAssets] = useState<SelectedAsset[]>([]);
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('0');

  const stepProgress = useMemo(() => {
    const steps: FlowStep[] = ['info', 'selection', 'allocation', 'amount'];
    let currentIndex = steps.indexOf(currentStep);
    // Don't count assetDetails in progress as it's a sub-step
    if (currentStep === 'assetDetails') {
      currentIndex = steps.indexOf('selection');
    }
    return ((currentIndex + 1) / steps.length) * 100;
  }, [currentStep]);

  const handleNextFromInfo = (info: BasketInfo) => {
    setBasketInfo(info);
    setCurrentStep('selection');
  };

  const handleAssetPress = (asset: Asset) => {
    setCurrentAsset(asset);
    setCurrentStep('assetDetails');
  };

  const handleSelectAsset = (asset: Asset) => {
    // Add the selected asset to the list if not already present
    const isAlreadySelected = selectedAssets.some(a => a.id === asset.id);
    if (!isAlreadySelected) {
      const newAsset: SelectedAsset = {
        id: asset.id,
        symbol: asset.symbol,
        name: asset.name,
        type: asset.type,
        allocation: 0,
        currentPrice: asset.price,
      };
      setSelectedAssets([...selectedAssets, newAsset]);
    }
    // Go back to selection screen
    setCurrentStep('selection');
    setCurrentAsset(null);
  };

  const handleBackFromAssetDetails = () => {
    setCurrentStep('selection');
    setCurrentAsset(null);
  };

  const handleNextFromSelection = (assets: SelectedAsset[]) => {
    setSelectedAssets(assets);
    setCurrentStep('allocation');
  };

  const handleNextFromAllocation = (assets: SelectedAsset[]) => {
    setSelectedAssets(assets);
    setCurrentStep('amount');
  };

  const handleComplete = (amount: string) => {
    onComplete({
      basketInfo,
      assets: selectedAssets,
      investmentAmount: amount,
    });
    handleClose();
  };

  const handleBack = () => {
    const stepOrder: FlowStep[] = ['info', 'selection', 'allocation', 'amount'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentStep === 'assetDetails') {
      setCurrentStep('selection');
      setCurrentAsset(null);
    } else if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleClose = () => {
    setCurrentStep('info');
    setBasketInfo({ name: '', ticker: '', description: '', lockPeriod: '1m' });
    setSelectedAssets([]);
    setCurrentAsset(null);
    setInvestmentAmount('0');
    onClose();
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'info':
        return 'Create Basket';
      case 'selection':
        return 'Select Assets';
      case 'assetDetails':
        return 'Asset Details';
      case 'allocation':
        return 'Allocate Percentages';
      case 'amount':
        return 'Investment Amount';
      default:
        return '';
    }
  };

  const getStepNumber = () => {
    const steps: FlowStep[] = ['info', 'selection', 'allocation', 'amount'];
    let currentIndex = steps.indexOf(currentStep);
    // Don't count assetDetails in step number as it's a sub-step
    if (currentStep === 'assetDetails') {
      currentIndex = steps.indexOf('selection');
    }
    return currentIndex + 1;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="border-b border-gray-100 px-6 pb-4 pt-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-[24px] font-body-bold text-[#070914]">
                {getStepTitle()}
              </Text>
              <Text className="mt-1 text-[14px] font-body-medium text-gray-500">
                Step {getStepNumber()} of 4
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
              activeOpacity={0.7}
            >
              <X size={20} color="#070914" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View className="mt-4 h-1 w-full overflow-hidden rounded-full bg-gray-100">
            <View
              className="h-full bg-[#FB088F] transition-all duration-300"
              style={{ width: `${stepProgress}%` }}
            />
          </View>
        </View>

        {/* Step Content */}
        <View className="flex-1">
          {currentStep === 'info' && (
            <BasketInfoStep
              initialData={basketInfo}
              onNext={handleNextFromInfo}
              onBack={handleClose}
            />
          )}

          {currentStep === 'selection' && (
            <AssetSelectionStep
              initialAssets={selectedAssets}
              onNext={handleNextFromSelection}
              onBack={handleBack}
              onAssetPress={handleAssetPress}
            />
          )}

          {currentStep === 'assetDetails' && currentAsset && (
            <AssetDetailsStep
              asset={currentAsset}
              onSelect={handleSelectAsset}
              onBack={handleBackFromAssetDetails}
            />
          )}

          {currentStep === 'allocation' && (
            <AllocationStep
              assets={selectedAssets}
              onNext={handleNextFromAllocation}
              onBack={handleBack}
            />
          )}

          {currentStep === 'amount' && (
            <InvestmentAmountStep
              basketName={basketInfo.name}
              assets={selectedAssets}
              onComplete={handleComplete}
              onBack={handleBack}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};
