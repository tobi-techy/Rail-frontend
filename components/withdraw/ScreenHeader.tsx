import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft01Icon, Cancel01Icon } from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';

interface WithdrawScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onClose?: () => void;
  showBackButton?: boolean;
  showCloseButton?: boolean;
}

export const WithdrawScreenHeader: React.FC<WithdrawScreenHeaderProps> = ({
  title,
  subtitle,
  onBack,
  onClose,
  showBackButton = true,
  showCloseButton = false,
}) => {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.dismiss();
    }
  };

  return (
    <View className="flex-row items-center justify-between bg-parchment-card px-6 py-4">
      {showBackButton ? (
        <TouchableOpacity
          onPress={handleBack}
          className="h-11 w-11 items-center justify-center rounded-full bg-[#f7f2e8]"
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} color="#343433" strokeWidth={2} />
        </TouchableOpacity>
      ) : (
        <View className="w-11" />
      )}

      <View className="flex-1 items-center">
        <Text className="text-lg font-semibold text-[#0B1120]">{title}</Text>
        {subtitle && <Text className="mt-1 text-sm text-[#848281]">{subtitle}</Text>}
      </View>

      {showCloseButton ? (
        <TouchableOpacity
          onPress={handleClose}
          className="h-11 w-11 items-center justify-center rounded-full bg-[#f7f2e8]"
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Close">
          <HugeiconsIcon icon={Cancel01Icon} size={18} color="#343433" strokeWidth={2} />
        </TouchableOpacity>
      ) : (
        <View className="w-11" />
      )}
    </View>
  );
};
