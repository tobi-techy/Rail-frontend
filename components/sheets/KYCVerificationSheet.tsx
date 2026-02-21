import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { CameraView, type CameraType, useCameraPermissions } from 'expo-camera';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  RefreshCw,
  Shield,
  X,
  Zap,
} from 'lucide-react-native';
import { InputField } from '@/components/atoms/InputField';
import { Button } from '@/components/ui';
import type { TransformedApiError } from '@/api/types';
import {
  COUNTRY_HELP_TEXT,
  COUNTRY_LABELS,
  COUNTRY_TAX_CONFIG,
  type Country,
  type KYCStatusResponse,
  type KycDisclosures,
  type TaxIdType,
  validateTaxId,
} from '@/api/types/kyc';
import { useKYCStatus, useSubmitKYC } from '@/api/hooks/useKYC';
import { useAuthStore } from '@/stores/authStore';
import {
  NavigableBottomSheet,
  type BottomSheetScreen,
  useNavigableBottomSheet,
} from './NavigableBottomSheet';

interface KYCVerificationSheetProps {
  visible: boolean;
  onClose: () => void;
  kycStatus: KYCStatusResponse | undefined;
}

type CaptureSide = 'front' | 'back';

type CapturedDocument = {
  dataUri: string;
  capturedAt: number;
};

type ScreenStatusMode = 'not_started' | 'pending' | 'approved' | 'rejected';

const COUNTRIES: Country[] = ['USA', 'GBR', 'NGA'];
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

const DEFAULT_DISCLOSURES: KycDisclosures = {
  is_control_person: false,
  is_affiliated_exchange_or_finra: false,
  is_politically_exposed: false,
  immediate_family_exposed: false,
};

const DISCLOSURE_LABELS: Record<keyof KycDisclosures, string> = {
  is_control_person: 'I am a control person of a publicly traded company',
  is_affiliated_exchange_or_finra: 'I am affiliated with a stock exchange or FINRA',
  is_politically_exposed: 'I am a politically exposed person',
  immediate_family_exposed: 'An immediate family member is politically exposed',
};

const MISSING_FIELD_LABELS: Record<string, string> = {
  first_name: 'Legal first name',
  last_name: 'Legal last name',
  date_of_birth: 'Date of birth',
  phone: 'Phone number',
  address_street: 'Street address',
  address_city: 'City',
  address_postal_code: 'Postal code',
  address_country: 'Address country',
};

const formatCapturedAt = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const normalizeTaxIdForApi = (value: string, type: TaxIdType): string => {
  const trimmed = value.trim();

  switch (type) {
    case 'ssn':
    case 'itin':
    case 'utr':
    case 'nin':
    case 'bvn':
    case 'tin':
      return trimmed.replace(/\D/g, '');
    case 'nino':
      return trimmed.replace(/\s+/g, '').toUpperCase();
    default:
      return trimmed;
  }
};

const maskTaxId = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return '••••';
  return `••••${digits.slice(-4)}`;
};

const formatTaxIdInput = (value: string, type: TaxIdType): string => {
  if (!value) return '';

  switch (type) {
    case 'ssn':
    case 'itin': {
      const digits = value.replace(/\D/g, '').slice(0, 9);
      if (digits.length <= 3) return digits;
      if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
    }
    case 'nino': {
      const compact = value
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 9);
      if (compact.length <= 6) return compact;
      return `${compact.slice(0, 6)} ${compact.slice(6)}`;
    }
    default:
      return value.trimStart();
  }
};

const resolveStatusMode = (status?: KYCStatusResponse): ScreenStatusMode => {
  const value = status?.status ?? 'not_started';

  if (value === 'approved') return 'approved';
  if (value === 'rejected' || value === 'expired') return 'rejected';
  if (value === 'processing' || (value === 'pending' && status?.has_submitted)) return 'pending';
  return 'not_started';
};

