import React, { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useButtonFeedback } from '@/hooks/useButtonFeedback';

interface HoldToConfirmButtonProps {
  title?: string;
  onConfirm: () => void;
  disabled?: boolean;
}

export function HoldToConfirmButton({
  title = 'Send',
  onConfirm,
  disabled = false,
}: HoldToConfirmButtonProps) {
  const triggerFeedback = useButtonFeedback();

  const handlePress = useCallback(() => {
    if (disabled) return;
    triggerFeedback();
    onConfirm();
  }, [disabled, onConfirm, triggerFeedback]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      className={`min-h-[58px] flex-row items-center justify-center overflow-hidden rounded-full bg-ember-orange px-7 py-[17px] ${
        disabled ? 'opacity-50' : ''
      }`}>
      <View className="max-w-full flex-shrink flex-row items-center justify-center">
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          className="min-w-0 flex-shrink text-center font-button text-body text-white">
          {title}
        </Text>
      </View>
    </Pressable>
  );
}
