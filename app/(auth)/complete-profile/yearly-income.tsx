import React, { useState } from 'react';
import { View, Text, StatusBar, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../../components/ui';
import { AuthGradient, StaggeredChild } from '@/components';
import { Check } from 'lucide-react-native';

const INCOME_RANGES = [
  { id: 'under-25k', label: 'Under $25,000' },
  { id: '25k-50k', label: '$25,000 - $50,000' },
  { id: '50k-100k', label: '$50,000 - $100,000' },
  { id: '100k-200k', label: '$100,000 - $200,000' },
  { id: 'over-200k', label: 'Over $200,000' },
];

export default function YearlyIncome() {
  const [selected, setSelected] = useState('');

  const handleNext = () => {
    router.push('/(auth)/complete-profile/employment-status');
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar barStyle="light-content" />
        <View className="flex-1 px-6 pt-4">
          <StaggeredChild index={0}>
            <View className="mb-8 mt-4">
              <Text className="font-display text-[50px] text-white">Yearly Income</Text>
              <Text className="font-body-medium mt-2 text-[14px] text-white/70">
                What&apos;s your annual income?
              </Text>
            </View>
          </StaggeredChild>

          <View className="gap-y-3">
            {INCOME_RANGES.map((range, index) => (
              <StaggeredChild key={range.id} index={index + 1} delay={40}>
                <Pressable
                  onPress={() => setSelected(range.id)}
                  className="flex-row items-center justify-between border-b border-white/20 py-4">
                  <Text className="font-subtitle text-[16px] text-white">{range.label}</Text>
                  {selected === range.id && (
                    <View className="h-6 w-6 items-center justify-center rounded-full bg-white">
                      <Check size={14} color="#000" strokeWidth={3} />
                    </View>
                  )}
                </Pressable>
              </StaggeredChild>
            ))}
          </View>

          <StaggeredChild index={7} delay={80} style={{ marginTop: 'auto' }}>
            <View className="pb-4">
              <Button title="Next" onPress={handleNext} variant="black" />
            </View>
          </StaggeredChild>
        </View>
      </SafeAreaView>
    </AuthGradient>
  );
}
