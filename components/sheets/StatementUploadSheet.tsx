import React, { useCallback, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import {
  File01Icon,
  Cancel01Icon,
  ArrowUp01Icon,
  IconComponent as HugeiconsIcon,
} from '@/lib/icons';
import * as Haptics from '@/utils/platformHaptics';
import { GorhomBottomSheet } from './GorhomBottomSheet';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

interface Props {
  visible: boolean;
  onClose: () => void;
  onUpload: (uri: string, fileName: string) => void;
}

type Step = 'pick' | 'confirm';

interface PickedFile {
  uri: string;
  name: string;
  size?: number;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StatementUploadSheet({ visible, onClose, onUpload }: Props) {
  const [step, setStep] = useState<Step>('pick');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStep('pick');
    setFile(null);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handlePickFile = useCallback(async () => {
    setError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/heic'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];

      if (asset.size && asset.size > MAX_FILE_SIZE) {
        setError('File is too large. Please upload a file under 20MB.');
        return;
      }

      setFile({ uri: asset.uri, name: asset.name || 'Statement.pdf', size: asset.size });
      setStep('confirm');
    } catch {
      setError('Could not pick file. Please try again.');
    }
  }, []);

  const handleUpload = useCallback(() => {
    if (!file) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUpload(file.uri, file.name);
    reset();
    onClose();
  }, [file, onUpload, onClose, reset]);

  return (
    <GorhomBottomSheet visible={visible} onClose={handleClose} glassBackground scrollable={false}>
      <View className="pb-2 pt-2">
        <Text className="mb-1 font-body-medium text-[22px] text-charcoal-primary">
          Upload Statement
        </Text>
        <Text className="mb-5 font-body text-[14px] text-ash">
          PDF or photo of your bank statement
        </Text>

        {step === 'pick' && (
          <Animated.View exiting={FadeOut.duration(100)}>
            {/* Drop zone */}
            <Pressable
              onPress={handlePickFile}
              className="items-center rounded-2xl border-[1.5px] border-dashed border-black/[0.12] bg-black/[0.02] px-6 py-10"
              accessibilityRole="button"
              accessibilityLabel="Pick a file to upload">
              <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-black/[0.05]">
                <HugeiconsIcon icon={File01Icon} size={22} color="#6B6B6B" />
              </View>
              <Text className="font-body-medium text-[15px] text-charcoal-primary">
                Tap to choose file
              </Text>
              <Text className="mt-1 font-body text-[13px] text-ash">
                PDF, JPG, PNG, HEIC up to 20MB
              </Text>
            </Pressable>

            {error && (
              <Animated.View entering={FadeIn.duration(100)} className="mt-3">
                <Text className="text-center font-body text-[13px] text-red-500">{error}</Text>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {step === 'confirm' && file && (
          <Animated.View
            entering={FadeIn.duration(180).withInitialValues({
              opacity: 0,
              transform: [{ translateY: 4 }],
            })}
            className="gap-4">
            {/* File card */}
            <View className="flex-row items-center rounded-2xl bg-[#F5F4F0] p-4">
              <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-white">
                <HugeiconsIcon icon={File01Icon} size={20} color="#6B6B6B" />
                <Text className="mt-0.5 font-body-medium text-[8px] uppercase text-ash">
                  {file.name.split('.').pop()}
                </Text>
              </View>
              <View className="flex-1">
                <Text
                  className="font-body-medium text-[15px] text-charcoal-primary"
                  numberOfLines={1}>
                  {file.name}
                </Text>
                {file.size ? (
                  <Text className="mt-0.5 font-body text-[13px] text-ash">
                    {formatFileSize(file.size)}
                  </Text>
                ) : null}
              </View>
              <Pressable onPress={reset} hitSlop={8} accessibilityLabel="Remove file">
                <HugeiconsIcon icon={Cancel01Icon} size={18} color="#848281" />
              </Pressable>
            </View>

            {/* Upload button */}
            <Pressable
              onPress={handleUpload}
              className="flex-row items-center justify-center gap-2 rounded-full bg-charcoal-primary py-4"
              accessibilityRole="button"
              accessibilityLabel="Upload statement">
              <HugeiconsIcon icon={ArrowUp01Icon} size={18} color="#FFFFFF" />
              <Text className="font-body-medium text-[16px] text-white">Upload & Analyse</Text>
            </Pressable>

            {/* Change file */}
            <Pressable
              onPress={handlePickFile}
              className="items-center py-2"
              accessibilityLabel="Choose different file">
              <Text className="font-body text-[14px] text-ash">Choose different file</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </GorhomBottomSheet>
  );
}
