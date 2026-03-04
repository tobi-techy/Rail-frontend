import React, { useState, useMemo } from 'react';
import { View, Text, StatusBar, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { z } from 'zod/v4';
import { Button } from '../../../components/ui';
import { InputField, AuthGradient, StaggeredChild } from '@/components';
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

// Zod password schema
const passwordSchema = z
  .string()
  .min(8)
  .regex(/[A-Z]|[0-9]|[^a-zA-Z0-9]/);

// Individual rule checks for live indicators
const PASSWORD_RULES = [
  { label: '8 characters', test: (v: string) => v.length >= 8 },
  {
    label: 'A symbol, number, or upper-case letter',
    test: (v: string) => /[A-Z]|[0-9]|[^a-zA-Z0-9]/.test(v),
  },
] as const;

export default function CreatePassword() {
  const registrationData = useAuthStore((state) => state.registrationData);
  const updateRegistrationData = useAuthStore((state) => state.updateRegistrationData);
  const clearRegistrationData = useAuthStore((state) => state.clearRegistrationData);
  const updateUser = useAuthStore((state) => state.updateUser);
  const setOnboardingStatus = useAuthStore((state) => state.setOnboardingStatus);
  const [password, setPassword] = useState(registrationData.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const { showWarning, showError } = useFeedbackPopup();
  const { mutate: completeOnboarding, isPending } = useOnboardingComplete();
  const isPasskeySignup = isPasskeySignupMethod(registrationData.authMethod);

  const isPasswordValid = useMemo(() => passwordSchema.safeParse(password).success, [password]);

  const submitProfile = (passwordValue?: string) => {
    updateRegistrationData({ password: passwordValue || '' });

    const payload: OnboardingCompleteRequest = {
      firstName: registrationData.firstName,
      lastName: registrationData.lastName,
      dateOfBirth: registrationData.dob,
      country: registrationData.country,
      address: {
        street: registrationData.street,
        city: registrationData.city,
        state: registrationData.state,
        postalCode: registrationData.postalCode,
        country: registrationData.country,
      },
      phone: normalizePhone(registrationData.phone, registrationData.country),
    };
    if (passwordValue) payload.password = passwordValue;

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
          phoneNumber: payload.phone || undefined,
        });

        setOnboardingStatus(response.onboarding?.onboardingStatus || 'kyc_pending');
        clearRegistrationData();
        router.replace(ROUTES.AUTH.CREATE_PASSCODE as never);
      },
      onError: (error: any) => {
        showError('Profile Submission Failed', error?.message || 'Please try again.');
      },
    });
  };

  const handleSubmit = () => {
    const trimmed = password.trim();
    const hasInput = trimmed.length > 0;

    if (!isPasskeySignup || hasInput) {
      if (!isPasswordValid) {
        showWarning('Weak Password', 'Please meet all password requirements.');
        return;
      }
      submitProfile(trimmed);
      return;
    }

    submitProfile();
  };

  const handleSkipPassword = () => {
    if (!isPasskeySignup || isPending) return;
    setPassword('');
    submitProfile();
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
              <Text className="font-display text-[32px] leading-[36px] text-black">
                Create a password
              </Text>
              {isPasskeySignup && (
                <Text className="mt-2 font-body text-[14px] text-black/60">
                  Optional — you can continue with your passkey
                </Text>
              )}
            </View>
          </StaggeredChild>

          <StaggeredChild index={1}>
            <Text className="mb-2 font-subtitle text-[14px] text-black">Password</Text>
            <InputField
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              type="password"
              isPasswordVisible={showPassword}
              onTogglePasswordVisibility={() => setShowPassword(!showPassword)}
            />

            <View className="mt-3 gap-y-1.5">
              {PASSWORD_RULES.map((rule) => {
                const passed = password.length > 0 && rule.test(password);
                return (
                  <View key={rule.label} className="flex-row items-center gap-x-2">
                    <View
                      className={`size-5 items-center justify-center rounded-full ${
                        passed ? 'bg-black' : 'border border-gray-300 bg-white'
                      }`}>
                      {passed && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                    <Text
                      className={`font-body text-[13px] ${
                        passed ? 'text-black' : 'text-gray-400'
                      }`}>
                      {rule.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </StaggeredChild>

          <StaggeredChild index={2} delay={80} style={{ marginTop: 'auto' }}>
            <View className="pb-4">
              <Button
                title="Create account"
                onPress={handleSubmit}
                loading={isPending}
                disabled={!isPasskeySignup && !isPasswordValid}
              />
              {isPasskeySignup ? (
                <TouchableOpacity
                  onPress={handleSkipPassword}
                  disabled={isPending}
                  className="mt-4 py-1">
                  <Text className="text-center font-body text-[14px] text-black/60 underline">
                    Skip password for now
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </StaggeredChild>
        </View>
      </SafeAreaView>
    </AuthGradient>
  );
}
