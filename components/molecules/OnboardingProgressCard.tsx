import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';
import { CheckmarkCircle01Icon, ArrowRight01Icon } from '@/lib/icons';

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
          backgroundColor: '#f8f7f4',
          borderRadius: 17,
          borderWidth: 1,
          borderColor: '#f7f2e8',
          padding: 16,
          marginBottom: 16,
        }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}>
          <Text style={{ fontFamily: 'Geist-SemiBold', fontSize: 15, color: '#343433' }}>
            Complete your profile
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontFamily: 'Geist-Medium', fontSize: 12, color: '#ff3e00' }}>
              {completed}/{total}
            </Text>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="#848281" />
          </View>
        </View>

        {/* Progress bar */}
        <View
          style={{
            height: 4,
            backgroundColor: '#f7f2e8',
            borderRadius: 2,
            marginBottom: 14,
            overflow: 'hidden',
          }}>
          <View
            style={{
              height: 4,
              width: `${progress * 100}%`,
              backgroundColor: '#ff3e00',
              borderRadius: 2,
            }}
          />
        </View>

        {/* Steps */}
        <View style={{ gap: 10 }}>
          {steps.map((step, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                size={18}
                color={step.done ? '#00ca48' : '#c6c6c6'}
              />
              <Text
                style={{
                  fontFamily: 'Geist-Regular',
                  fontSize: 14,
                  color: step.done ? '#848281' : '#343433',
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
