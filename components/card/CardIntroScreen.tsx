import React, { useLayoutEffect } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, ShieldCheck, Zap } from 'lucide-react-native';
import { useNavigation } from 'expo-router';

import { RailCard } from '../cards';

interface CardIntroScreenProps {
  onCreateCard: () => void;
}

const CardIntroScreen = ({ onCreateCard }: CardIntroScreenProps) => {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <Text className="pl-[14px] font-subtitle text-headline-1">Card</Text>,
      headerShown: true,
      headerStyle: {
        backgroundColor: '#fff',
        elevation: 0,
        shadowColor: 'transparent',
      },
      headerTitle: '',
    });
  }, [navigation]);

  return (
    <SafeAreaView className="min-h-screen flex-1 bg-transparent px-[14px]">
      {/* Content */}

      <View className="items-center">
        <View
          className="items-center"
          style={{
            shadowColor: '#000',
            shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0,
            shadowRadius: 22,
            shadowOffset: { width: 0, height: 14 },
            elevation: Platform.OS === 'android' ? 6 : 0,
          }}>
          <RailCard
            brand="VISA"
            holderName="TOBI ADE"
            last4="2049"
            exp="09/29"
            currency="USD"
            accentColor="#FF6A00"
            patternIntensity={0.45}
            orientation="horizontal"
          />
        </View>
      </View>

      <View className="mt-14">
        <Text className="leading- font-display text-display-lg text-gray-900">
          Virtual card, ready.
        </Text>
        <Text className="mt-2 font-body text-body text-gray-600">
          Create a virtual debit card in seconds. Use it online, in-app, or add it to your wallet.
        </Text>
      </View>

      {/* Features */}
      <View className="mt-7 gap-y-3">
        <View className="flex-row items-start rounded-2xl bg-gray-50 px-4 py-4">
          <View className="mr-3 mt-[1px] h-9 w-9 items-center justify-center rounded-full bg-white">
            <Zap size={16} color="#111827" />
          </View>
          <View className="flex-1">
            <Text className="font-button text-body text-gray-900">Instant issuance</Text>
            <Text className="mt-1 font-body text-[13px] leading-5 text-gray-600">
              Get a card number immediately. No waiting.
            </Text>
          </View>
        </View>

        <View className="flex-row items-start rounded-2xl bg-gray-50 px-4 py-4">
          <View className="mr-3 mt-[1px] h-9 w-9 items-center justify-center rounded-full bg-white">
            <ShieldCheck size={16} color="#111827" />
          </View>
          <View className="flex-1">
            <Text className="font-button text-body text-gray-900">Built-in security</Text>
            <Text className="mt-1 font-body text-[13px] leading-5 text-gray-600">
              Safer online payments with modern controls.
            </Text>
          </View>
        </View>

        <View className="flex-row items-start rounded-2xl bg-gray-50 px-4 py-4">
          <View className="mr-3 mt-[1px] h-9 w-9 items-center justify-center rounded-full bg-white">
            <Plus size={16} color="#111827" />
          </View>
          <View className="flex-1">
            <Text className="font-button text-body text-gray-900">Create more cards</Text>
            <Text className="mt-1 font-body text-[13px] leading-5 text-gray-600">
              Spin up a new virtual card whenever you need one.
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={onCreateCard}
        className="absolute bottom-[140px] right-4 h-14 w-14 items-center justify-center rounded-full bg-black">
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default CardIntroScreen;
export { CardIntroScreen };
