import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { OTPInput } from '@/components/ui/OTPInput';
import { Button } from '@/components/ui';
import { useRequestMFAChallenge, useVerifyMFAChallenge } from '@/api/hooks/useSecurity';
import { useHaptics } from '@/hooks/useHaptics';
import * as Haptics from 'expo-haptics';
import type { MFAChallengeType } from '@/api/types/security';

interface MFAChallengeSheetProps {
  visible: boolean;
  onClose: () => void;
  onVerified: () => void;
  challengeType?: MFAChallengeType;
}

const EXPIRY_SECONDS = 300; // 5 min

export function MFAChallengeSheet({
  visible,
  onClose,
  onVerified,
  challengeType = 'otp_email',
}: MFAChallengeSheetProps) {
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(EXPIRY_SECONDS);
  const otpRef = useRef<any>(null);
  const { impact, notification } = useHaptics();

  const requestChallenge = useRequestMFAChallenge();
  const verifyChallenge = useVerifyMFAChallenge();

  // Auto-request challenge when visible
  useEffect(() => {
    if (!visible) return;
    setError('');
    setSecondsLeft(EXPIRY_SECONDS);
    requestChallenge.mutate({ challenge_type: challengeType });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Countdown timer
  useEffect(() => {
    if (!visible || secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [visible, secondsLeft]);

  const handleComplete = async (code: string) => {
    setError('');
    try {
      const res = await verifyChallenge.mutateAsync({ challenge_type: challengeType, code });
      if (res.verified) {
        notification();
        onVerified();
        onClose();
      } else {
        impact(Haptics.ImpactFeedbackStyle.Heavy);
        setError('Invalid code. Try again.');
        otpRef.current?.clear();
      }
    } catch {
      impact(Haptics.ImpactFeedbackStyle.Heavy);
      setError('Verification failed. Try again.');
      otpRef.current?.clear();
    }
  };

  const handleResend = () => {
    setError('');
    setSecondsLeft(EXPIRY_SECONDS);
    otpRef.current?.clear();
    requestChallenge.mutate({ challenge_type: challengeType });
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text className="mb-2 font-subtitle text-xl text-text-primary">Verify Your Identity</Text>
      <Text className="mb-6 font-body text-base text-text-secondary">
        Enter the 6-digit code sent to your {challengeType === 'otp_sms' ? 'phone' : 'email'}.
      </Text>

      {requestChallenge.isPending ? (
        <View className="items-center py-8">
          <ActivityIndicator color="#6B7280" />
          <Text className="mt-3 font-body text-sm text-text-secondary">Sending code…</Text>
        </View>
      ) : (
        <>
          <OTPInput ref={otpRef} onComplete={handleComplete} error={error} isInvalid={!!error} />

          <View className="mt-4 flex-row items-center justify-between">
            <Text className="font-caption text-sm text-text-secondary">
              {secondsLeft > 0 ? `Expires in ${formatTime(secondsLeft)}` : 'Code expired'}
            </Text>
            <Button
              title="Resend"
              variant="ghost"
              onPress={handleResend}
              disabled={requestChallenge.isPending || secondsLeft > 270}
            />
          </View>

          {verifyChallenge.isPending && (
            <View className="mt-4 items-center">
              <ActivityIndicator color="#6B7280" />
            </View>
          )}
        </>
      )}
    </BottomSheet>
  );
}
