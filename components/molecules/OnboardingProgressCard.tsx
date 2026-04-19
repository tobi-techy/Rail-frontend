import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { CheckmarkCircle01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';

interface Step {
  label: string;
  done: boolean;
}

interface Props {
  steps: Step[];
  onPress: () => void;
}

export function OnboardingProgressCard({ steps, onPress }: Props) {
  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const progress = total > 0 ? completed / total : 0;

  if (completed >= total) return null;

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(400)}>
      <Pressable
        onPress={onPress}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#F3F4F6',
          padding: 16,
          marginBottom: 16,
        }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontFamily: 'SFProDisplay-Semibold', fontSize: 15, color: '#1A1A1A' }}>
            Complete your profile
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontFamily: 'SFMono-Medium', fontSize: 12, color: '#FF2E01' }}>
              {completed}/{total}
            </Text>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="#9CA3AF" />
          </View>
        </View>

        {/* Progress bar */}
        <View style={{ height: 4, backgroundColor: '#F3F4F6', borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
          <View style={{ height: 4, width: `${progress * 100}%`, backgroundColor: '#FF2E01', borderRadius: 2 }} />
        </View>

        {/* Steps */}
        <View style={{ gap: 10 }}>
          {steps.map((step, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                size={18}
                color={step.done ? '#16A34A' : '#D1D5DB'}
              />
              <Text style={{
                fontFamily: 'SFProDisplay-Regular',
                fontSize: 14,
                color: step.done ? '#9CA3AF' : '#1A1A1A',
                textDecorationLine: step.done ? 'line-through' : 'none',
              }}>
                {step.label}
              </Text>
            </View>
          ))}
        </View>
      </Pressable>
    </Animated.View>
  );
}
