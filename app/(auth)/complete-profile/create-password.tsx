import React, { useState } from 'react';
import { View, Text, StatusBar, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
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

export default function CreatePassword() {
  const registrationData = useAuthStore((state) => state.registrationData);
  const updateRegistrationData = useAuthStore((state) => state.updateRegistrationData);
  const clearRegistrationData = useAuthStore((state) => state.clearRegistrationData);
  const updateUser = useAuthStore((state) => state.updateUser);
  const setOnboardingStatus = useAuthStore((state) => state.setOnboardingStatus);
  const [password, setPassword] = useState(registrationData.password || '');
  const [confirmPassword, setConfirmPassword] = useState(registrationData.password || '');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { showWarning, showError } = useFeedbackPopup();
  const { mutate: completeOnboarding, isPending } = useOnboardingComplete();
  const isPasskeySignup = isPasskeySignupMethod(registrationData.authMethod);

  const submitProfile = (passwordValue?: string) => {
    setPasswordError('');
    setConfirmPasswordError('');
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
    const normalizedPassword = password.trim();
    const normalizedConfirm = confirmPassword.trim();
    const hasPasswordInput = normalizedPassword.length > 0 || normalizedConfirm.length > 0;

    if (!isPasskeySignup || hasPasswordInput) {
      if (normalizedPassword.length < 12) {
        setPasswordError('Password must be at least 12 characters');
        showWarning('Weak Password', 'Password must be at least 12 characters.');
        return;
      }

      if (normalizedPassword !== normalizedConfirm) {
        setConfirmPasswordError('Passwords do not match');
        showWarning('Password Mismatch', 'Passwords do not match.');
        return;
      }

      submitProfile(normalizedPassword);
      return;
    }

    submitProfile();
  };

  const handleSkipPassword = () => {
    if (!isPasskeySignup || isPending) return;
    setPassword('');
    setConfirmPassword('');
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
              <Text className="font-subtitle text-[50px] text-black">
                {isPasskeySignup ? 'Create Password (Optional)' : 'Create Password'}
              </Text>
              <Text className="mt-2 font-body text-[14px] text-black/60">
                {isPasskeySignup
                  ? 'You can skip this and continue with your passkey'
                  : 'Secure your account'}
              </Text>
            </View>
          </StaggeredChild>

          <View className="gap-y-2">
            <StaggeredChild index={1}>
              <InputField
                label={isPasskeySignup ? 'Password (Optional)' : 'Password'}
                placeholder="Min 12 characters"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (passwordError) setPasswordError('');
                }}
                type="password"
                error={passwordError}
                isPasswordVisible={showPassword}
                onTogglePasswordVisibility={() => setShowPassword(!showPassword)}
              />
            </StaggeredChild>

            <StaggeredChild index={2}>
              <InputField
                label="Confirm Password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  if (confirmPasswordError) setConfirmPasswordError('');
                }}
                type="password"
                error={confirmPasswordError}
                isPasswordVisible={showConfirm}
                onTogglePasswordVisibility={() => setShowConfirm(!showConfirm)}
              />
            </StaggeredChild>
          </View>

          <StaggeredChild index={3} delay={80} style={{ marginTop: 'auto' }}>
            <View className="pb-4">
              <Button
                title={isPasskeySignup ? 'Create Account' : 'Complete Profile'}
                onPress={handleSubmit}
                loading={isPending}
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
