import React, { useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { InputField } from '@/components/atoms/InputField';
import { CameraOverlay } from '@/components/sheets/CameraOverlay';
import { Button } from '@/components/ui';
import {
  COUNTRY_KYC_REQUIREMENTS,
  COUNTRY_LABELS,
  COUNTRY_TAX_CONFIG,
  validateTaxId,
} from '@/api/types/kyc';
import {
  documentRequiresBack,
  useKycStore,
  type CaptureSide,
  type CapturedDocument,
} from '@/stores/kycStore';

export default function KycDocumentsScreen() {
  const insets = useSafeAreaInsets();
  const {
    country,
    taxIdType,
    taxId,
    documentType,
    frontDoc,
    backDoc,
    setTaxIdType,
    setTaxId,
    setDocumentType,
    setDocument,
  } = useKycStore();

  const [captureTarget, setCaptureTarget] = useState<CaptureSide | null>(null);
  const [taxIdError, setTaxIdError] = useState('');
  const [documentError, setDocumentError] = useState('');

  const requirement = COUNTRY_KYC_REQUIREMENTS[country];
  const taxConfigs = COUNTRY_TAX_CONFIG[country];
  const activeTaxConfig = taxConfigs.find((item) => item.type === taxIdType) ?? taxConfigs[0];
  const selectedDocument = requirement.acceptedDocuments.find((item) => item.type === documentType);
  const needsBack = documentRequiresBack(country, documentType);

  const canContinue = useMemo(
    () => Boolean(taxId.trim()) && Boolean(frontDoc) && (!needsBack || Boolean(backDoc)),
    [backDoc, frontDoc, needsBack, taxId]
  );

  const handleContinue = () => {
    const taxValidationError = validateTaxId(country, taxIdType, taxId);
    if (taxValidationError) {
      setTaxIdError(taxValidationError);
      return;
    }

    if (!frontDoc || (needsBack && !backDoc)) {
      setDocumentError(
        needsBack
          ? 'Upload front and back of your selected document to continue.'
          : 'Upload your document photo to continue.'
      );
      return;
    }

    setTaxIdError('');
    setDocumentError('');
    router.push('/kyc/disclosures');
  };

  const openCapture = (side: CaptureSide) => {
    setDocumentError('');
    setCaptureTarget(side);
  };

  const handleCaptureComplete = (document: CapturedDocument) => {
    if (captureTarget) setDocument(captureTarget, document);
    setCaptureTarget(null);
    setDocumentError('');
  };

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center justify-between px-4 pb-2 pt-1">
          <Pressable
            className="size-11 items-center justify-center rounded-full bg-gray-100"
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <ChevronLeft size={22} color="#111827" />
          </Pressable>
          <Text className="font-subtitle text-[13px] text-gray-500">Step 2 of 3</Text>
          <View className="size-11" />
        </View>

        <View className="px-4">
          <View className="h-1.5 overflow-hidden rounded-full bg-gray-200">
            <View className="h-full w-2/3 rounded-full bg-gray-900" />
          </View>
        </View>

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 180 }}>
            <View>
              <Text className="font-display text-[30px] leading-[34px] text-gray-900">
                Identity details
              </Text>
              <Text className="mt-2 font-body text-[15px] leading-6 text-gray-600">
                Upload your ID and enter your tax identifier exactly as it appears on official
                records.
              </Text>
            </View>

            <View className="mt-6">
              <Text className="mb-2 font-subtitle text-[13px] text-gray-500">Document type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {requirement.acceptedDocuments.map((item) => {
                    const isSelected = item.type === documentType;
                    return (
                      <Pressable
                        key={item.type}
                        onPress={() => setDocumentType(item.type)}
                        className={`rounded-full border px-4 py-2.5 ${
                          isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-200 bg-white'
                        }`}
                        accessibilityRole="button"
                        accessibilityLabel={`Use ${item.label}`}>
                        <Text
                          className={`font-subtitle text-[13px] ${
                            isSelected ? 'text-white' : 'text-gray-700'
                          }`}>
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
              {!!selectedDocument && (
                <Text className="mt-2 font-body text-[12px] text-gray-500">
                  {selectedDocument.description}
                </Text>
              )}
            </View>

            {taxConfigs.length > 1 && (
              <View className="mt-6">
                <Text className="mb-2 font-subtitle text-[13px] text-gray-500">Tax ID type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {taxConfigs.map((item) => {
                      const isSelected = item.type === taxIdType;
                      return (
                        <Pressable
                          key={item.type}
                          onPress={() => {
                            setTaxIdType(item.type);
                            setTaxIdError('');
                          }}
                          className={`rounded-full border px-4 py-2.5 ${
                            isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-200 bg-white'
                          }`}
                          accessibilityRole="button"
                          accessibilityLabel={`Use ${item.label}`}>
                          <Text
                            className={`font-subtitle text-[13px] ${
                              isSelected ? 'text-white' : 'text-gray-700'
                            }`}>
                            {item.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            <View className="mt-6">
              <InputField
                label={activeTaxConfig.label}
                value={taxId}
                placeholder={activeTaxConfig.placeholder}
                onChangeText={(value) => {
                  setTaxId(value);
                  if (taxIdError) setTaxIdError('');
                }}
                autoCorrect={false}
                autoCapitalize="characters"
                variant="light"
                error={taxIdError || undefined}
              />
              {!taxIdError && !!activeTaxConfig.helpText && (
                <Text className="mt-2 font-body text-[12px] text-gray-500">
                  {activeTaxConfig.helpText}
                </Text>
              )}
            </View>

            <View className="mt-6">
              <Text className="mb-2 font-subtitle text-[13px] text-gray-500">Document upload</Text>
              <DocumentUploadCard
                label="Front of document"
                required
                document={frontDoc}
                onCapture={() => openCapture('front')}
                onRemove={() => setDocument('front', null)}
              />
              {needsBack && (
                <DocumentUploadCard
                  label="Back of document"
                  required
                  document={backDoc}
                  onCapture={() => openCapture('back')}
                  onRemove={() => setDocument('back', null)}
                />
              )}
              {!needsBack && (
                <View className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <Text className="font-body text-[12px] leading-5 text-emerald-800">
                    Back photo is not required for {selectedDocument?.label || 'this document type'}
                    .
                  </Text>
                </View>
              )}
              {!!documentError && (
                <Text className="mt-2 font-body text-[12px] text-red-600">{documentError}</Text>
              )}
            </View>

            <View className="mt-6 rounded-2xl border border-gray-200 bg-white px-4 py-4">
              <View className="flex-row items-center gap-2">
                <ShieldCheck size={18} color="#111827" />
                <Text className="font-subtitle text-[14px] text-gray-900">
                  Upload quality checklist
                </Text>
              </View>
              <View className="mt-3 gap-y-2.5">
                {requirement.uploadTips.map((tip) => (
                  <Text key={tip} className="font-body text-[12px] leading-5 text-gray-600">
                    • {tip}
                  </Text>
                ))}
              </View>
            </View>

            <View className="mt-6 rounded-2xl border border-gray-200 bg-white px-4 py-4">
              <Text className="font-subtitle text-[14px] text-gray-900">Submission preview</Text>
              <PreviewRow label="Country" value={COUNTRY_LABELS[country]} />
              <PreviewRow label="Tax ID type" value={activeTaxConfig.label} />
              <PreviewRow label="Document" value={selectedDocument?.label || 'Not selected'} />
              <PreviewRow label="Front photo" value={frontDoc ? 'Attached' : 'Missing'} />
              <PreviewRow
                label="Back photo"
                value={needsBack ? (backDoc ? 'Attached' : 'Missing') : 'Not required'}
                isLast
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View
          className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-4 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <Button title="Continue" onPress={handleContinue} disabled={!canContinue} />
        </View>
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

function PreviewRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between py-3 ${isLast ? '' : 'border-b border-gray-100'}`}>
      <Text className="font-body text-[12px] text-gray-500">{label}</Text>
      <Text className="max-w-[58%] text-right font-subtitle text-[13px] text-gray-900">
        {value}
      </Text>
    </View>
  );
}

function DocumentUploadCard({
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
      <View className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <Image source={{ uri: document.dataUri }} resizeMode="cover" className="h-40 w-full" />
        <View className="flex-row items-center justify-between px-4 py-3">
          <View className="flex-row items-center gap-2">
            <CheckCircle2 size={18} color="#059669" />
            <Text className="font-subtitle text-[14px] text-gray-900">{label}</Text>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              onPress={onCapture}
              className="size-11 items-center justify-center rounded-full bg-gray-100"
              accessibilityRole="button"
              accessibilityLabel={`Retake ${label}`}>
              <RotateCcw size={16} color="#4B5563" />
            </Pressable>
            <Pressable
              onPress={onRemove}
              className="size-11 items-center justify-center rounded-full bg-red-50"
              accessibilityRole="button"
              accessibilityLabel={`Remove ${label}`}>
              <Trash2 size={16} color="#DC2626" />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onCapture}
      className="mt-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5"
      accessibilityRole="button"
      accessibilityLabel={`Upload ${label}`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="size-11 items-center justify-center rounded-full bg-white">
            {required ? <Camera size={20} color="#111827" /> : <Upload size={20} color="#111827" />}
          </View>
          <View>
            <Text className="font-subtitle text-[14px] text-gray-900">{label}</Text>
            <Text className="mt-1 font-body text-[12px] text-gray-500">
              {required ? 'Required' : 'Optional'} • Tap to capture or upload
            </Text>
          </View>
        </View>
        <ChevronRight size={18} color="#9CA3AF" />
      </View>
    </Pressable>
  );
}
