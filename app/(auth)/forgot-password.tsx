import React, { useCallback, useRef, useState } from 'react';
import { View, Text, Pressable, Keyboard, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button } from '@/components/ui';
import { InputField, AuthGradient, StaggeredChild } from '@/components';
import { OTPInput } from '@/components/ui/OTPInput';
import { ROUTES } from '@/constants/routes';
import { useForgotPassword, useVerifyResetCode, useResetPassword } from '@/api/hooks/useAuth';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { validatePassword } from '@/utils/inputValidator';

type Step = 'email' | 'otp' | 'password';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const otpRef = useRef<any>(null);

  const { mutate: forgotPassword, isPending: isSending } = useForgotPassword();
  const { mutate: verifyCode, isPending: isVerifying } = useVerifyResetCode();
  const { mutate: resetPassword, isPending: isResetting } = useResetPassword();
  const { showError, showSuccess } = useFeedbackPopup();

  // Step 1: Send OTP
  const handleSendCode = useCallback(() => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setEmailError('Email is required');
      return;
    }
    if (!isValidEmail(normalized)) {
      setEmailError('Enter a valid email');
      return;
    }
    setEmailError('');
    Keyboard.dismiss();
    forgotPassword(
      { email: normalized },
      {
        onSuccess: () => setStep('otp'),
        onError: (e: any) => showError('Failed', e?.message || 'Could not send reset code'),
      }
    );
  }, [email, forgotPassword, showError]);

  // Step 2: Verify OTP
  const handleVerifyCode = useCallback(
    (code: string) => {
      setOtpError('');
      verifyCode(
        { email: email.trim().toLowerCase(), code },
        {
          onSuccess: (res) => {
            setResetToken(res.reset_token);
            setStep('password');
          },
          onError: () => {
            setOtpError('Invalid or expired code');
            otpRef.current?.clear();
          },
        }
      );
    },
    [email, verifyCode]
  );

  // Step 3: Set new password
  const handleResetPassword = useCallback(() => {
    const v = validatePassword(password);
    if (!v.isValid) {
      setPasswordError(v.errors[0] ?? 'Password too weak');
      return;
    }
    if (password !== confirmPassword) {
      setConfirmError('Passwords don\u2019t match');
      return;
    }
    setPasswordError('');
    setConfirmError('');
    Keyboard.dismiss();
    resetPassword(
      { token: resetToken, password },
      {
        onSuccess: () => {
          showSuccess('Password updated', 'Sign in with your new password.');
          router.replace(ROUTES.AUTH.SIGNIN as never);
        },
        onError: (e: any) => showError('Failed', e?.message || 'Could not reset password'),
      }
    );
  }, [password, confirmPassword, resetToken, resetPassword, showSuccess, showError]);

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1">
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent={Platform.OS === 'android'}
        />
        <Pressable className="flex-1 px-6 pb-6" onPress={Keyboard.dismiss}>
          {/* ── Step 1: Email ── */}
          {step === 'email' && (
            <>
              <StaggeredChild index={0}>
                <View className="mb-8 mt-4">
                  <Text className="font-headline-2 text-auth-title leading-[1.1] text-black">
                    Forgot password
                  </Text>
                  <Text className="mt-2 font-body text-base text-black/60">
                    Enter your email and we&apos;ll send you a 6-digit code to reset your password.
                  </Text>
                </View>
              </StaggeredChild>
              <StaggeredChild index={1}>
                <InputField
                  label="Email Address"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (emailError) setEmailError('');
                  }}
                  type="email"
                  error={emailError}
                />
              </StaggeredChild>
              <StaggeredChild index={2} delay={80} style={{ marginTop: 'auto' }}>
                <View className="pt-8">
                  <Button title="Send code" onPress={handleSendCode} loading={isSending} />
                  <Pressable
                    className="mt-6 items-center"
                    onPress={() => router.replace(ROUTES.AUTH.SIGNIN as never)}>
                    <Text className="font-body text-caption text-black/60">
                      Remember it? <Text className="text-black underline">Sign in</Text>
                    </Text>
                  </Pressable>
                </View>
              </StaggeredChild>
            </>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 'otp' && (
            <>
              <Animated.View entering={FadeInDown.duration(300)} className="mb-8 mt-4">
                <Text className="font-headline-2 text-auth-title leading-[1.1] text-black">
                  Enter code
                </Text>
                <Text className="mt-2 font-body text-base text-black/60">
                  We sent a 6-digit code to{' '}
                  <Text className="font-subtitle text-black">{email.trim().toLowerCase()}</Text>
                </Text>
              </Animated.View>
              <Animated.View entering={FadeIn.delay(150).duration(300)}>
                <OTPInput
                  ref={otpRef}
                  length={6}
                  onComplete={handleVerifyCode}
                  error={otpError}
                  isInvalid={!!otpError}
                />
              </Animated.View>
              {isVerifying && (
                <Animated.View entering={FadeIn.duration(200)} className="mt-4">
                  <Text className="text-center font-body text-[13px] text-black/50">
                    Verifying…
                  </Text>
                </Animated.View>
              )}
              <View style={{ marginTop: 'auto' }} className="pt-8">
                <Pressable
                  onPress={() => {
                    setStep('email');
                    setOtpError('');
                  }}>
                  <Text className="text-center font-body text-[14px] text-black/60">
                    Didn&apos;t get it? <Text className="text-black underline">Resend code</Text>
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          {/* ── Step 3: New password ── */}
          {step === 'password' && (
            <>
              <Animated.View entering={FadeInDown.duration(300)} className="mb-8 mt-4">
                <Text className="font-headline-2 text-auth-title leading-[1.1] text-black">
                  New password
                </Text>
                <Text className="mt-2 font-body text-base text-black/60">
                  Choose a strong password for your account.
                </Text>
              </Animated.View>
              <Animated.View entering={FadeInUp.delay(100).duration(300)} className="gap-y-3">
                <InputField
                  label="New Password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    if (passwordError) setPasswordError('');
                  }}
                  type="password"
                  error={passwordError}
                  isPasswordVisible={showPassword}
                  onTogglePasswordVisibility={() => setShowPassword(!showPassword)}
                />
                <InputField
                  label="Confirm Password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChangeText={(v) => {
                    setConfirmPassword(v);
                    if (confirmError) setConfirmError('');
                  }}
                  type="password"
                  error={confirmError}
                  isPasswordVisible={showConfirm}
                  onTogglePasswordVisibility={() => setShowConfirm(!showConfirm)}
                />
              </Animated.View>
              <View style={{ marginTop: 'auto' }} className="pt-8">
                <Button
                  title="Update password"
                  onPress={handleResetPassword}
                  loading={isResetting}
                />
              </View>
            </>
          )}
        </Pressable>
      </SafeAreaView>
    </AuthGradient>
  );
}
