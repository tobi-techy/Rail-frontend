import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { PasscodeInput } from '@/components/molecules/PasscodeInput';
import { AuthGradient } from '@/components';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores/authStore';

export default function ConfirmPasscodeScreen() {
  const { passcode: originalPasscode } = useLocalSearchParams<{ passcode: string }>();
  const setPasscode = useAuthStore((state) => state.setPasscode);
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasscodeComplete = async (code: string) => {
    if (isLoading) return;

    if (!originalPasscode) {
      router.replace(ROUTES.AUTH.CREATE_PASSCODE as any);
      return;
    }

    if (code !== originalPasscode) {
      setError('PINs do not match');
      setConfirmPasscode('');
      return;
    }

    setIsLoading(true);
    try {
      await setPasscode(code);
      router.replace(ROUTES.TABS as any);
    } catch (submitError: any) {
      setError(submitError?.message || 'Failed to create PIN');
      setConfirmPasscode('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1">
        <StatusBar barStyle="dark-content" />
        <PasscodeInput
          title="Confirm your PIN"
          subtitle={isLoading ? 'Saving your PIN...' : 'Re-enter your PIN to confirm'}
          length={4}
          value={confirmPasscode}
          onValueChange={(value) => {
            setConfirmPasscode(value);
            if (error) setError('');
          }}
          onComplete={handlePasscodeComplete}
          errorText={error}
          autoSubmit
        />
      </SafeAreaView>
    </AuthGradient>
  );
}
