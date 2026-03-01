import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Keyboard, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui';
import { InputField, AuthGradient, StaggeredChild } from '@/components';
import { ROUTES } from '@/constants/routes';
import { useResetPassword } from '@/api/hooks/useAuth';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';

import { validatePassword } from '@/utils/inputValidator';

export default function ResetPassword() {
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = useMemo(() => {
    if (!params.token) return '';
    return Array.isArray(params.token) ? params.token[0] : params.token;
  }, [params.token]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { mutate: resetPassword, isPending } = useResetPassword();
  const { showError, showSuccess, showWarning } = useFeedbackPopup();

  const handleResetPassword = () => {
    if (!token) {
      showError('Invalid Link', 'Reset token is missing. Please request a new reset link.');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.errors[0] ?? 'Password does not meet requirements');
      showWarning(
        'Weak Password',
        passwordValidation.errors[0] ?? 'Password does not meet requirements'
      );
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      showWarning('Password Mismatch', 'Passwords do not match.');
      return;
    }

    setPasswordError('');
    setConfirmPasswordError('');
    resetPassword(
      { token, password },
      {
        onSuccess: () => {
          showSuccess('Password Updated', 'Your password has been reset successfully.', {
            duration: 0,
            action: {
              label: 'Sign In',
              onPress: () => router.replace(ROUTES.AUTH.SIGNIN as never),
            },
          });
        },
        onError: (error: any) => {
          showError(
            'Reset Failed',
            error?.message || 'This reset link is invalid or has expired. Request a new one.'
          );
        },
      }
    );
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1">
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent={Platform.OS === 'android'}
        />
        <Pressable className="flex-1 px-6 pb-6" onPress={Keyboard.dismiss}>
            <StaggeredChild index={0}>
              <View className="mb-8 mt-4">
                <Text className="font-headline text-auth-title text-black">Reset password</Text>
                <Text className="mt-2 font-body text-base text-black/60">
                  Enter a new password to secure your account.
                </Text>
              </View>
            </StaggeredChild>

            {!token ? (
              <StaggeredChild index={1}>
                <View className="rounded-2xl bg-black/5 p-4">
                  <Text className="font-body text-caption text-black/70">
                    This reset link is invalid or missing a token. Please request a new password
                    reset email.
                  </Text>
                </View>
              </StaggeredChild>
            ) : (
              <View className="gap-y-2">
                <StaggeredChild index={1}>
                  <InputField
                    label="New Password"
                    placeholder="At least 8 characters"
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
                    isPasswordVisible={showConfirmPassword}
                    onTogglePasswordVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                </StaggeredChild>
              </View>
            )}

            <StaggeredChild index={3} delay={80} style={{ marginTop: 'auto' }}>
              <View className="pt-8">
                {token ? (
                  <Button
                    title="Update Password"
                    onPress={handleResetPassword}
                    loading={isPending}
                  />
                ) : (
                  <Button
                    title="Request new reset link"
                    onPress={() => router.replace(ROUTES.AUTH.FORGOT_PASSWORD as never)}
                  />
                )}
              </View>
            </StaggeredChild>
        </Pressable>
      </SafeAreaView>
    </AuthGradient>
  );
}
