import React, { useState } from 'react';
import { View, Text, StatusBar, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../../components/ui';
import { PhoneNumberInput, AuthGradient, StaggeredChild } from '@/components';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores/authStore';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { useOnboardingComplete } from '@/api/hooks/useOnboarding';
import type { OnboardingCompleteRequest } from '@/api/types';

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

const normalizePhone = (
  rawPhone: string | undefined,
  country: string | undefined
): string | undefined => {
  if (!rawPhone?.trim()) return undefined;
  const compact = rawPhone.replace(/[^\d+]/g, '');
  if (compact.startsWith('+')) {
    const normalized = `+${compact.slice(1).replace(/\D/g, '')}`;
    return E164_REGEX.test(normalized) ? normalized : undefined;
  }
  const digits = rawPhone.replace(/\D/g, '');
  if ((country === 'US' || country === 'CA') && digits.length === 10) {
    return `+1${digits}`;
  }
  return undefined;
};

const isPasskeySignupMethod = (value?: string) => value === 'passkey';

export default function Phone() {
  const registrationData = useAuthStore((state) => state.registrationData);
  const updateRegistrationData = useAuthStore((state) => state.updateRegistrationData);
  const clearRegistrationData = useAuthStore((state) => state.clearRegistrationData);
  const updateUser = useAuthStore((state) => state.updateUser);
  const setOnboardingStatus = useAuthStore((state) => state.setOnboardingStatus);
  const [phone, setPhone] = useState(registrationData.phone || '');
  const { showWarning, showError } = useFeedbackPopup();
  const { mutate: completeOnboarding, isPending } = useOnboardingComplete();
  const isPasskeySignup = isPasskeySignupMethod(registrationData.authMethod);

  const handleNext = () => {
    const normalizedPhone = phone.trim();
    const nextRegistrationData = { ...registrationData, phone: normalizedPhone };
    updateRegistrationData({ phone: normalizedPhone });

    const { hasCompletedOnboarding, hasPasscode } = useAuthStore.getState();
    const isDeferredFlow = !hasCompletedOnboarding && hasPasscode;

    if (!isPasskeySignup && !isDeferredFlow) {
      router.push(ROUTES.AUTH.COMPLETE_PROFILE.CREATE_PASSWORD as never);
      return;
    }

    // In deferred flow, name comes from user profile (already saved during basic-complete)
    const user = useAuthStore.getState().user;
    const firstName = nextRegistrationData.firstName || user?.firstName || '';
    const lastName = nextRegistrationData.lastName || user?.lastName || '';

    const payload: OnboardingCompleteRequest = {
      firstName,
      lastName,
      dateOfBirth: nextRegistrationData.dob,
      country: nextRegistrationData.country,
      address: {
        street: nextRegistrationData.street,
        city: nextRegistrationData.city,
        state: nextRegistrationData.state,
        postalCode: nextRegistrationData.postalCode,
        country: nextRegistrationData.country,
      },
      phone: normalizePhone(nextRegistrationData.phone, nextRegistrationData.country),
    };

    if (
      !payload.firstName ||
      !payload.lastName ||
      !payload.dateOfBirth ||
      !payload.country ||
      !payload.address.street ||
      !payload.address.city ||
      !payload.address.state ||
      !payload.address.postalCode
    ) {
      showWarning('Incomplete Profile', 'Please complete all required profile fields.');
      router.replace(ROUTES.AUTH.COMPLETE_PROFILE.PERSONAL_INFO as never);
      return;
    }

    completeOnboarding(payload, {
      onSuccess: (response) => {
        const firstName = payload.firstName.trim();
        const lastName = payload.lastName.trim();
        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

        updateUser({
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          fullName: fullName || undefined,
          phone: payload.phone || undefined,
          phoneNumber: payload.phone || undefined,
          country: payload.country || undefined,
        });

        setOnboardingStatus(response.onboarding?.onboardingStatus || 'kyc_pending');
        clearRegistrationData();
        router.replace('/kyc?autoLaunch=true' as never);
      },
      onError: (error: any) => {
        showError('Profile Submission Failed', error?.message || 'Please try again.');
      },
    });
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent={Platform.OS === 'android'}
        />
        <View className="flex-1 px-6 pt-4">
          <StaggeredChild index={0}>
            <View className="mb-8 mt-4">
              <Text className="font-headline-2 text-auth-title leading-[1.1] text-black">
                Phone Number
              </Text>
              <Text className="mt-2 font-body text-[14px] text-black/60">
                Add a phone number (Optional)
              </Text>
            </View>
          </StaggeredChild>

          <StaggeredChild index={1}>
            <PhoneNumberInput
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              defaultCountry={registrationData.country || 'US'}
            />
          </StaggeredChild>

          <StaggeredChild index={2} delay={80} style={{ marginTop: 'auto' }}>
            <View className="pb-4">
              <Button
                title={isPasskeySignup ? 'Create Account' : 'Next'}
                onPress={handleNext}
                loading={isPending}
                variant="orange"
              />
              <Pressable
                onPress={() => {
                  updateRegistrationData({ phone: '' });
                  const isDeferred = !useAuthStore.getState().hasCompletedOnboarding && useAuthStore.getState().hasPasscode;
                  if (!isPasskeySignup && !isDeferred) {
                    router.push(ROUTES.AUTH.COMPLETE_PROFILE.CREATE_PASSWORD as never);
                  } else {
                    const u = useAuthStore.getState().user;
                    const payload: OnboardingCompleteRequest = {
                      firstName: registrationData.firstName || u?.firstName || '',
                      lastName: registrationData.lastName || u?.lastName || '',
                      dateOfBirth: registrationData.dob,
                      country: registrationData.country,
                      address: {
                        street: registrationData.street,
                        city: registrationData.city,
                        state: registrationData.state,
                        postalCode: registrationData.postalCode,
                        country: registrationData.country,
                      },
                      phone: undefined,
                    };
                    completeOnboarding(payload, {
                      onSuccess: (response) => {
                        const firstName = payload.firstName.trim();
                        const lastName = payload.lastName.trim();
                        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
                        updateUser({
                          firstName: firstName || undefined,
                          lastName: lastName || undefined,
                          fullName: fullName || undefined,
                          phone: undefined,
                          phoneNumber: undefined,
                          country: payload.country || undefined,
                        });
                        setOnboardingStatus(response.onboarding?.onboardingStatus || 'kyc_pending');
                        clearRegistrationData();
                        router.replace('/kyc?autoLaunch=true' as never);
                      },
                      onError: (error: any) => {
                        showError(
                          'Profile Submission Failed',
                          error?.message || 'Please try again.'
                        );
                      },
                    });
                  }
                }}
                className="mt-3 py-2"
                accessibilityRole="button"
                accessibilityLabel="Skip phone number">
                <Text className="text-center font-body text-[14px] text-black/60">
                  Skip for now
                </Text>
              </Pressable>
            </View>
          </StaggeredChild>
        </View>
      </SafeAreaView>
    </AuthGradient>
  );
}
