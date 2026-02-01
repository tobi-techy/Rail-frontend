import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PasscodeInput } from '@/components/molecules/PasscodeInput';
import { AuthGradient } from '@/components';

export default function CreatePasscodeScreen() {
  const [passcode, setPasscode] = useState('');

  const handlePasscodeComplete = (code: string) => {
    router.push({
      pathname: '/(auth)/confirm-passcode',
      params: { passcode: code },
    });
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1">
        <StatusBar barStyle="light-content" />
        <PasscodeInput
          title="Create your PIN"
          subtitle="Choose a 4-digit PIN to secure your account"
          length={4}
          value={passcode}
          onValueChange={setPasscode}
          onComplete={handlePasscodeComplete}
          autoSubmit
          variant="dark"
        />
      </SafeAreaView>
    </AuthGradient>
  );
}
