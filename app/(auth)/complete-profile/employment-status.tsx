import React, { useState } from 'react';
import { View, Text, StatusBar, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../../components/ui';
import { AuthGradient, StaggeredChild } from '@/components';
import { Check } from 'lucide-react-native';

const EMPLOYMENT_OPTIONS = [
  { id: 'employed', label: 'Employed', desc: 'Full-time or part-time' },
  { id: 'self-employed', label: 'Self-employed', desc: 'Business owner or freelancer' },
  { id: 'student', label: 'Student', desc: 'Currently studying' },
  { id: 'retired', label: 'Retired', desc: 'No longer working' },
  { id: 'unemployed', label: 'Not employed', desc: 'Looking for work' },
];

export default function EmploymentStatus() {
  const [selected, setSelected] = useState('');

  const handleComplete = () => {
    router.push('/(auth)/onboarding/trust-device');
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar barStyle="light-content" />
        <View className="flex-1 px-6 pt-4">
          <StaggeredChild index={0}>
            <View className="mb-8 mt-4">
              <Text className="font-display text-[50px] text-white">Employment</Text>
              <Text className="font-body-medium mt-2 text-[14px] text-white/70">
                What&apos;s your current status?
              </Text>
            </View>
          </StaggeredChild>

          <View className="gap-y-3">
            {EMPLOYMENT_OPTIONS.map((option, index) => (
              <StaggeredChild key={option.id} index={index + 1} delay={40}>
                <Pressable
                  onPress={() => setSelected(option.id)}
                  className="flex-row items-center justify-between border-b border-white/20 py-4">
                  <View>
                    <Text className="font-subtitle text-[16px] text-white">{option.label}</Text>
                    <Text className="font-body text-[13px] text-white/50">{option.desc}</Text>
                  </View>
                  {selected === option.id && (
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
              <Button title="Complete Profile" onPress={handleComplete} variant="black" />
            </View>
          </StaggeredChild>
        </View>
      </SafeAreaView>
    </AuthGradient>
  );
}
