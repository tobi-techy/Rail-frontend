import React, { useState } from 'react';
import { View, Text, StatusBar, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../../components/ui';
import { AuthGradient, StaggeredChild } from '@/components';
import { Check } from 'lucide-react-native';

const GOALS = [
  { id: 'grow-wealth', label: 'Grow my wealth', desc: 'Long-term investing' },
  { id: 'save-goal', label: 'Save for a goal', desc: 'House, car, vacation' },
  { id: 'retirement', label: 'Plan for retirement', desc: 'Build a nest egg' },
  { id: 'passive-income', label: 'Generate passive income', desc: 'Dividends & interest' },
  { id: 'learn', label: 'Learn to invest', desc: 'Start my journey' },
];

export default function InvestmentGoal() {
  const [selected, setSelected] = useState('');

  const handleNext = () => {
    router.push('/(auth)/complete-profile/investment-experience');
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar barStyle="light-content" />
        <View className="flex-1 px-6 pt-4">
          <StaggeredChild index={0}>
            <View className="mb-8 mt-4">
              <Text className="font-display text-[50px] text-white">Investment Goal</Text>
              <Text className="font-body-medium mt-2 text-[14px] text-white/70">
                What&apos;s your primary goal?
              </Text>
            </View>
          </StaggeredChild>

          <View className="gap-y-3">
            {GOALS.map((goal, index) => (
              <StaggeredChild key={goal.id} index={index + 1} delay={40}>
                <Pressable
                  onPress={() => setSelected(goal.id)}
                  className="flex-row items-center justify-between border-b border-white/20 py-4">
                  <View>
                    <Text className="font-subtitle text-[16px] text-white">{goal.label}</Text>
                    <Text className="font-body text-[13px] text-white/50">{goal.desc}</Text>
                  </View>
                  {selected === goal.id && (
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
