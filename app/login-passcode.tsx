import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { Icon } from '@/components/atoms/Icon';
import { Fingerprint,  Trash } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { useVerifyPasscode } from '@/api/hooks';
import { SessionManager } from '@/utils/sessionManager';

const BACKSPACE_KEY = 'backspace';
const FINGERPRINT_KEY = 'fingerprint';

const KEYPAD_LAYOUT = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [FINGERPRINT_KEY, '0', BACKSPACE_KEY],
] as const;

type KeypadKey = (typeof KEYPAD_LAYOUT)[number][number] | string;

export default function LoginPasscodeScreen() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userName = user?.fullName || user?.email?.split('@')[0] || 'User';
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState('');
  
  const { mutate: verifyPasscode, isPending: isLoading } = useVerifyPasscode();
  
  // If no user data stored, redirect to sign in
  React.useEffect(() => {
    if (!user) {
      router.replace('/(auth)/signin');
    }
  }, [user]);

  const handleKeypadPress = useCallback(
    (key: KeypadKey) => {
      if (isLoading) return;

      if (error) {
        setError('');
      }

      if (key === BACKSPACE_KEY) {
        if (passcode.length > 0) {
          setPasscode(passcode.slice(0, -1));
        }
      } else if (key === FINGERPRINT_KEY) {
        // TODO: Implement biometric authentication
        handleBiometricAuth();
      } else if (key.match(/^[0-9]$/)) {
        if (passcode.length < 4) {
          const newPasscode = passcode + key;
          setPasscode(newPasscode);

          // Auto-submit when 4 digits are entered
          if (newPasscode.length === 4) {
            handlePasscodeSubmit(newPasscode);
          }
        }
      }
    },
    [passcode, isLoading, error]
  );

  const handleBiometricAuth = async () => {
    try {
      // Check if biometric authentication is available
      const isBiometricAvailable = await LocalAuthentication.hasHardwareAsync();
      const isBiometricEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!isBiometricAvailable || !isBiometricEnrolled) {
        setError('Biometric authentication not available or not enrolled');
        return;
      }

      // Authenticate using biometrics
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your account',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Biometric success - simulate passcode verification (since biometric replaces passcode)
        // In a real app, you might have a separate flow or verify with backend
        handlePasscodeSubmit('biometric');
      } else {
        setError('Biometric authentication failed');
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      setError('Biometric authentication failed');
    }
  };

  const handlePasscodeSubmit = (code: string) => {
    if (!code || code.length !== 4) {
      setError('Please enter a valid 4-digit PIN');
      setPasscode('');
      return;
    }

    setError('');
    
    verifyPasscode(
      { passcode: code },
      {
        onSuccess: async (response) => {
          try {
            console.log('[LoginPasscode] Passcode verified successfully');
            
            if (!response.verified) {
              setError('Passcode verification failed');
              setPasscode('');
              return;
            }
            
            // Schedule passcode session expiry monitoring
            if (response.passcodeSessionExpiresAt) {
              SessionManager.schedulePasscodeSessionExpiry(response.passcodeSessionExpiresAt);
            }
            
            // Wait for state to be fully persisted before navigation
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Verify token is set before navigating
            const token = useAuthStore.getState().accessToken;
            if (!token) {
              console.warn('[LoginPasscode] Access token not found after verification');
              setError('Authentication failed. Please try again.');
              setPasscode('');
              return;
            }
            
            // Navigate to main app
            router.replace('/(tabs)');
          } catch (error: any) {
            console.error('[LoginPasscode] Error during success handling:', error);
            setError('An error occurred. Please try again.');
            setPasscode('');
          }
        },
        onError: (err: any) => {
          const errorMessage = err?.error?.message || err?.message || 'Incorrect PIN. Please try again.';
          setError(errorMessage);
          setPasscode('');
        },
      }
    );
  };

  const handleSwitchAccount = () => {
    // Clear user data and navigate to sign in
    useAuthStore.getState().reset();
    router.replace('/(auth)/signin');
  };
  
  const handleSignInWithEmail = () => {
    // Navigate to email/password sign in
    router.push('/(auth)/signin');
  };

  const handleNeedHelp = () => {
    // Navigate to help or support
    router.push('/(auth)/forgot-password');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <View className="flex-1 px-6">
        {/* Header with Need Help button */}
        <View className="mt-2 flex-row items-center justify-end">
          <TouchableOpacity
            onPress={handleNeedHelp}
            className="flex-row items-center gap-x-2 rounded-full bg-[#EEF2FF] px-4 py-2.5"
            activeOpacity={0.7}
          >
            <Icon
              name="message-circle"
              size={18}
              color="#6366F1"
              strokeWidth={2}
            />
            <Text className="font-body-medium text-[14px] text-[#6366F1]">
              Need help?
            </Text>
          </TouchableOpacity>
        </View>

        {/* Welcome Text */}
        <View className="mt-8">
          <Text className="font-body-bold text-[24px] leading-[38px] text-[#070914]">
            Welcome Back,
          </Text>
          <Text className="font-body-bold text-[32px] leading-[38px] text-[#070914]">
            {userName}
          </Text>
        </View>

        {/* PIN Input Section */}
        <View className="mt-12">
          <Text className="font-body-medium text-[16px] text-[#6B7280]">
            Enter your account PIN to log in
          </Text>

          {/* PIN Dots with Eye Icon */}
          <View className="mt-6 flex-row items-center justify-between">
            <View className="flex-row gap-x-3">
              {Array.from({ length: 4 }).map((_, index) => {
                const isFilled = index < passcode.length;
                return (
                  <View
                    key={index}
                    className="h-14 w-14 items-center justify-center rounded-full bg-[#F3F4F6]"
                  >
                    {isFilled && (
                      showPasscode ? (
                        <Text className="font-body-bold text-[20px] text-[#070914]">
                          {passcode[index]}
                        </Text>
                      ) : (
                        <View className="h-3 w-3 rounded-full bg-[#070914]" />
                      )
                    )}
                  </View>
                );
              })}
            </View>

            {/* Show/Hide PIN Toggle */}
            <TouchableOpacity
              onPress={() => setShowPasscode(!showPasscode)}
              className="h-12 w-12 items-center justify-center rounded-full bg-[#EFF6FF]"
              activeOpacity={0.7}
            >
              <Icon
                name={showPasscode ? 'eye-off' : 'eye'}
                size={22}
                color="#3B82F6"
                strokeWidth={2}
              />
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {error && (
            <View className="mt-4 flex-row items-center gap-x-2">
              <Icon
                name="alert-circle"
                size={16}
                color="#EF4444"
                strokeWidth={2}
              />
              <Text className="font-body-medium text-[14px] text-[#EF4444]">
                {error}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-1" />

        {/* Keypad */}
        <View className="mb-6">
          {KEYPAD_LAYOUT.map((row, rowIndex) => (
            <View
              key={`row-${rowIndex}`}
              className={`flex-row justify-between ${rowIndex === 0 ? '' : 'mt-3'}`}
            >
              {row.map((key, keyIndex) => {
                const isBackspace = key === BACKSPACE_KEY;
                const isFingerprint = key === FINGERPRINT_KEY;

                return (
                  <TouchableOpacity
                    key={key.toString()}
                    className="h-[72px] flex-1 mx-1.5 items-center justify-center rounded-full active:bg-[#E5E7EB]"
                    activeOpacity={0.7}
                    onPress={() => handleKeypadPress(key)}
                    disabled={isLoading}
                  >
                    {isBackspace ? (
                      <Trash
                        size={24}
                        color="#070914"
                      />  
                    ) : isFingerprint ? (
                    <Fingerprint size={24} color="#070914" />
                    ) : (
                      <Text className="font-body-semibold text-[24px] text-[#070914]">
                        {key}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View className="mb-4 items-center gap-y-3">
          <View className="flex-row items-center gap-x-1">
            <Text className="font-body-medium text-[14px] text-[#6B7280]">
              Not {userName}?{' '}
            </Text>
            <TouchableOpacity onPress={handleSwitchAccount} activeOpacity={0.7}>
              <Text className="font-body-semibold text-[14px] text-[#3B82F6]">
                Switch Account
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity onPress={handleSignInWithEmail} activeOpacity={0.7}>
            <Text className="font-body-medium text-[14px] text-[#6B7280]">
              Sign in with email
            </Text>
          </TouchableOpacity>

          <Text className="font-body text-[12px] text-[#9CA3AF]">
            v2.1.6
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

