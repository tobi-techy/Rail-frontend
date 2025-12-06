import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, X } from 'lucide-react-native';

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
    <View className="flex-row items-center justify-between px-6 py-4 bg-white">
      {showBackButton ? (
        <TouchableOpacity
          onPress={handleBack}
          className="h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6]"
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color="#111827" strokeWidth={2} />
        </TouchableOpacity>
      ) : (
        <View className="w-10" />
      )}

      <View className="flex-1 items-center">
        <Text className="text-lg font-semibold text-[#0B1120]">{title}</Text>
        {subtitle && (
          <Text className="mt-1 text-sm text-[#6B7280]">{subtitle}</Text>
        )}
      </View>

      {showCloseButton ? (
        <TouchableOpacity
          onPress={handleClose}
          className="h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6]"
          activeOpacity={0.7}
        >
          <X size={18} color="#111827" strokeWidth={2} />
        </TouchableOpacity>
      ) : (
        <View className="w-10" />
      )}
    </View>
  );
};