import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { PasscodeInput } from '@/components/molecules/PasscodeInput';
import { AuthGradient } from '@/components';
import { ROUTES } from '@/constants/routes';

export default function ConfirmPasscodeScreen() {
  const { passcode: originalPasscode } = useLocalSearchParams<{ passcode: string }>();
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [error, setError] = useState('');

  const handlePasscodeComplete = (code: string) => {
    if (code !== originalPasscode) {
      setError('PINs do not match');
      setConfirmPasscode('');
      return;
    }
    router.push(ROUTES.AUTH.ONBOARDING.TRUST_DEVICE as any);
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1">
        <StatusBar barStyle="light-content" />
        <PasscodeInput
          title="Confirm your PIN"
          subtitle="Re-enter your PIN to confirm"
          length={4}
          value={confirmPasscode}
          onValueChange={(value) => {
            setConfirmPasscode(value);
            if (error) setError('');
          }}
          onComplete={handlePasscodeComplete}
          errorText={error}
          autoSubmit
          variant="dark"
        />
      </SafeAreaView>
    </AuthGradient>
  );
}
