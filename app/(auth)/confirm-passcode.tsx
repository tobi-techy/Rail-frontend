import React, { useState } from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PasscodeInput } from '@/components/molecules/PasscodeInput';
import { AuthGradient } from '@/components';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores/authStore';

export default function ConfirmPasscodeScreen() {
  const originalPasscode = useAuthStore((s) => s._pendingPasscode);
  const setPasscode = useAuthStore((s) => s.setPasscode);
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasscodeComplete = async (code: string) => {
    if (isLoading) return;

    if (!originalPasscode) {
      router.replace(ROUTES.AUTH.CREATE_PASSCODE as never);
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
      useAuthStore.setState({ _pendingPasscode: null });
      router.replace(ROUTES.TABS as never);
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
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent={Platform.OS === 'android'}
        />
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