const extractMissingFields = (error: TransformedApiError | null): string[] => {
  if (!error?.details) return [];
  const maybe = (error.details as Record<string, unknown>)?.missing_fields;
  if (!Array.isArray(maybe)) return [];

  return maybe
    .filter((field): field is string => typeof field === 'string' && field.trim().length > 0)
    .map((field) => field.trim());
};

const formatMissingField = (field: string) => {
  return MISSING_FIELD_LABELS[field] ?? field.replace(/_/g, ' ');
};

const toFriendlyError = (error: unknown) => {
  const apiError = error as TransformedApiError | undefined;
  if (!apiError) return 'Unable to submit verification. Please try again.';

  if (apiError.status === 413) return 'Document image is too large. Keep each image under 10MB.';
  if (apiError.status === 401) return 'Your session expired. Please sign in again.';

  return apiError.message || 'Unable to submit verification. Please try again.';
};

export function KYCVerificationSheet({ visible, onClose, kycStatus }: KYCVerificationSheetProps) {
  const { height: screenHeight } = useWindowDimensions();
  const contentMaxHeight = Math.max(280, Math.min(460, screenHeight * 0.56));

  const user = useAuthStore((state) => state.user);
  const firstName = useMemo(() => {
    if (user?.firstName && user.firstName.trim()) return user.firstName.trim();
    if (user?.fullName && user.fullName.trim()) return user.fullName.trim().split(' ')[0];
    return 'there';
  }, [user?.firstName, user?.fullName]);

  const {
    data: liveKycStatus,
    refetch: refetchKycStatus,
    isRefetching: isRefetchingStatus,
  } = useKYCStatus(visible);
  const status = liveKycStatus ?? kycStatus;
  const statusMode = resolveStatusMode(status);

  const submitKyc = useSubmitKYC();
  const navigation = useNavigableBottomSheet('intro');
  const { reset: resetNavigation, navigateTo: navigateToScreen } = navigation;
  const wasVisibleRef = useRef(false);

  const [country, setCountry] = useState<Country>('USA');
  const [taxIdType, setTaxIdType] = useState<TaxIdType>('ssn');
  const [taxId, setTaxId] = useState('');
  const [taxIdError, setTaxIdError] = useState('');
  const [disclosures, setDisclosures] = useState<KycDisclosures>(DEFAULT_DISCLOSURES);

  const [frontDoc, setFrontDoc] = useState<CapturedDocument | null>(null);
  const [backDoc, setBackDoc] = useState<CapturedDocument | null>(null);
  const [captureTarget, setCaptureTarget] = useState<CaptureSide | null>(null);

  const [submitError, setSubmitError] = useState<string>('');
  const [rawSubmitError, setRawSubmitError] = useState<TransformedApiError | null>(null);

  const taxOptions = useMemo(() => COUNTRY_TAX_CONFIG[country], [country]);
  const activeTaxConfig = useMemo(
    () => taxOptions.find((option) => option.type === taxIdType),
    [taxOptions, taxIdType]
  );

  const missingFields = useMemo(() => extractMissingFields(rawSubmitError), [rawSubmitError]);

  const resetFlow = useCallback(() => {
    setCountry('USA');
    setTaxIdType('ssn');
    setTaxId('');
    setTaxIdError('');
    setDisclosures(DEFAULT_DISCLOSURES);
    setFrontDoc(null);
    setBackDoc(null);
    setCaptureTarget(null);
    setSubmitError('');
    setRawSubmitError(null);
  }, []);

  const getInitialScreen = useCallback(() => {
    if (statusMode === 'approved') return 'approved';
    if (statusMode === 'pending') return 'pending';
    return 'intro';
  }, [statusMode]);

  useEffect(() => {
    if (!visible) {
      wasVisibleRef.current = false;
      resetNavigation('intro');
      resetFlow();
      return;
    }

    if (!wasVisibleRef.current) {
      wasVisibleRef.current = true;
      resetNavigation(getInitialScreen());
    }
  }, [visible, getInitialScreen, resetNavigation, resetFlow]);

  useEffect(() => {
    if (!visible) return;

    if (statusMode === 'approved') {
      resetNavigation('approved');
      return;
    }

    if (statusMode === 'pending' && submitKyc.isSuccess) {
      resetNavigation('pending');
    }
  }, [visible, statusMode, submitKyc.isSuccess, resetNavigation]);

  useEffect(() => {
    if (!activeTaxConfig && taxOptions.length > 0) {
      setTaxIdType(taxOptions[0].type);
      setTaxId('');
    }
  }, [activeTaxConfig, taxOptions]);

  const toggleDisclosure = useCallback((key: keyof KycDisclosures) => {
    setDisclosures((previous) => ({ ...previous, [key]: !previous[key] }));
  }, []);

  const openCapture = useCallback((target: CaptureSide) => {
    setCaptureTarget(target);
  }, []);

  const handleCaptureComplete = useCallback(
    (document: CapturedDocument) => {
      if (!captureTarget) return;

      if (captureTarget === 'front') {
        setFrontDoc(document);
      } else {
        setBackDoc(document);
      }

      setCaptureTarget(null);
    },
    [captureTarget]
  );

  const closeCapture = useCallback(() => {
    setCaptureTarget(null);
  }, []);

  const handleStart = useCallback(() => {
    setSubmitError('');
    setRawSubmitError(null);
    navigateToScreen('details');
  }, [navigateToScreen]);

  const handleContinueFromDetails = useCallback(() => {
    const validation = validateTaxId(country, taxIdType, taxId);
    if (!taxId.trim()) {
      setTaxIdError(`Enter your ${activeTaxConfig?.label ?? 'tax ID'}`);
      return;
    }

    if (validation) {
      setTaxIdError(validation);
      return;
    }

    setTaxIdError('');
    navigateToScreen('documents');
  }, [country, taxIdType, taxId, activeTaxConfig?.label, navigateToScreen]);

  const handleContinueFromDocuments = useCallback(() => {
    if (!frontDoc) {
      setSubmitError('Front of ID is required before submitting verification.');
      return;
    }

    setSubmitError('');
    navigateToScreen('disclosures');
  }, [frontDoc, navigateToScreen]);

  const handleSubmit = useCallback(async () => {
    if (!frontDoc) {
      setSubmitError('Front of ID is required before submitting verification.');
      return;
    }

    setSubmitError('');
    setRawSubmitError(null);

    try {
      const response = await submitKyc.mutateAsync({
        tax_id: normalizeTaxIdForApi(taxId, taxIdType),
        tax_id_type: taxIdType,
        issuing_country: country,
        id_document_front: frontDoc.dataUri,
        id_document_back: backDoc?.dataUri,
        disclosures,
      });

      await refetchKycStatus();

      if (response.status === 'failed') {
        setSubmitError(response.message || 'Verification could not be submitted.');
        return;
      }

      resetNavigation('pending');
    } catch (error) {
      const transformed = error as TransformedApiError;
      setRawSubmitError(transformed);

      const missing = extractMissingFields(transformed);
      if (missing.length > 0) {
        resetNavigation('profile_gaps');
        return;
      }

      setSubmitError(toFriendlyError(error));
    }
  }, [
    frontDoc,
    submitKyc,
    taxId,
    taxIdType,
    country,
    backDoc?.dataUri,
    disclosures,
    refetchKycStatus,
    resetNavigation,
  ]);

  const handleCheckStatus = useCallback(async () => {
    const result = await refetchKycStatus();
    const nextMode = resolveStatusMode(result.data ?? status);

    if (nextMode === 'approved') {
      resetNavigation('approved');
      return;
    }

    if (nextMode === 'rejected') {
      resetNavigation('intro');
    }
  }, [refetchKycStatus, status, resetNavigation]);

  const handleRetry = useCallback(() => {
    setSubmitError('');
    setRawSubmitError(null);
    resetNavigation('details');
  }, [resetNavigation]);

  const closeSheet = useCallback(() => {
    onClose();
  }, [onClose]);

  const canSubmitVerification = Boolean(frontDoc) && Boolean(taxId.trim()) && !submitKyc.isPending;
  const isNumericTaxType = taxIdType === 'ssn' || taxIdType === 'itin' || taxIdType === 'tin';

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
            onPress={() => openCapture(target)}
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

  const introTitle =
    statusMode === 'approved'
      ? `Thanks ${firstName}, you're all set!`
      : statusMode === 'pending'
        ? `Thanks ${firstName}, we're checking everything now`
        : statusMode === 'rejected'
          ? 'We need a quick retry'
          : 'Tell us about yourself';

  const introBody =
    statusMode === 'approved'
      ? 'Your identity is now verified.'
      : statusMode === 'pending'
        ? 'This usually takes a few minutes. You can close this and come back later.'
        : statusMode === 'rejected'
          ? status?.rejection_reason ||
            'Your last submission was not approved. You can retry now with clear ID photos.'
          : 'We use this info to confirm your identity and comply with legal requirements.';

  const screens: BottomSheetScreen[] = [
    {
      id: 'intro',
      title: statusMode === 'not_started' ? 'Identity Verification' : 'Verification Status',
      component: (
        <ScrollView style={{ maxHeight: contentMaxHeight }} showsVerticalScrollIndicator={false}>
          <View className="pb-1">
            <View className="mb-4 items-center">
              <View
                className="mb-4 size-16 items-center justify-center rounded-full"
                style={{
                  backgroundColor:
                    statusMode === 'approved'
                      ? '#ECFDF3'
                      : statusMode === 'pending'
                        ? '#FFF7ED'
                        : statusMode === 'rejected'
                          ? '#FEF2F2'
                          : '#EEF2FF',
                }}>
                {statusMode === 'approved' ? (
                  <CheckCircle2 size={30} color="#10B981" />
                ) : statusMode === 'pending' ? (
                  <Clock3 size={30} color="#F59E0B" />
                ) : statusMode === 'rejected' ? (
                  <AlertTriangle size={30} color="#EF4444" />
                ) : (
                  <Shield size={30} color="#6366F1" />
                )}
              </View>
              <Text className="text-center font-subtitle text-[28px] leading-8 text-gray-900">
                {introTitle}
              </Text>
              <Text className="mt-2 text-center font-body text-[15px] leading-6 text-gray-500">
                {introBody}
              </Text>
            </View>

            {statusMode === 'not_started' && (
              <View className="mb-5 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2">
                <View className="flex-row items-start gap-3 border-b border-gray-200 py-3">
                  <FileText size={18} color="#111827" />
                  <View className="flex-1">
                    <Text className="font-subtitle text-[15px] text-gray-900">
                      Your tax details
                    </Text>
                    <Text className="mt-1 font-body text-[13px] text-gray-500">
                      Tax ID, country, and required disclosures.
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-start gap-3 py-3">
                  <Camera size={18} color="#111827" />
                  <View className="flex-1">
                    <Text className="font-subtitle text-[15px] text-gray-900">Your ID photos</Text>
                    <Text className="mt-1 font-body text-[13px] text-gray-500">
                      Snap front and back in-app with your camera.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {statusMode === 'rejected' && (
              <View className="mb-4 rounded-2xl bg-red-50 px-4 py-3">
                <Text className="font-body text-[13px] text-red-700">{introBody}</Text>
              </View>
            )}

            {statusMode === 'approved' ? (
              <Button title="Close" onPress={closeSheet} />
            ) : statusMode === 'pending' ? (
              <View className="gap-y-3">
                <Button
                  title="Refresh status"
                  onPress={handleCheckStatus}
                  loading={isRefetchingStatus}
                  leftIcon={<RefreshCw size={16} color="#FFF" />}
                />
                <Button title="Close" variant="white" onPress={closeSheet} />
              </View>
            ) : (
              <Button
                title={statusMode === 'rejected' ? 'Retry verification' : 'Get started'}
                onPress={handleStart}
              />
            )}
          </View>
        </ScrollView>
      ),
    },
    {
      id: 'details',
      title: 'Your tax details',
      component: (
        <KeyboardAvoidingView
          style={{ maxHeight: contentMaxHeight }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 18 : 0}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 28 : 14 }}>
            <Text className="mb-3 font-body text-[14px] leading-5 text-gray-500">
              Enter details exactly as they appear on your records.
            </Text>

            <View className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 p-3">
              <Text className="mb-2 font-subtitle text-[13px] text-gray-700">
                Country of tax residence
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 8 }}
                className="mb-2">
                <View className="flex-row gap-2">
                  {COUNTRIES.map((option) => {
                    const selected = option === country;
                    return (
                      <Pressable
                        key={option}
                        onPress={() => {
                          setCountry(option);
                          setTaxIdType(COUNTRY_TAX_CONFIG[option][0].type);
                          setTaxId('');
                          setTaxIdError('');
                        }}
                        className={`rounded-full border px-4 py-2.5 ${
                          selected ? 'border-black bg-black' : 'border-gray-300 bg-white'
                        }`}
                        accessibilityRole="button"
                        accessibilityLabel={`Select ${COUNTRY_LABELS[option]}`}>
                        <Text
                          className={`font-subtitle text-[13px] ${
                            selected ? 'text-white' : 'text-gray-800'
                          }`}>
                          {COUNTRY_LABELS[option]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
              <Text className="font-body text-[12px] leading-5 text-gray-500">
                {COUNTRY_HELP_TEXT[country]}
              </Text>
            </View>

            <View className="mb-4 rounded-2xl border border-gray-200 bg-white p-3">
              <Text className="mb-2 font-subtitle text-[13px] text-gray-700">Tax ID type</Text>
              <View className="gap-y-2.5">
                {taxOptions.map((option) => {
                  const selected = option.type === taxIdType;
                  return (
                    <Pressable
                      key={option.type}
                      onPress={() => {
                        setTaxIdType(option.type);
                        setTaxId('');
                        setTaxIdError('');
                      }}
                      className={`rounded-2xl border px-4 py-3.5 ${
                        selected ? 'border-gray-900 bg-gray-900' : 'border-gray-200 bg-white'
                      }`}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${option.label}`}>
                      <Text
                        className={`font-subtitle text-[15px] ${selected ? 'text-white' : 'text-gray-900'}`}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <InputField
              label={activeTaxConfig?.label ?? 'Tax ID'}
              value={taxId}
              placeholder={activeTaxConfig?.placeholder ?? 'Enter tax ID'}
              onChangeText={(value) => {
                setTaxId(formatTaxIdInput(value, taxIdType));
                setTaxIdError('');
                setSubmitError('');
              }}
              autoCapitalize={taxIdType === 'nino' ? 'characters' : 'none'}
              autoCorrect={false}
              secureTextEntry={false}
              keyboardType={
                isNumericTaxType
                  ? Platform.OS === 'ios'
                    ? 'numbers-and-punctuation'
                    : 'numeric'
                  : 'default'
              }
              textContentType="none"
              autoComplete="off"
              returnKeyType="done"
              onSubmitEditing={handleContinueFromDetails}
              blurOnSubmit
              error={taxIdError}
              variant="light"
              density="compact"
            />
            <Text className="mb-1 mt-1 font-body text-[12px] text-gray-500">
              We encrypt this data and only share it with our regulated verification partners.
            </Text>

            <View className="pt-5">
              <Button
                title="Continue"
                onPress={handleContinueFromDetails}
                rightIcon={<ChevronRight size={18} color="#FFF" />}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      ),
    },
    {
      id: 'documents',
      title: 'ID documents',
      component: (
        <ScrollView style={{ maxHeight: contentMaxHeight }} showsVerticalScrollIndicator={false}>
          <Text className="mb-3 font-body text-[14px] leading-5 text-gray-500">
            Capture clear photos in good lighting. We only use these for identity verification.
          </Text>

          {renderDocumentRow('front', 'Front of ID (required)', frontDoc)}
          {renderDocumentRow('back', 'Back of ID (optional)', backDoc)}

          <View className="mb-4 mt-1 rounded-2xl bg-blue-50 px-4 py-3">
            <Text className="font-body text-[12px] leading-5 text-blue-800">
              Security tip: avoid screenshots and make sure all text on your ID is readable.
            </Text>
          </View>

          {!!submitError && (
            <View className="mb-3 rounded-2xl bg-red-50 px-4 py-3">
              <Text className="font-body text-[12px] leading-5 text-red-700">{submitError}</Text>
            </View>
          )}

          <Button title="Continue" onPress={handleContinueFromDocuments} disabled={!frontDoc} />
        </ScrollView>
      ),
    },
    {
      id: 'disclosures',
      title: 'Disclosures',
      component: (
        <ScrollView style={{ maxHeight: contentMaxHeight }} showsVerticalScrollIndicator={false}>
          <Text className="mb-3 font-body text-[14px] leading-5 text-gray-500">
            One last step before submission. Answer these compliance disclosures.
          </Text>

          <View className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
            <Text className="mb-2 font-subtitle text-[13px] text-gray-700">Your submission</Text>
            <Row label="Country" value={COUNTRY_LABELS[country]} />
            <Row label="Tax type" value={activeTaxConfig?.label ?? taxIdType} />
            <Row label="Tax ID" value={maskTaxId(taxId)} />
            <Row label="Front ID" value={frontDoc ? 'Attached' : 'Missing'} />
            <Row label="Back ID" value={backDoc ? 'Attached' : 'Not provided'} />
          </View>

          <Text className="mb-2 mt-5 font-subtitle text-[13px] text-gray-700">Disclosures</Text>
          <View className="rounded-2xl border border-gray-200 bg-white px-3 py-1">
            {(Object.keys(DISCLOSURE_LABELS) as (keyof KycDisclosures)[]).map((key) => (
              <View
                key={key}
                className="flex-row items-center justify-between border-b border-gray-100 py-3">
                <Text className="mr-3 flex-1 font-body text-[12px] leading-5 text-gray-700">
                  {DISCLOSURE_LABELS[key]}
                </Text>
                <Switch
                  value={disclosures[key]}
                  onValueChange={() => toggleDisclosure(key)}
                  trackColor={{ false: '#D1D5DB', true: '#111827' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#D1D5DB"
                />
              </View>
            ))}
          </View>

          <View className="mb-4 mt-4 rounded-2xl bg-gray-100 px-4 py-3">
            <Text className="font-body text-[12px] leading-5 text-gray-700">
              By submitting, you confirm the information is accurate and belongs to you.
            </Text>
          </View>

          {!!submitError && (
            <View className="mb-4 rounded-2xl bg-red-50 px-4 py-3">
              <Text className="font-body text-[12px] leading-5 text-red-700">{submitError}</Text>
            </View>
          )}

          <Button
            title="Submit verification"
            onPress={handleSubmit}
            loading={submitKyc.isPending}
            disabled={!canSubmitVerification}
          />
        </ScrollView>
      ),
    },
    {
      id: 'profile_gaps',
      title: 'One more step',
      component: (
        <ScrollView style={{ maxHeight: contentMaxHeight }} showsVerticalScrollIndicator={false}>
          <View className="mb-4 items-center">
            <View className="mb-4 size-16 items-center justify-center rounded-full bg-amber-50">
              <AlertTriangle size={28} color="#F59E0B" />
            </View>
            <Text className="text-center font-subtitle text-[22px] leading-7 text-gray-900">
              Complete profile details first
            </Text>
            <Text className="mt-2 text-center font-body text-[14px] leading-6 text-gray-500">
              We still need a few profile details before submitting KYC.
            </Text>
          </View>

          <View className="mb-4 rounded-2xl border border-gray-200 bg-white px-4 py-3">
            {missingFields.map((field) => (
              <Text key={field} className="py-1 font-body text-[13px] text-gray-800">
                • {formatMissingField(field)}
              </Text>
            ))}
          </View>

          <View className="gap-y-3">
            <Button title="Close" onPress={closeSheet} />
            <Button title="Back to verification" variant="white" onPress={handleRetry} />
          </View>
        </ScrollView>
      ),
    },
    {
      id: 'pending',
      title: 'Review in progress',
      component: (
        <ScrollView style={{ maxHeight: contentMaxHeight }} showsVerticalScrollIndicator={false}>
          <View className="mb-4 items-center">
            <View className="mb-4 size-16 items-center justify-center rounded-full bg-amber-50">
              <Clock3 size={30} color="#F59E0B" />
            </View>
            <Text className="text-center font-subtitle text-[24px] leading-8 text-gray-900">
              Thanks {firstName}, we&apos;re checking everything now
            </Text>
            <Text className="mt-2 text-center font-body text-[14px] leading-6 text-gray-500">
              This usually takes a few minutes. You can close this and come back later.
            </Text>
          </View>

          <View className="mb-4 rounded-2xl border border-gray-200 bg-white px-4 py-3">
            <Row label="Status" value={status?.status ?? 'pending'} />
            <Row label="Submitted" value={status?.last_submitted_at ? 'Yes' : 'In progress'} />
          </View>

          <View className="gap-y-3">
            <Button
              title="Refresh status"
              onPress={handleCheckStatus}
              loading={isRefetchingStatus}
              leftIcon={<RefreshCw size={16} color="#FFF" />}
            />
            <Button title="Close" variant="white" onPress={closeSheet} />
          </View>
        </ScrollView>
      ),
    },
    {
      id: 'approved',
      title: 'Verification complete',
      component: (
        <ScrollView style={{ maxHeight: contentMaxHeight }} showsVerticalScrollIndicator={false}>
          <View className="mb-4 items-center">
            <View className="mb-4 size-16 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 size={30} color="#10B981" />
            </View>
            <Text className="text-center font-subtitle text-[24px] leading-8 text-gray-900">
              Thanks {firstName}, you&apos;re all set!
            </Text>
            <Text className="mt-2 text-center font-body text-[14px] leading-6 text-gray-500">
              Your identity is now verified.
            </Text>
          </View>

          <Button title="Close" onPress={closeSheet} />
        </ScrollView>
      ),
    },
  ];

  return (
    <>
      <NavigableBottomSheet
        visible={visible}
        onClose={closeSheet}
        screens={screens}
        navigation={navigation}
      />

      <DocumentCaptureModal
        visible={captureTarget !== null}
        side={captureTarget ?? 'front'}
        onClose={closeCapture}
        onComplete={handleCaptureComplete}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between border-b border-gray-100 py-2.5">
      <Text className="font-body text-[12px] text-gray-500">{label}</Text>
      <Text className="font-subtitle text-[13px] text-gray-900">{value}</Text>
    </View>
  );
}

function DocumentCaptureModal({
  visible,
  side,
  onClose,
  onComplete,
}: {
  visible: boolean;
  side: CaptureSide;
  onClose: () => void;
  onComplete: (document: CapturedDocument) => void;
}) {
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState('');

  useEffect(() => {
    if (!visible) {
      setCapturedUri(null);
      setCapturedBase64(null);
      setCaptureError('');
      setIsCapturing(false);
      return;
    }

    if (!cameraPermission?.granted && cameraPermission?.canAskAgain) {
      void requestCameraPermission();
    }
  }, [visible, cameraPermission?.granted, cameraPermission?.canAskAgain, requestCameraPermission]);

  const onTakePhoto = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;

    setCaptureError('');
    setIsCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
        skipProcessing: true,
      });

      if (!photo?.base64 || !photo?.uri) {
        setCaptureError('Could not capture image. Please try again.');
        return;
      }

      const byteSize = Math.floor((photo.base64.length * 3) / 4);
      if (byteSize > MAX_DOCUMENT_BYTES) {
        setCaptureError('Image exceeds 10MB. Move closer and retake in lower detail.');
        return;
      }

      setCapturedUri(photo.uri);
      setCapturedBase64(photo.base64);
    } catch {
      setCaptureError('Could not access camera. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  const onUsePhoto = useCallback(() => {
    if (!capturedBase64) return;

    onComplete({
      dataUri: `data:image/jpeg;base64,${capturedBase64}`,
      capturedAt: Date.now(),
    });

    setCapturedUri(null);
    setCapturedBase64(null);
  }, [capturedBase64, onComplete]);

  const title = side === 'front' ? 'Front of ID' : 'Back of ID';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View className="flex-1 bg-black">
        {!capturedUri ? (
          <>
            {cameraPermission?.granted ? (
              <CameraView
                ref={(ref) => {
                  cameraRef.current = ref;
                }}
                className="flex-1"
                facing={cameraFacing}
                flash={flashEnabled ? 'on' : 'off'}
              />
            ) : (
              <View className="flex-1 items-center justify-center px-6">
                <Camera size={42} color="#FFFFFF" />
                <Text className="mt-4 text-center font-subtitle text-[22px] text-white">
                  Camera permission needed
                </Text>
                <Text className="mt-2 text-center font-body text-[14px] leading-6 text-gray-300">
                  Allow camera access so you can capture your document securely in-app.
                </Text>
                <View className="mt-6 w-full">
                  <Button title="Allow camera" onPress={() => void requestCameraPermission()} />
                </View>
              </View>
            )}

            <View className="absolute left-0 right-0 top-14 flex-row items-center justify-between px-6">
              <Pressable
                onPress={onClose}
                className="size-11 items-center justify-center rounded-full bg-black/50"
                accessibilityRole="button"
                accessibilityLabel="Close camera">
                <X size={20} color="#FFFFFF" />
              </Pressable>

              <Pressable
                onPress={() => setFlashEnabled((value) => !value)}
                className="size-11 items-center justify-center rounded-full bg-black/50"
                accessibilityRole="button"
                accessibilityLabel="Toggle flash">
                <Zap size={20} color={flashEnabled ? '#F59E0B' : '#FFFFFF'} />
              </Pressable>
            </View>

            <View className="absolute bottom-10 left-6 right-6 rounded-[28px] bg-white px-5 py-5">
              <Text className="text-center font-subtitle text-[28px] text-gray-900">{title}</Text>
              <Text className="mt-2 text-center font-body text-[15px] leading-6 text-gray-500">
                Keep your document inside frame and avoid blur.
              </Text>

              {!!captureError && (
                <Text className="mt-3 text-center font-body text-[13px] text-red-600">
                  {captureError}
                </Text>
              )}

              <View className="mt-4 flex-row items-center justify-center">
                <Pressable
                  onPress={onTakePhoto}
                  disabled={isCapturing || !cameraPermission?.granted}
                  className="size-20 items-center justify-center rounded-full border-4 border-gray-900"
                  accessibilityRole="button"
                  accessibilityLabel="Capture document image">
                  {isCapturing ? (
                    <ActivityIndicator color="#111827" />
                  ) : (
                    <View className="size-16 rounded-full bg-gray-100" />
                  )}
                </Pressable>
              </View>

              <Pressable
                onPress={() =>
                  setCameraFacing((current) => (current === 'back' ? 'front' : 'back'))
                }
                className="mt-3 self-center"
                accessibilityRole="button"
                accessibilityLabel="Switch camera">
                <Text className="font-body text-[13px] text-gray-600">Switch camera</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Image source={{ uri: capturedUri }} className="flex-1" resizeMode="cover" />
            <View className="absolute bottom-10 left-6 right-6 rounded-[28px] bg-white px-5 py-5">
              <Text className="text-center font-subtitle text-[22px] text-gray-900">
                Use this photo?
              </Text>
              <Text className="mt-2 text-center font-body text-[14px] leading-6 text-gray-500">
                Make sure all text is clear before continuing.
              </Text>

              <View className="mt-4 gap-y-3">
                <Button title="Use photo" onPress={onUsePhoto} />
                <Button
                  title="Retake"
                  variant="white"
                  onPress={() => {
                    setCapturedUri(null);
                    setCapturedBase64(null);
                  }}
                />
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}
