import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Keyboard,
  StatusBar,
  Platform,
  useWindowDimensions,
} from 'react-native';
import type { TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '@/components/ui';
import { AuthGradient, InputField, StaggeredChild } from '@/components';
import { ROUTES } from '@/constants/routes';
import { useAppleSignIn, useGoogleSignIn, useLogin } from '@/api/hooks/useAuth';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { getPostAuthRoute } from '@/utils/onboardingFlow';

import { signinSchema, fieldError } from '@/utils/schemas';

import { isSafeInput } from '@/utils/security';
import { AppleLogo } from '@/assets/svg';
import { GoogleLogoIcon, MailboxIcon } from 'phosphor-react-native';

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const { mutate: login, isPending } = useLogin();
  const { showError, showWarning } = useFeedbackPopup();
  const { mutate: appleSignIn } = useAppleSignIn();
  const { mutate: googleSignIn } = useGoogleSignIn();

  const handleSignIn = () => {
    const result = signinSchema.safeParse({ email, password });
    if (!result.success) {
      const err = result.error;
      setEmailError(fieldError(err, 'email'));
      setPasswordError(fieldError(err, 'password'));
      const first = err.issues[0]?.message ?? 'Please check your input.';
      showWarning('Validation Error', first);
      return;
    }

    if (!isSafeInput(email) || !isSafeInput(password)) {
      setEmailError('Invalid input detected');
      showWarning('Invalid Input', 'Please check your input and try again.');
      return;
    }

    setEmailError('');
    setPasswordError('');

    // Clear password from state immediately for security
    const passwordToUse = password;
    setPassword('');

    login(
      { email: result.data.email, password: passwordToUse },
      {
        onSuccess: (response) => {
          const targetRoute = getPostAuthRoute(response.user?.onboardingStatus);
          router.replace(targetRoute as never);
        },
        onError: (error: any) => {
          // Categorize error for better user messaging
          let userMessage = 'Sign in failed. Please try again.';

          if (error?.code === 'NETWORK_ERROR') {
            userMessage = 'Connection error. Check your internet and try again.';
          } else if (error?.status === 429) {
            userMessage = 'Too many attempts. Please wait a moment.';
          } else if (error?.status >= 500) {
            userMessage = 'Server error. Please try again later.';
          } else if (error?.status === 401 || error?.status === 403) {
            userMessage = 'Invalid email or password.';
          } else if (error?.message) {
            userMessage = error.message;
          }

          setPasswordError(userMessage);
          showError('Sign In Failed', userMessage);
          // Password already cleared from state above
        },
      }
    );
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
              <Text className="font-headline text-auth-title leading-[1.1] text-charcoal-primary">
                Welcome Back
              </Text>
              <Text className="mt-2 font-body text-body text-ash">Sign in to continue</Text>
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
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                // blurOnSubmit={false}
              />
            </StaggeredChild>

            <StaggeredChild index={2}>
              <InputField
                ref={passwordRef}
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (passwordError) setPasswordError('');
                }}
                type="password"
                error={passwordError}
                isPasswordVisible={showPassword}
                onTogglePasswordVisibility={() => setShowPassword(!showPassword)}
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
              />
            </StaggeredChild>

            <StaggeredChild index={3}>
              <TouchableOpacity
                onPress={() => router.push(ROUTES.AUTH.FORGOT_PASSWORD)}
                className="self-end"
                accessibilityLabel="Forgot Password"
                accessibilityHint="Navigate to reset your password">
                <Text className="font-subtitle text-small text-ash">Forgot Password?</Text>
              </TouchableOpacity>
            </StaggeredChild>
          </View>

          <StaggeredChild index={4} delay={120} style={{ marginTop: 'auto' }}>
            <View className="pt-8">
              {/*<Button title="Sign In" onPress={handleSignIn} loading={isPending} variant="orange" />*/}
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
                  leftIcon={<MailboxIcon size={20} weight="fill" color="#fff" />}
                  onPress={handleSignIn}
                  loading={isPending}
                  variant="orange"
                  size="large"
                  flex
                />
              </View>
              <TouchableOpacity
                onPress={() => router.push(ROUTES.AUTH.SIGNUP as never)}
                className="mt-4"
                accessibilityLabel="Sign up"
                accessibilityHint="Navigate to registration">
                <Text className="text-center font-body text-caption text-ash">
                  New to Rail?{' '}
                  <Text className="font-subtitle text-charcoal-primary underline">Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </StaggeredChild>
        </View>
      </Pressable>
    </AuthGradient>
  );
}
