import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui';
import { InputField } from '@/components/atoms/InputField';
import { useKycStore, type CaptureSide, type CapturedDocument } from '@/stores/kycStore';
import { CameraOverlay } from '@/components/sheets/CameraOverlay';

export default function KycDocumentsScreen() {
  const { frontDoc, backDoc, setDocument, documentNumber, setDocumentNumber } = useKycStore();
  const [captureTarget, setCaptureTarget] = useState<CaptureSide | null>(null);

  const formatCapturedAt = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCaptureComplete = (doc: CapturedDocument) => {
    if (captureTarget) {
      setDocument(captureTarget, doc);
    }
    setCaptureTarget(null);
  };

  const renderDocumentRow = (
    target: CaptureSide,
    title: string,
    document: CapturedDocument | null
  ) => {
    return (
      <View className="mb-3 rounded-2xl border border-gray-200 bg-white p-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-subtitle text-[15px] text-gray-900">{title}</Text>
            <Text className="mt-1 font-body text-[12px] text-gray-500">
              {document ? `Captured ${formatCapturedAt(document.capturedAt)}` : 'Not captured yet'}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              // Small delay to ensure smooth transition
              setTimeout(() => setCaptureTarget(target), 100);
            }}
            hitSlop={8}
            className="rounded-full bg-black px-3 py-2"
            accessibilityRole="button"
            accessibilityLabel={document ? `Retake ${title}` : `Capture ${title}`}>
            <Text className="font-body text-[12px] text-white">
              {document ? 'Retake' : 'Capture'}
            </Text>
          </Pressable>
        </View>

        {!!document && (
          <Image
            source={{ uri: document.dataUri }}
            resizeMode="cover"
            className="mt-3 h-24 w-full rounded-xl"
          />
        )}
      </View>
    );
  };

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
          <Pressable
            className="size-11 items-center justify-center rounded-full bg-slate-100"
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <ChevronLeft size={24} color="#111827" />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 24, paddingBottom: 44 }}>
          <Text className="mb-2 font-display text-[32px] text-gray-900">ID documents</Text>
          <Text className="mb-8 font-body text-[15px] leading-6 text-gray-500">
            Capture clear photos in good lighting. We only use these for identity verification.
          </Text>

          <View className="mb-6">
            <InputField
              label="Document Number"
              value={documentNumber}
              placeholder="Enter your ID number"
              onChangeText={setDocumentNumber}
              autoCapitalize="characters"
              autoCorrect={false}
              variant="light"
            />
          </View>

          {renderDocumentRow('front', 'Front of ID (required)', frontDoc)}
          {renderDocumentRow('back', 'Back of ID (optional)', backDoc)}

          <View className="mb-8 mt-4 rounded-2xl bg-blue-50 px-4 py-3">
            <Text className="font-body text-[13px] leading-5 text-blue-800">
              Security tip: avoid screenshots and make sure all text on your ID is readable.
            </Text>
          </View>

          <Button
            title="Continue"
            onPress={() => router.push('/kyc/disclosures')}
            disabled={!frontDoc || !documentNumber.trim()}
          />
        </ScrollView>
      </SafeAreaView>

      <CameraOverlay
        visible={captureTarget !== null}
        side={captureTarget || 'front'}
        onClose={() => setCaptureTarget(null)}
        onComplete={handleCaptureComplete}
      />
    </ErrorBoundary>
  );
}
