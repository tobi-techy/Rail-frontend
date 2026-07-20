import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Keyboard,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '@/components/ui';
import { AuthGradient, InputField, StaggeredChild } from '@/components';
import { ROUTES } from '@/constants/routes';
import { useAppleSignIn, useGoogleSignIn } from '@/api/hooks/useAuth';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { getPostAuthRoute } from '@/utils/onboardingFlow';
import { useAuthStore } from '@/stores/authStore';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import { ImpactFeedbackStyle } from 'expo-haptics';

import { signupSchema, fieldError } from '@/utils/schemas';
import { isSafeInput } from '@/utils/security';
import { AppleLogo } from '@/assets/svg';
import { GoogleLogoIcon } from 'phosphor-react-native';
import { useButtonFeedback } from '@/hooks/useButtonFeedback';
import apiClient from '@/api/client';

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showError, showWarning } = useFeedbackPopup();
  const { mutate: appleSignIn } = useAppleSignIn();
  const { mutate: googleSignIn } = useGoogleSignIn();
  const triggerFeedback = useButtonFeedback();
  const { impact, notification } = useHaptics();
  const setPendingEmail = useAuthStore((s) => s.setPendingEmail);

  const handleSignIn = async () => {
    const result = signupSchema.safeParse({ email });
    if (!result.success) {
      setEmailError(fieldError(result.error, 'email'));
      const first = result.error.issues[0]?.message ?? 'Please check your input.';
      showWarning('Validation Error', first);
      return;
    }

    if (!isSafeInput(email)) {
      setEmailError('Invalid input detected');
      showWarning('Invalid Input', 'Please check your input and try again.');
      return;
    }

    setEmailError('');
    impact(ImpactFeedbackStyle.Medium);
    playUISound('buttonClick');
    setIsLoading(true);

    try {
      // Send OTP to email for signin
      await apiClient.post('/v1/auth/email/start', { email: result.data.email });
      setPendingEmail(result.data.email);
      notification('success');
      playUISound('transactionSuccess');
      router.push({ pathname: ROUTES.AUTH.VERIFY_EMAIL, params: { mode: 'signin' } } as never);
    } catch (error: any) {
      let userMessage = 'Sign in failed. Please try again.';
      if (error?.code === 'NETWORK_ERROR') {
        userMessage = 'Connection error. Check your internet and try again.';
      } else if (error?.status === 429) {
        userMessage = 'Too many attempts. Please wait a moment.';
      } else if (error?.status >= 500) {
        userMessage = 'Server error. Please try again later.';
      } else if (error?.message) {
        userMessage = error.message;
      }
      setEmailError(userMessage);
      showError('Sign In Failed', userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthGradient>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={Platform.OS === 'android'}
      />
      <Pressable
        style={{ flex: 1, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }}
        onPress={Keyboard.dismiss}>
        <View className="flex-1 px-6">
          <StaggeredChild index={0}>
            <View className="mb-10">
              <Text
                className="font-headline text-auth-title leading-[1.1] text-charcoal-primary"
                maxFontSizeMultiplier={1.3}>
                Welcome Back
              </Text>
              <Text className="mt-2 font-body text-body text-ash" maxFontSizeMultiplier={1.4}>
                Sign in to continue
              </Text>
            </View>
          </StaggeredChild>

          <View className="gap-y-2">
            <StaggeredChild index={1}>
              <InputField
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (emailError) setEmailError('');
                }}
                type="email"
                error={emailError}
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
              />
            </StaggeredChild>
          </View>

          <StaggeredChild index={2} delay={120} style={{ marginTop: 'auto' }}>
            <View className="pt-8">
              <View className="w-full flex-row items-stretch gap-3">
                {Platform.OS === 'android' ? (
                  <Button
                    title="Sign Up with Google"
                    leftIcon={<GoogleLogoIcon />}
                    size="large"
                    flex
                    onPress={() => {
                      googleSignIn(undefined, {
                        onSuccess: (resp) =>
                          router.replace(getPostAuthRoute(resp.user?.onboardingStatus) as never),
                        onError: () =>
                          showError(
                            'Google Sign-In Failed',
                            'Please try again or use email sign in.'
                          ),
                      });
                    }}
                    variant="white"
                  />
                ) : (
                  <Button
                    title="Sign In With Apple"
                    leftIcon={<AppleLogo width={20} height={20} />}
                    size="large"
                    flex
                    onPress={() => {
                      appleSignIn(undefined, {
                        onSuccess: (resp) =>
                          router.replace(getPostAuthRoute(resp.user?.onboardingStatus) as never),
                        onError: () =>
                          showError(
                            'Apple Sign-In Failed',
                            'Please try again or use email sign in.'
                          ),
                      });
                    }}
                    variant="white"
                  />
                )}
                <Button
                  title="Sign In With Mail"
                  onPress={handleSignIn}
                  loading={isLoading}
                  variant="orange"
                  size="large"
                  flex
                />
              </View>
              <TouchableOpacity
                onPress={() => {
                  triggerFeedback();
                  router.push(ROUTES.AUTH.SIGNUP as never);
                }}
                className="mt-4"
                accessibilityLabel="Sign up"
                accessibilityHint="Navigate to registration">
                <Text
                  className="text-center font-body text-caption text-ash"
                  maxFontSizeMultiplier={1.4}>
                  New to Rail?{' '}
                  <Text
                    className="font-subtitle text-charcoal-primary underline"
                    maxFontSizeMultiplier={1.3}>
                    Sign Up
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </StaggeredChild>
        </View>
      </Pressable>
    </AuthGradient>
  );
}
