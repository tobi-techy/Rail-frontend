import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { AuthScreen } from './AuthScreen';
import { StaggeredChild } from '@/components';

export interface SelectionOption {
  id: string;
  label: string;
  desc?: string;
}

interface SelectionScreenProps {
  title: string;
  subtitle?: string;
  options: SelectionOption[];
  nextRoute: string;
  buttonTitle?: string;
  initialSelected?: string;
  onNext?: (selectedId: string) => void;
  buttonLoading?: boolean;
  buttonDisabled?: boolean;
}

export const SelectionScreen = ({
  title,
  subtitle,
  options,
  nextRoute,
  buttonTitle = 'Next',
  initialSelected = '',
  onNext,
  buttonLoading = false,
  buttonDisabled = false,
}: SelectionScreenProps) => {
  const [selected, setSelected] = useState(initialSelected);

  const handleNext = () => {
    if (!selected) return;

    if (onNext) {
      onNext(selected);
      return;
    }

    router.push(nextRoute as any);
  };

  return (
    <AuthScreen
      title={title}
      subtitle={subtitle}
      buttonTitle={buttonTitle}
      onButtonPress={handleNext}
      buttonLoading={buttonLoading}
      buttonDisabled={!selected || buttonDisabled}>
      <View className="gap-y-3">
        {options.map((option, index) => (
          <StaggeredChild key={option.id} index={index + 1} delay={40}>
            <Pressable
              onPress={() => setSelected(option.id)}
              className="flex-row items-center justify-between border-b border-black/10 py-4">
              <View className="flex-1 pr-4">
                <Text className="font-subtitle text-[16px] text-black">{option.label}</Text>
                {option.desc && (
                  <Text className="font-body text-[13px] text-black/50">{option.desc}</Text>
                )}
              </View>
              {selected === option.id && (
                <View className="h-6 w-6 items-center justify-center rounded-full bg-black">
                  <Check size={14} color="#fff" strokeWidth={3} />
                </View>
              )}
            </Pressable>
          </StaggeredChild>
        ))}
      </View>
    </AuthScreen>
  );
};
