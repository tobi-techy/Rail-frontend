import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Icon } from '@/components/atoms/Icon';
import { ArrowLeft } from 'lucide-react-native';
import { useVerifyPasscode } from '@/api/hooks';

const BACKSPACE_KEY = 'backspace';

const KEYPAD_LAYOUT = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', BACKSPACE_KEY],
] as const;

type KeypadKey = (typeof KEYPAD_LAYOUT)[number][number] | string;

export default function AuthorizeTransactionScreen() {
  const params = useLocalSearchParams();
  const { transactionId, amount, type, recipient, description } = params;
  
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const PIN_LENGTH = 4;

  const verifyPasscodeMutation = useVerifyPasscode();

  const handleKeypadPress = useCallback(
    (key: KeypadKey) => {
      if (isLoading) return;

      if (key === BACKSPACE_KEY) {
        if (passcode.length > 0) {
          setPasscode(passcode.slice(0, -1));
        }
      } else if (key.match(/^[0-9]$/)) {
        if (passcode.length < PIN_LENGTH) {
          const newPasscode = passcode + key;
          setPasscode(newPasscode);

          // Auto-submit when PIN is complete
          if (newPasscode.length === PIN_LENGTH) {
            handlePasscodeSubmit(newPasscode);
          }
        }
      }
    },
    [passcode, isLoading]
  );

  const handlePasscodeSubmit = async (code: string) => {
    if (!code || code.length !== PIN_LENGTH) {
      setError('Please enter a valid PIN');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await verifyPasscodeMutation.mutateAsync({ passcode: code });

      if (result.verified) {
        console.log('Passcode verified, transaction authorized:', { transactionId, amount, type, recipient });
        // TODO: Call transaction authorization API here
        router.replace('/(tabs)' as any);
      } else {
        setError('Invalid passcode. Please try again.');
        setPasscode('');
      }
    } catch (error: any) {
      console.error('[AuthorizeTransaction] Passcode verification failed:', error);
      const errorMessage = error?.error?.message || error?.message || 'Failed to verify passcode. Please try again.';
      setError(errorMessage);
      setPasscode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleForgotPIN = () => {
    // TODO: Navigate to forgot PIN flow
    console.log('Forgot PIN pressed');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <View className="flex-1 px-6">
        {/* Back Button */}
        <View className="mt-2">
          <TouchableOpacity
            onPress={handleBack}
            className="h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F6]"
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#070914" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Title Section */}
        <View className="mt-12">
          <Text className="font-heading text-[36px] leading-[42px] text-[#070914]">
            Authorize{'\n'}transaction
          </Text>
        </View>

        {/* PIN Input Section */}
        <View className="mt-10">
          <Text className="font-body-medium text-[16px] leading-[22px] text-[#6B7280]">
            Enter your account PIN
          </Text>

          {/* PIN Display with Eye Icon */}
          <View className="mt-6 flex-row items-center justify-between">
            {/* PIN Boxes */}
            <View className="flex-row gap-x-2.5">
              {Array.from({ length: PIN_LENGTH }).map((_, index) => {
                const isFilled = index < passcode.length;
                return (
                  <View
                    key={index}
                    className="h-[56px] w-[56px] items-center justify-center rounded-2xl bg-[#F3F4F6]"
                  >
                    {isFilled && (
                      showPasscode ? (
                        <Text className="font-body-bold text-[24px] text-[#070914]">
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
        </View>

        <View className="flex-1" />

        {/* Keypad */}
        <View className="mb-4">
          {KEYPAD_LAYOUT.map((row, rowIndex) => (
            <View
              key={`row-${rowIndex}`}
              className={`flex-row justify-between ${rowIndex === 0 ? '' : 'mt-2'}`}
            >
              {row.map((key, keyIndex) => {
                const isBackspace = key === BACKSPACE_KEY;
                const isEmpty = key === '';

                if (isEmpty) {
                  return <View key={`empty-${keyIndex}`} className="h-[72px] flex-1 mx-1.5" />;
                }

                return (
                  <TouchableOpacity
                    key={key.toString()}
                    className="h-[72px] flex-1 mx-1.5 items-center justify-center rounded-full active:bg-[#F3F4F6]"
                    activeOpacity={0.7}
                    onPress={() => handleKeypadPress(key)}
                    disabled={isLoading}
                  >
                    {isBackspace ? (
                      <Icon
                        name="delete-back"
                        library="ionicons"
                        size={28}
                        color="#070914"
                      />
                    ) : (
                      <Text className="font-body-semibold text-[28px] leading-[32px] text-[#070914]">
                        {key}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Forgot PIN Link */}
        <View className="mb-8 items-center">
          <TouchableOpacity onPress={handleForgotPIN} activeOpacity={0.7}>
            <Text className="font-body-semibold text-[16px] text-[#3B82F6]">
              Forgot PIN?
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

