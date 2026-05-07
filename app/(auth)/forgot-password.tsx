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
import { emailSchema, resetPasswordSchema, fieldError } from '@/utils/schemas';

type Step = 'email' | 'otp' | 'password';

const normalizeEmail = (value: string) => value.trim().toLowerCase();

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

  const sendResetCode = useCallback(
    (targetEmail: string, options?: { isResend?: boolean }) => {
      if (isSending) return;

      setOtpError('');
      setResetToken('');
      setPassword('');
      setConfirmPassword('');
      setPasswordError('');
      setConfirmError('');
      Keyboard.dismiss();

      forgotPassword(
        { email: targetEmail },
        {
          onSuccess: () => {
            otpRef.current?.clear?.();
            setStep('otp');
            if (options?.isResend) {
              showSuccess('Code sent', 'Check your email for a new reset code.');
            }
          },
          onError: (e: any) => showError('Failed', e?.message || 'Could not send reset code'),
        }
      );
    },
    [forgotPassword, isSending, showError, showSuccess]
  );

  // Step 1: Send OTP
  const handleSendCode = useCallback(() => {
    if (isSending) return;

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setEmailError(result.error.issues[0]?.message ?? 'Enter a valid email');
      return;
    }
    setEmail(result.data);
    setEmailError('');
    sendResetCode(result.data);
  }, [email, isSending, sendResetCode]);

  const handleResendCode = useCallback(() => {
    const targetEmail = normalizeEmail(email);
    if (!targetEmail || isSending || isVerifying) return;
    sendResetCode(targetEmail, { isResend: true });
  }, [email, isSending, isVerifying, sendResetCode]);

  // Step 2: Verify OTP
  const handleVerifyCode = useCallback(
    (code: string) => {
      if (isVerifying || code.length !== 6) return;

      setOtpError('');
      verifyCode(
        { email: normalizeEmail(email), code },
        {
          onSuccess: (res) => {
            if (!res?.reset_token) {
              setOtpError('Could not verify code. Please request a new one.');
              otpRef.current?.clear?.();
              showError('Failed', 'Could not verify code. Please request a new one.');
              return;
            }
            setResetToken(res.reset_token);
            setPassword('');
            setConfirmPassword('');
            setStep('password');
          },
          onError: () => {
            setOtpError('Invalid or expired code');
            otpRef.current?.clear?.();
          },
        }
      );
    },
    [email, isVerifying, showError, verifyCode]
  );

  // Step 3: Set new password
  const handleResetPassword = useCallback(() => {
    if (isResetting) return;

    const result = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      setPasswordError(fieldError(result.error, 'password'));
      setConfirmError(fieldError(result.error, 'confirmPassword'));
      return;
    }
    setPasswordError('');
    setConfirmError('');
    Keyboard.dismiss();

    if (!resetToken) {
      setPassword('');
      setConfirmPassword('');
      setStep('otp');
      showError('Code expired', 'Please verify a new reset code.');
      return;
    }

    resetPassword(
      { token: resetToken, password },
      {
        onSuccess: () => {
          setResetToken('');
          setPassword('');
          setConfirmPassword('');
          showSuccess('Password updated', 'Sign in with your new password.');
          router.replace(ROUTES.AUTH.SIGNIN as never);
        },
        onError: (e: any) => {
          const message = e?.message || 'Could not reset password';
          if (e?.code === 'INVALID_TOKEN') {
            setResetToken('');
            setPassword('');
            setConfirmPassword('');
            setStep('otp');
          }
          showError('Failed', message);
        },
      }
    );
  }, [password, confirmPassword, resetToken, resetPassword, isResetting, showSuccess, showError]);

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
                  <Text className="font-headline-2 text-auth-title leading-[1.1] text-charcoal-primary">
                    Forgot password
                  </Text>
                  <Text className="mt-2 font-body text-base text-ash">
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
                  <Button
                    title="Send code"
                    onPress={handleSendCode}
                    loading={isSending}
                    variant="orange"
                  />
                  <Pressable
                    className="mt-6 items-center"
                    onPress={() => router.replace(ROUTES.AUTH.SIGNIN as never)}>
                    <Text className="font-body text-caption text-ash">
                      Remember it? <Text className="text-charcoal-primary underline">Sign in</Text>
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
                <Text className="font-headline-2 text-auth-title leading-[1.1] text-charcoal-primary">
                  Enter code
                </Text>
                <Text className="mt-2 font-body text-base text-ash">
                  We sent a 6-digit code to{' '}
                  <Text className="font-subtitle text-charcoal-primary">
                    {email.trim().toLowerCase()}
                  </Text>
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
                  <Text className="text-center font-body text-[13px] text-smoke">Verifying…</Text>
                </Animated.View>
              )}
              <View style={{ marginTop: 'auto' }} className="pt-8">
                <Pressable onPress={handleResendCode} disabled={isSending || isVerifying}>
                  <Text className="text-center font-body text-[14px] text-ash">
                    Didn&apos;t get it?{' '}
                    <Text className="text-charcoal-primary underline">
                      {isSending ? 'Sending...' : 'Resend code'}
                    </Text>
                  </Text>
                </Pressable>
                <Pressable
                  className="mt-4"
                  onPress={() => {
                    setStep('email');
                    setOtpError('');
                    setResetToken('');
                    setPassword('');
                    setConfirmPassword('');
                    otpRef.current?.clear?.();
                  }}>
                  <Text className="text-center font-body text-[14px] text-ash">
                    Wrong email?{' '}
                    <Text className="text-charcoal-primary underline">Change email</Text>
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          {/* ── Step 3: New password ── */}
          {step === 'password' && (
            <>
              <Animated.View entering={FadeInDown.duration(300)} className="mb-8 mt-4">
                <Text className="font-headline-2 text-auth-title leading-[1.1] text-charcoal-primary">
                  New password
                </Text>
                <Text className="mt-2 font-body text-base text-ash">
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
                  variant="orange"
                />
              </View>
            </>
          )}
        </Pressable>
      </SafeAreaView>
    </AuthGradient>
  );
}
