import React, { useState } from 'react';
import { View, Text, StatusBar, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../../components/ui';
import { AuthGradient, StaggeredChild } from '@/components';
import { Check } from 'lucide-react-native';

const EXPERIENCE_LEVELS = [
  { id: 'none', label: 'No experience', desc: "I'm completely new to investing" },
  { id: 'beginner', label: 'Beginner', desc: "I've made a few investments" },
  { id: 'intermediate', label: 'Intermediate', desc: 'I invest regularly' },
  { id: 'advanced', label: 'Advanced', desc: "I'm an experienced investor" },
];

export default function InvestmentExperience() {
  const [selected, setSelected] = useState('');

  const handleNext = () => {
    router.push('/(auth)/complete-profile/yearly-income');
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar barStyle="light-content" />
        <View className="flex-1 px-6 pt-4">
          <StaggeredChild index={0}>
            <View className="mb-8 mt-4">
              <Text className="font-display text-[50px] text-white">Experience</Text>
              <Text className="font-body-medium mt-2 text-[14px] text-white/70">
                How experienced are you?
              </Text>
            </View>
          </StaggeredChild>

          <View className="gap-y-3">
            {EXPERIENCE_LEVELS.map((level, index) => (
              <StaggeredChild key={level.id} index={index + 1} delay={40}>
                <Pressable
                  onPress={() => setSelected(level.id)}
                  className="flex-row items-center justify-between border-b border-white/20 py-4">
                  <View>
                    <Text className="font-subtitle text-[16px] text-white">{level.label}</Text>
                    <Text className="font-body text-[13px] text-white/50">{level.desc}</Text>
                  </View>
                  {selected === level.id && (
                    <View className="h-6 w-6 items-center justify-center rounded-full bg-white">
                      <Check size={14} color="#000" strokeWidth={3} />
                    </View>
                  )}
                </Pressable>
              </StaggeredChild>
            ))}
          </View>

          <StaggeredChild index={6} delay={80} style={{ marginTop: 'auto' }}>
            <View className="pb-4">
              <Button title="Next" onPress={handleNext} variant="black" />
            </View>
          </StaggeredChild>
        </View>
      </SafeAreaView>
    </AuthGradient>
  );
}
