import React, { useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import {
  Camera01Icon,
  ScanIcon,
  Image01Icon,
  File01Icon,
  LinkSquare01Icon,
  IconComponent as HugeiconsIcon,
  type PhosphorIcon,
} from '@/lib/icons';
import { GorhomBottomSheet } from './GorhomBottomSheet';

// ─── Grid option tile ────────────────────────────────────────────

interface GridOption {
  id: string;
  label: string;
  icon: PhosphorIcon;
}

const GRID_OPTIONS: GridOption[] = [
  { id: 'camera', label: 'Camera', icon: Camera01Icon },
  { id: 'scan', label: 'Scan', icon: ScanIcon },
  { id: 'image', label: 'Image', icon: Image01Icon },
  { id: 'file', label: 'File', icon: File01Icon },
];

function OptionTile({
  option,
  onPress,
}: {
  option: GridOption;
  onPress: (id: string) => void;
}) {
  return (
    <Pressable
      onPress={() => onPress(option.id)}
      className="flex-1 items-center gap-2 rounded-2xl bg-black/[0.04] py-4"
      accessibilityRole="button"
      accessibilityLabel={option.label}>
      <HugeiconsIcon icon={option.icon} size={24} color="#4A4A48" />
      <Text className="font-body-medium text-[13px] text-[#4A4A48]">{option.label}</Text>
    </Pressable>
  );
}

// ─── Sheet ───────────────────────────────────────────────────────

interface AttachmentSheetProps {
  visible: boolean;
  onClose: () => void;
  onScanReceipt: () => void;
  onPickImage: () => void;
  onUploadStatement: () => void;
  onApps: () => void;
}

export function AttachmentSheet({
  visible,
  onClose,
  onScanReceipt,
  onPickImage,
  onUploadStatement,
  onApps,
}: AttachmentSheetProps) {
  const handleOption = useCallback(
    (id: string) => {
      onClose();
      const delay = id === 'camera' || id === 'scan' || id === 'image' || id === 'file' ? 400 : 150;
      setTimeout(() => {
        if (id === 'camera' || id === 'scan') onScanReceipt();
        else if (id === 'image') onPickImage();
        else if (id === 'file') onUploadStatement();
      }, delay);
    },
    [onClose, onScanReceipt, onPickImage, onUploadStatement]
  );

  const handleConnections = useCallback(() => {
    onClose();
    setTimeout(() => onApps(), 200);
  }, [onClose, onApps]);

  return (
    <GorhomBottomSheet visible={visible} onClose={onClose} glassBackground scrollable={false}>
      <View className="pt-2 pb-2">
        {/* Header */}
        <Text className="mb-5 font-body-medium text-[22px] text-[#1C1C1E]">Options</Text>

        {/* Grid */}
        <View className="flex-row gap-2.5">
          {GRID_OPTIONS.map((opt) => (
            <OptionTile key={opt.id} option={opt} onPress={handleOption} />
          ))}
        </View>

        {/* Connections row */}
        <Pressable
          onPress={handleConnections}
          className="mt-5 flex-row items-center rounded-2xl bg-black/[0.04] px-4 py-3.5"
          accessibilityRole="button"
          accessibilityLabel="Connections">
          <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-black/[0.06]">
            <HugeiconsIcon icon={LinkSquare01Icon} size={18} color="#4A4A48" />
          </View>
          <View className="flex-1">
            <Text className="font-body-medium text-[15px] text-[#1C1C1E]">Connections</Text>
            <Text className="mt-0.5 font-body text-[12px] text-[#8C8C8C]">
              Connect apps for richer context
            </Text>
          </View>
        </Pressable>
      </View>
    </GorhomBottomSheet>
  );
}
