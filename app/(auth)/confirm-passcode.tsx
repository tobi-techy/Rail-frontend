import React, { useState, useCallback } from 'react';
import { View, StatusBar, AccessibilityInfo } from 'react-native';
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
      setError('');
      
      // Check if passcodes match
      if (code !== originalPasscode) {
        setError('Passcodes do not match');
        setConfirmPasscode('');
        
        // Announce error to screen readers
        AccessibilityInfo.isScreenReaderEnabled().then((screenReaderEnabled) => {
          if (screenReaderEnabled) {
            AccessibilityInfo.announceForAccessibility(
              'Passcodes do not match. Please try again.'
            );
          }
        });
        return;
      }

      // Passcodes match - create passcode via API
      createPasscode(
        { 
          passcode: code,
          confirmPasscode: originalPasscode // Both should match
        },
        {
          onSuccess: (response) => {
            // Passcode created successfully
            // Navigate to onboarding
            router.replace('/(auth)/onboarding/trust-device');
          },
          onError: (err: any) => {
            const errorCode = err?.error?.code;
            const errorMessage = err?.error?.message;
            
            let displayMessage = 'Failed to create passcode. Please try again.';
            
            switch (errorCode) {
              case 'PASSCODE_EXISTS':
                displayMessage = 'Passcode already exists. Use update endpoint instead.';
                break;
              case 'INVALID_PASSCODE_FORMAT':
                displayMessage = 'Passcode must be exactly 4 digits.';
                break;
              case 'PASSCODE_MISMATCH':
                displayMessage = 'Passcodes do not match.';
                break;
              case 'VALIDATION_ERROR':
                displayMessage = errorMessage || 'Invalid passcode format.';
                break;
              default:
                displayMessage = errorMessage || displayMessage;
            }
            
            setError(displayMessage);
            setConfirmPasscode('');
            
            // Announce error to screen readers
            AccessibilityInfo.isScreenReaderEnabled().then((screenReaderEnabled) => {
              if (screenReaderEnabled) {
                AccessibilityInfo.announceForAccessibility(displayMessage);
              }
            });
          },
        }
      );
    },
    [originalPasscode, createPasscode]
  );

  const handleContinue = useCallback(
    (code: string) => {
      handlePasscodeComplete(code);
    },
    [handlePasscodeComplete]
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      <PasscodeInput
        title="Confirm passcode"
        subtitle="Re-enter your passcode to confirm"
        length={4}
        value={confirmPasscode}
        onValueChange={(value) => {
          setConfirmPasscode(value);
          if (error) setError('');
        }}
        onComplete={handlePasscodeComplete}
        onContinue={handleContinue}
        errorText={error}
        continueLabel={isLoading ? 'Saving...' : 'Confirm'}
        continueDisabled={isLoading}
        autoSubmit={true}
      />
    </SafeAreaView>
  );
}
