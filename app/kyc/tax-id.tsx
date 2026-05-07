import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { InputField } from '@/components/atoms/InputField';
import { Button } from '@/components/ui';
import { COUNTRY_TAX_CONFIG, validateTaxId } from '@/api/types/kyc';
import { useKycStore } from '@/stores/kycStore';
import { ArrowLeft01Icon } from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';

export default function KycTaxIdScreen() {
  const insets = useSafeAreaInsets();
  const { country, taxIdType, taxId, setTaxId } = useKycStore();

  const [taxIdError, setTaxIdError] = useState('');

  const taxConfig = COUNTRY_TAX_CONFIG[country];

  const handleContinue = () => {
    if (taxId.trim().length === 0) {
      setTaxIdError('Please enter your tax ID');
      return;
    }
    const error = validateTaxId(country, taxIdType, taxId);
    if (error) {
      setTaxIdError(error);
      return;
    }
    setTaxIdError('');
    router.push('/kyc/about-you');
  };

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top']}>
        <View className="flex-row items-center justify-between px-4 pb-2 pt-1">
          <Pressable
            className="size-11 items-center justify-center rounded-full bg-stone-surface"
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#343433" />
          </Pressable>
          <Text className="font-subtitle text-[13px] text-ash">Step 2 of 4</Text>
          <View className="size-11" />
        </View>

        <View className="px-4">
          <View className="h-1.5 overflow-hidden rounded-full bg-fog">
            <View className="h-full w-2/4 rounded-full bg-midnight" />
          </View>
        </View>

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 100 }}>
            <Text className="font-display text-[30px] leading-[34px] text-charcoal-primary">Tax ID</Text>
            <Text className="mt-2 font-body text-[15px] leading-6 text-ash">
              Enter your tax identifier. We use this for regulatory compliance.
            </Text>

            <View className="mt-6">
              <InputField
                label={taxConfig.label}
                value={taxId}
                onChangeText={(v) => {
                  setTaxId(v);
                  if (taxIdError) setTaxIdError('');
                }}
                placeholder={taxConfig.placeholder}
                autoCapitalize="characters"
                error={taxIdError}
                helperText={taxConfig.helpText}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View
          className="absolute bottom-0 left-0 right-0 border-t border-stone-surface bg-parchment-card px-4 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <Button title="Continue" onPress={handleContinue} variant="orange" />
        </View>
      </SafeAreaView>
    </ErrorBoundary>
  );
}
