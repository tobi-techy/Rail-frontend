import React, { useLayoutEffect, useRef, useEffect } from 'react';
import { Animated, Dimensions, Platform, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { useNavigation } from 'expo-router';

import { RailCard } from '../cards';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CardIntroScreenProps {
  onCreateCard: () => void;
}

const FEATURES = [
  'Instant virtual card issuance',
  'Works with Apple Pay & Google Pay',
  'No hidden fees or charges',
  'Freeze & unfreeze anytime',
];

const CardIntroScreen = ({ onCreateCard }: CardIntroScreenProps) => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, cardScale]);

  const cardWidth = Math.min(SCREEN_WIDTH * 0.7, 300);

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]" edges={['top']}>
      {/* Header */}
      <View className="px-6 pt-2">
        <Text className="font-headline text-headline-1 text-gray-900">Free Debit Card</Text>
        <Text className="mt-1 font-body text-body text-gray-500">Spend anywhere, instantly</Text>
      </View>

      {/* Card Hero */}
      <Animated.View
        className="mt-6 items-center justify-center"
        style={{
          height: cardWidth * 0.85,
          transform: [{ scale: cardScale }],
        }}>
        {/* Back card (white/light, slightly rotated left) */}
        <View
          className="absolute"
          style={{
            transform: [{ rotate: '-6deg' }, { translateX: -20 }],
            opacity: 0.6,
          }}>
          <RailCard
            brand="VISA"
            holderName="YOUR NAME"
            last4="••••"
            exp="••/••"
            currency="USD"
            accentColor="#E5E7EB"
            patternIntensity={0.08}
            width={cardWidth * 0.88}
            style={{
              backgroundColor: '#F9FAFB',
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
            }}
          />
        </View>

        {/* Front card (black, slightly rotated right) */}
        <View
          style={{
            transform: [{ rotate: '4deg' }, { translateX: 16 }],
            shadowColor: '#000',
            shadowOpacity: Platform.OS === 'ios' ? 0.2 : 0,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 16 },
            elevation: Platform.OS === 'android' ? 10 : 0,
          }}>
          <RailCard
            brand="VISA"
            holderName="YOUR NAME"
            last4="2049"
            exp="09/29"
            currency="USD"
            accentColor="#FF6A00"
            patternIntensity={0.35}
            width={cardWidth}
          />
        </View>
      </Animated.View>

      {/* Bottom Sheet */}
      <Animated.View
        className="mt-auto rounded-t-[28px] bg-white px-6 pb-10 pt-7"
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
          elevation: 8,
        }}>
        {/* Drag indicator */}
        <View className="absolute left-0 right-0 top-3 items-center">
          <View className="h-1 w-9 rounded-full bg-gray-200" />
        </View>

        <Text className="font-headline text-headline-2 text-gray-900">Rail Card</Text>
        <Text className="mt-1.5 font-body text-body leading-relaxed text-gray-500">
          Get instant access to your money with a free virtual debit card
        </Text>

        {/* Feature list */}
        <View className="mt-5 gap-y-3.5">
          {FEATURES.map((feature) => (
            <View key={feature} className="flex-row items-center">
              <View className="mr-3 h-6 w-6 items-center justify-center rounded-full bg-emerald-50">
                <Check size={14} color="#10B981" strokeWidth={3} />
              </View>
              <Text className="flex-1 font-body text-[15px] text-gray-800">{feature}</Text>
            </View>
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          onPress={onCreateCard}
          activeOpacity={0.85}
          className="mt-7 h-[54px] items-center justify-center rounded-full bg-black">
          <Text className="font-button text-[17px] text-white">Get Free Card</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

export default CardIntroScreen;
export { CardIntroScreen };
