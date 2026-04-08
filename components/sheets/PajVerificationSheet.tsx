import React, { useState, useCallback } from 'react';
import { View, Text, Keyboard } from 'react-native';
import { GorhomBottomSheet } from './GorhomBottomSheet';
import { OTPInput, Button } from '@/components/ui';
import { usePajInitiate, usePajVerify } from '@/api/hooks';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import * as Haptics from 'expo-haptics';

interface PajVerificationSheetProps {
  visible: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export function PajVerificationSheet({ visible, onClose, onVerified }: PajVerificationSheetProps) {
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'initiate' | 'verify'>('initiate');
  const [maskedEmail, setMaskedEmail] = useState('');
  const { showError } = useFeedbackPopup();

  const initiate = usePajInitiate();
  const verify = usePajVerify();

  const handleInitiate = useCallback(async () => {
    try {
      const res = await initiate.mutateAsync();
      if (res.status === 'already_verified') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onVerified();
        return;
      }
      setMaskedEmail(res.email || '');
      setStep('verify');
    } catch {
      showError('Failed to send verification code. Please try again.');
    }
  }, [initiate, onVerified, showError]);

  const handleVerify = useCallback(
    async (code: string) => {
      Keyboard.dismiss();
      try {
        await verify.mutateAsync(code);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onVerified();
      } catch {
        setOtp('');
        showError('Invalid or expired code. Please try again.');
      }
    },
    [verify, onVerified, showError]
  );

  const handleOTPComplete = useCallback(
    (code: string) => {
      setOtp(code);
      if (code.length === 6) {
        handleVerify(code);
      }
    },
    [handleVerify]
  );

  const handleClose = useCallback(() => {
    setOtp('');
    setStep('initiate');
    onClose();
  }, [onClose]);

  return (
    <GorhomBottomSheet visible={visible} onClose={handleClose}>
      {step === 'initiate' ? (
        <View className="pb-4">
          <Text className="mb-2 font-subtitle text-xl text-text-primary">
            Enable NGN transactions
          </Text>
          <Text className="mb-6 font-body text-[14px] leading-5 text-text-secondary">
            To fund or withdraw Naira, we need to verify your identity with our payment partner.
            You{"'"}ll receive a one-time verification code.
          </Text>

          <Button
            title="Send verification code"
            variant="black"
            loading={initiate.isPending}
            onPress={handleInitiate}
          />

          <Text className="mt-4 text-center font-body text-[11px] text-[#9CA3AF]">
            Powered by Paj Cash
          </Text>
        </View>
      ) : (
        <View className="pb-4">
          <Text className="mb-2 font-subtitle text-xl text-text-primary">
            Enter verification code
          </Text>
          <Text className="mb-6 font-body text-[14px] leading-5 text-text-secondary">
            We sent a 6-digit code to {maskedEmail || 'your email'}
          </Text>

          <OTPInput
            length={6}
            value={otp}
            onChange={handleOTPComplete}
            disabled={verify.isPending}
          />

          <View className="mt-6">
            <Button
              title="Verify"
              variant="black"
              loading={verify.isPending}
              disabled={otp.length < 6}
              onPress={() => handleVerify(otp)}
            />
          </View>

          <Text className="mt-4 text-center font-body text-[11px] text-[#9CA3AF]">
            Powered by Paj Cash
          </Text>
        </View>
      )}
    </GorhomBottomSheet>
  );
}
