import React, { useState, useCallback } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { PasscodeInput } from '@/components/molecules/PasscodeInput';
import { useCreatePasscode } from '@/api/hooks';

export default function ConfirmPasscodeScreen() {
  const { passcode: originalPasscode } = useLocalSearchParams<{ passcode: string }>();
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [error, setError] = useState('');
  
  const { mutate: createPasscode, isPending: isLoading } = useCreatePasscode();

  const handlePasscodeComplete = useCallback(
    (code: string) => {
      if (isLoading) return;
      setError('');
      
      if (code !== originalPasscode) {
        setError('PINs do not match');
        setConfirmPasscode('');
        return;
      }

      createPasscode(
        { passcode: code, confirmPasscode: originalPasscode },
        {
          onSuccess: () => {
            router.replace('/(tabs)');
          },
          onError: (err: any) => {
            const errorMessage = err?.error?.message || 'Failed to create PIN. Please try again.';
            setError(errorMessage);
            setConfirmPasscode('');
          },
        }
      );
    },
    [originalPasscode, createPasscode, isLoading]
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
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
      />
    </SafeAreaView>
  );
}
