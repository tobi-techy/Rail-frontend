import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Camera, CheckCircle2, Plus, RotateCcw, Trash2 } from 'lucide-react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui';
import { InputField } from '@/components/atoms/InputField';
import {
  useKycStore,
  documentRequiresBack,
  type CaptureSide,
  type CapturedDocument,
} from '@/stores/kycStore';
import { CameraOverlay } from '@/components/sheets/CameraOverlay';
import { COUNTRY_TAX_CONFIG, validateTaxId } from '@/api/types/kyc';

export default function KycDocumentsScreen() {
  const { country, taxIdType, taxId, frontDoc, backDoc, setTaxIdType, setTaxId, setDocument } =
    useKycStore();

  const [captureTarget, setCaptureTarget] = useState<CaptureSide | null>(null);
  const [taxIdError, setTaxIdError] = useState('');

  const taxConfigs = COUNTRY_TAX_CONFIG[country];
  const activeCfg = taxConfigs.find((c) => c.type === taxIdType) ?? taxConfigs[0];
  const needsBack = documentRequiresBack(taxIdType);

  const handleTaxIdChange = (value: string) => {
    setTaxId(value);
    if (taxIdError) setTaxIdError('');
  };

  const handleContinue = () => {
    const err = validateTaxId(country, taxIdType, taxId);
    if (err) {
      setTaxIdError(err);
      return;
    }
    router.push('/kyc/disclosures');
  };

  const canContinue =
    Boolean(frontDoc) && taxId.trim().length > 0 && (!needsBack || Boolean(backDoc));

  const handleCaptureComplete = (doc: CapturedDocument) => {
    if (captureTarget) setDocument(captureTarget, doc);
    setCaptureTarget(null);
  };

  const openCapture = (side: CaptureSide) => setTimeout(() => setCaptureTarget(side), 100);

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
          <Text className="font-subtitle text-[15px] text-gray-500">Step 1 of 2</Text>
          <View className="size-11" />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 24, paddingBottom: 44 }}>
          <Text className="mb-2 font-display text-[28px] leading-9 text-gray-900">
            Your ID &amp; documents
          </Text>
          <Text className="mb-8 font-body text-[15px] leading-6 text-gray-500">
            We&apos;ll verify your identity securely. Nothing is stored on your device.
          </Text>

          {/* ── Tax ID Section ── */}
          {taxConfigs.length > 1 && (
            <View className="mb-4">
              <Text className="mb-2 font-subtitle text-[13px] text-gray-500">ID type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {taxConfigs.map((cfg) => {
                    const active = taxIdType === cfg.type;
                    return (
                      <Pressable
                        key={cfg.type}
                        onPress={() => {
                          setTaxIdType(cfg.type);
                          setTaxId('');
                          setTaxIdError('');
                        }}
                        className={`rounded-xl border px-4 py-2.5 ${
                          active ? 'border-gray-900 bg-gray-900' : 'border-gray-200 bg-white'
                        }`}>
                        <Text
                          className={`font-subtitle text-[13px] ${active ? 'text-white' : 'text-gray-700'}`}>
                          {cfg.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}

          <InputField
            label={activeCfg.label}
            value={taxId}
            placeholder={activeCfg.placeholder}
            onChangeText={handleTaxIdChange}
            autoCapitalize="characters"
            autoCorrect={false}
            variant="light"
            error={taxIdError || undefined}
          />
          {!!activeCfg.helpText && !taxIdError && (
            <Text className="-mt-1 mb-4 font-body text-[12px] text-gray-400">
              {activeCfg.helpText}
            </Text>
          )}

          {/* ── Document Upload Section ── */}
          <Text className="mb-3 mt-4 font-subtitle text-[13px] text-gray-500">Document photos</Text>

          <DocumentCard
            label="Front of ID"
            required
            document={frontDoc}
            onCapture={() => openCapture('front')}
            onRemove={() => setDocument('front', null)}
          />

          {needsBack ? (
            <DocumentCard
              label="Back of ID"
              required
              document={backDoc}
              onCapture={() => openCapture('back')}
              onRemove={() => setDocument('back', null)}
            />
          ) : (
            <DocumentCard
              label="Back of ID"
              required={false}
              document={backDoc}
              onCapture={() => openCapture('back')}
              onRemove={() => setDocument('back', null)}
            />
          )}

          <View className="mb-6 mt-5 rounded-2xl bg-blue-50 px-4 py-3">
            <Text className="font-body text-[13px] leading-5 text-blue-800">
              Use your camera for best results. Make sure all text is readable with no glare or
              blur.
            </Text>
          </View>

          <Button title="Continue" onPress={handleContinue} disabled={!canContinue} />
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

/* ── Document Upload Card ── */

function DocumentCard({
  label,
  required,
  document,
  onCapture,
  onRemove,
}: {
  label: string;
  required: boolean;
  document: CapturedDocument | null;
  onCapture: () => void;
  onRemove: () => void;
}) {
  if (document) {
    return (
      <View className="mb-3 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <Image source={{ uri: document.dataUri }} resizeMode="cover" className="h-36 w-full" />
        <View className="flex-row items-center justify-between px-4 py-3">
          <View className="flex-row items-center gap-2">
            <CheckCircle2 size={18} color="#10B981" />
            <Text className="font-subtitle text-[14px] text-gray-900">{label}</Text>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              onPress={onCapture}
              hitSlop={8}
              className="size-9 items-center justify-center rounded-full bg-gray-100"
              accessibilityRole="button"
              accessibilityLabel={`Retake ${label}`}>
              <RotateCcw size={16} color="#6B7280" />
            </Pressable>
            <Pressable
              onPress={onRemove}
              hitSlop={8}
              className="size-9 items-center justify-center rounded-full bg-red-50"
              accessibilityRole="button"
              accessibilityLabel={`Remove ${label}`}>
              <Trash2 size={16} color="#EF4444" />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onCapture}
      className="mb-3 items-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-8 active:bg-gray-100"
      accessibilityRole="button"
      accessibilityLabel={`Capture ${label}`}>
      <View className="mb-3 size-12 items-center justify-center rounded-full bg-white shadow-sm">
        {required ? <Camera size={22} color="#111827" /> : <Plus size={22} color="#9CA3AF" />}
      </View>
      <Text className="font-subtitle text-[15px] text-gray-900">{label}</Text>
      <Text className="mt-1 font-body text-[12px] text-gray-400">
        {required ? 'Required' : 'Optional'} · Tap to capture or upload
      </Text>
    </Pressable>
  );
}
