import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronRight, X, Car, CreditCard, Home, Globe } from 'lucide-react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useKycStore } from '@/stores/kycStore';
import { COUNTRY_LABELS, type Country } from '@/api/types/kyc';
import type { KycDocumentType } from '@/components/sheets/CameraOverlay';

const COUNTRIES: Country[] = ['USA', 'GBR', 'NGA'];

const DOC_TYPES: { id: KycDocumentType; label: string; icon: React.ElementType }[] = [
  { id: 'drivers_license', label: 'Driver license', icon: Car },
  { id: 'id_card', label: 'ID card', icon: CreditCard },
  { id: 'residence_permit', label: 'Residence permit', icon: Home },
  { id: 'passport', label: 'Passport', icon: Globe },
];

export default function KycDetailsScreen() {
  const { country, setCountry, setDocumentType } = useKycStore();
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const handleSelectDoc = (docType: KycDocumentType) => {
    setDocumentType(docType);
    router.push('/kyc/documents');
  };

  const selectedCountryLabel = COUNTRY_LABELS[country] || 'Select country';
  const getCountryFlag = (c: Country) => (c === 'USA' ? '🇺🇸' : c === 'GBR' ? '🇬🇧' : '🇳🇬');

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
          <View className="size-11" />
          <Pressable
            className="size-11 items-center justify-center p-2"
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close">
            <X size={24} color="#111827" />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 44 }}>
          <Text className="mb-6 font-display text-[22px] leading-7 text-gray-900">
            Select country where your ID document was issued.
          </Text>

          <Pressable
            onPress={() => setShowCountryPicker(true)}
            className="mb-10 flex-row items-center justify-between rounded-xl bg-slate-50 p-4"
            accessibilityRole="button">
            <View className="flex-row items-center gap-3">
              <Text className="text-xl">{getCountryFlag(country)}</Text>
              <Text className="font-subtitle text-[16px] text-gray-900">
                {selectedCountryLabel}
              </Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </Pressable>

          <Text className="mb-4 font-display text-[20px] text-gray-900">
            Select your document type
          </Text>

          <View className="gap-y-3">
            {DOC_TYPES.map((doc) => {
              const Icon = doc.icon;
              return (
                <Pressable
                  key={doc.id}
                  onPress={() => handleSelectDoc(doc.id)}
                  className="flex-row items-center justify-between rounded-xl bg-slate-50 p-4 active:bg-slate-100"
                  accessibilityRole="button">
                  <View className="flex-row items-center gap-3">
                    <Icon size={22} color="#4B5563" strokeWidth={1.5} />
                    <Text className="font-subtitle text-[16px] text-gray-900">{doc.label}</Text>
                  </View>
                  <ChevronRight size={20} color="#9CA3AF" />
                </Pressable>
              );
            })}
          </View>

          <View className="mt-60 items-center px-4">
            <Text className="text-center font-body text-[13px] leading-5 text-gray-500">
              If you can&apos;t find your document type or country of issue, contact{' '}
              <Text className="font-subtitle text-primary">support</Text>.
            </Text>
          </View>
        </ScrollView>

        <Modal
          visible={showCountryPicker}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCountryPicker(false)}>
          <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center justify-between border-b border-gray-100 px-5 py-4">
              <Text className="font-subtitle text-[18px] text-gray-900">Select Country</Text>
              <Pressable onPress={() => setShowCountryPicker(false)} className="p-2">
                <X size={24} color="#111827" />
              </Pressable>
            </View>
            <ScrollView>
              {COUNTRIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => {
                    setCountry(c);
                    setShowCountryPicker(false);
                  }}
                  className={`flex-row items-center justify-between border-b border-gray-50 px-6 py-4 ${
                    country === c ? 'bg-slate-50' : 'bg-white'
                  }`}>
                  <View className="flex-row items-center gap-3">
                    <Text className="text-xl">{getCountryFlag(c)}</Text>
                    <Text className="font-subtitle text-[16px] text-gray-900">
                      {COUNTRY_LABELS[c]}
                    </Text>
                  </View>
                  {country === c && <View className="size-2.5 rounded-full bg-primary" />}
                </Pressable>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </ErrorBoundary>
  );
}
