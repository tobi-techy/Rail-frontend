import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { GorhomBottomSheet } from './GorhomBottomSheet';
import {
  Camera01Icon,
  Image01Icon,
  File01Icon,
  IconComponent as HugeiconsIcon,
  type PhosphorIcon,
} from '@/lib/icons';

interface AttachmentOption {
  id: string;
  label: string;
  icon: PhosphorIcon;
  color: string;
  onPress: () => void;
}

interface AttachmentSheetProps {
  visible: boolean;
  onClose: () => void;
  onScanReceipt: () => void;
  onPickPhoto: () => void;
  onUploadStatement: () => void;
}

export function AttachmentSheet({
  visible,
  onClose,
  onScanReceipt,
  onPickPhoto,
  onUploadStatement,
}: AttachmentSheetProps) {
  const options: AttachmentOption[] = [
    {
      id: 'scan',
      label: 'Camera',
      icon: Camera01Icon,
      color: '#343433',
      onPress: () => {
        onClose();
        onScanReceipt();
      },
    },
    {
      id: 'photos',
      label: 'Photos',
      icon: Image01Icon,
      color: '#343433',
      onPress: () => {
        onClose();
        onPickPhoto();
      },
    },
    {
      id: 'statement',
      label: 'Statement',
      icon: File01Icon,
      color: '#343433',
      onPress: () => {
        onClose();
        onUploadStatement();
      },
    },
  ];

  return (
    <GorhomBottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={['28%']}
      showCloseButton={false}>
      <View className="px-5 pb-8 pt-2">
        <View className="flex-row gap-3">
          {options.map((opt) => (
            <Pressable
              key={opt.id}
              onPress={opt.onPress}
              className="flex-1 items-center justify-center rounded-2xl bg-[#F5F5F3] py-5 active:bg-[#EBEBEA]"
              accessibilityRole="button"
              accessibilityLabel={opt.label}>
              <View className="mb-2 h-11 w-11 items-center justify-center rounded-full bg-white">
                <HugeiconsIcon icon={opt.icon} size={22} color={opt.color} />
              </View>
              <Text className="font-body-medium text-[13px] text-[#343433]">{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </GorhomBottomSheet>
  );
}
