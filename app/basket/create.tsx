import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { BasketInfoStep } from '@/components/basket/steps/BasketInfoStep';
import { AssetSelectionStep } from '@/components/basket/steps/AssetSelectionStep';
import { AllocationStep } from '@/components/basket/steps/AllocationStep';
import { InvestmentAmountStep } from '@/components/basket/steps/InvestmentAmountStep';
import type { BasketInfo, SelectedAsset } from '@/components/basket/BasketCreationFlow';

type FlowStep = 'info' | 'selection' | 'allocation' | 'amount';

const CreateBasketScreen = () => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('info');
  const [basketInfo, setBasketInfo] = useState<BasketInfo>({
    name: '',
    ticker: '',
    description: '',
    lockPeriod: '1m',
  });
  const [selectedAssets, setSelectedAssets] = useState<SelectedAsset[]>([]);

  const stepProgress = useMemo(() => {
    const steps: FlowStep[] = ['info', 'selection', 'allocation', 'amount'];
    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  }, [currentStep]);

  const handleNextFromInfo = useCallback((info: BasketInfo) => {
    setBasketInfo(info);
    setCurrentStep('selection');
  }, []);

  const handleNextFromSelection = useCallback((assets: SelectedAsset[]) => {
    setSelectedAssets(assets);
    setCurrentStep('allocation');
  }, []);

  const handleNextFromAllocation = useCallback((assets: SelectedAsset[]) => {
    setSelectedAssets(assets);
    setCurrentStep('amount');
  }, []);

  const handleComplete = useCallback((amount: string) => {
    const data = {
      basketInfo,
      assets: selectedAssets,
      investmentAmount: amount,
    };

    // TODO: Send data to API to create basket
    console.log('Basket created:', data);

    Alert.alert(
      'Basket Created! 🎉',
      `Your basket "${basketInfo.name}" has been created with $${parseFloat(amount).toFixed(2)} invested across ${selectedAssets.length} assets.`,
      [
        {
          text: 'View Dashboard',
          onPress: () => router.replace('/(tabs)'),
        },
        {
          text: 'Create Another',
          onPress: () => {
            setCurrentStep('info');
            setBasketInfo({ name: '', ticker: '', description: '', lockPeriod: '1m' });
            setSelectedAssets([]);
          },
          style: 'cancel',
        },
      ]
    );
  }, [basketInfo, selectedAssets]);

  const handleBack = useCallback(() => {
    const stepOrder: FlowStep[] = ['info', 'selection', 'allocation', 'amount'];
    const currentIndex = stepOrder.indexOf(currentStep);
    
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    } else {
      router.back();
    }
  }, [currentStep]);

  const getStepTitle = () => {
    switch (currentStep) {
      case 'info':
        return 'Create Basket';
      case 'selection':
        return 'Select Assets';
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
    return steps.indexOf(currentStep) + 1;
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Step Content */}
      <View className="flex-1">
        {currentStep === 'info' && (
          <BasketInfoStep
            initialData={basketInfo}
            onNext={handleNextFromInfo}
            onBack={handleBack}
          />
        )}

        {currentStep === 'selection' && (
          <AssetSelectionStep
            initialAssets={selectedAssets}
            onNext={handleNextFromSelection}
            onBack={handleBack}
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
    </SafeAreaView>
  );
};

export default CreateBasketScreen;
