import React, { useState, useMemo } from 'react';
import { View, Text, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../../components/ui';
import { InputField, AuthGradient, StaggeredChild } from '@/components';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores/authStore';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { useOnboardingBasicComplete } from '@/api/hooks/useOnboarding';
import { passwordSchema } from '@/utils/schemas';
import { CheckmarkCircle01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

const PASSWORD_RULES = [
  { label: '8 characters', test: (v: string) => v.length >= 8 },
  {
    label: 'A symbol, number, or upper-case letter',
    test: (v: string) => /[A-Z]|[0-9]|[^a-zA-Z0-9]/.test(v),
  },
] as const;

export default function CreatePassword() {
  const registrationData = useAuthStore((state) => state.registrationData);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const { showWarning, showError } = useFeedbackPopup();
  const { mutate: basicComplete, isPending } = useOnboardingBasicComplete();

  const isPasswordValid = useMemo(() => passwordSchema.safeParse(password).success, [password]);
  const doPasswordsMatch = useMemo(
    () => password === confirmPassword || confirmPassword === '',
    [password, confirmPassword]
  );

  const handleSubmit = () => {
    if (!isPasswordValid) {
      showWarning('Weak Password', 'Please meet all password requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      showWarning('Password Mismatch', 'Please make sure your passwords match.');
      return;
    }
    setConfirmPasswordError('');

    if (!registrationData.firstName || !registrationData.lastName) {
      showWarning('Missing Info', 'Please go back and enter your name.');
      router.replace(ROUTES.AUTH.COMPLETE_PROFILE.PERSONAL_INFO as never);
      return;
    }

    basicComplete(
      {
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        password: password.trim(),
      },
      {
        onSuccess: () => {
          router.replace(ROUTES.AUTH.CREATE_PASSCODE as never);
        },
        onError: (error: any) => {
          showError('Signup Failed', error?.message || 'Please try again.');
        },
      }
    );
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
            </View>
          </StaggeredChild>

          <StaggeredChild index={1}>
            <Text className="mb-2 font-subtitle text-[14px] text-black">Password</Text>
            <InputField
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (confirmPasswordError) setConfirmPasswordError('');
              }}
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
                      {passed && (
                        <HugeiconsIcon
                          icon={CheckmarkCircle01Icon}
                          size={12}
                          color="#FFFFFF"
                          strokeWidth={3}
                        />
                      )}
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

            <View className="mt-6">
              <Text className="mb-2 font-subtitle text-[14px] text-black">Confirm Password</Text>
              <InputField
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (confirmPasswordError) setConfirmPasswordError('');
                }}
                type="password"
                isPasswordVisible={showPassword}
                onTogglePasswordVisibility={() => setShowPassword(!showPassword)}
                error={confirmPasswordError}
              />
            </View>
          </StaggeredChild>

          <StaggeredChild index={2} delay={80} style={{ marginTop: 'auto' }}>
            <View className="pb-4">
              <Button
                title="Create account"
                onPress={handleSubmit}
                loading={isPending}
                disabled={!isPasswordValid || !doPasswordsMatch}
                variant="orange"
              />
            </View>
          </StaggeredChild>
        </View>
      </SafeAreaView>
    </AuthGradient>
  );
}
