import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { AmountInput } from '@/components/molecules/AmountInput';
import type { SelectedAsset } from '../BasketCreationFlow';
import { router } from 'expo-router';
import { AlarmCheckIcon } from 'lucide-react-native';

interface InvestmentAmountStepProps {
  basketName: string;
  assets: SelectedAsset[];
  onComplete: (amount: string) => void;
  onBack: () => void;
}

export const InvestmentAmountStep: React.FC<InvestmentAmountStepProps> = ({
  basketName,
  assets,
  onComplete,
  onBack,
}) => {
  const [amount, setAmount] = useState('0');

  // Calculate projected allocations based on investment amount
  const projectedAllocations = useMemo(() => {
    const investmentAmount = parseFloat(amount);
    if (isNaN(investmentAmount) || investmentAmount === 0) return null;

    return assets.map((asset) => ({
      ...asset,
      projectedAmount: (investmentAmount * asset.allocation) / 100,
    }));
  }, [amount, assets]);

  const minInvestment = 15.0;
  const buyingPower = 5420.32; // This should come from user's actual buying power

  return (
    <AmountInput
  title="Order type: Market"
  onBack={() => router.back()}
  onClose={() => router.push('/')}
  value={amount}
  onValueChange={setAmount}
  tokenInfo="1.851851 AMC"
  tokenIcon={<AlarmCheckIcon size={24} color="#1F2937" />}
  errorText="Insufficient funds"
  quickAmounts={[5, 10, 25, 50]}
  onQuickAmountSelect={(amt) => setAmount(amt.toString())}
/>
  );
};
