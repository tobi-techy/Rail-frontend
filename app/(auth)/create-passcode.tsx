import React, { useState } from 'react';
import { View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PasscodeInput } from '@/components/molecules/PasscodeInput';

export default function CreatePasscodeScreen() {
  const [passcode, setPasscode] = useState('');

  const handlePasscodeComplete = (code: string) => {
    setPasscode(code);
  };

  const handleContinue = (code: string) => {
    // Navigate to confirm passcode screen with the passcode
    router.push({
      pathname: '/(auth)/confirm-passcode',
      params: { passcode: code },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      <PasscodeInput
        title="Create passcode"
        subtitle="Choose a 4-digit passcode to secure your account"
        length={4}
        value={passcode}
        onValueChange={setPasscode}
        onComplete={handlePasscodeComplete}
        onContinue={handleContinue}
        continueLabel="Continue"
      />
    </SafeAreaView>
  );
}
