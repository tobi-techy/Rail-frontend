import React, { useState } from 'react';
import { Dimensions, Platform, Text, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import { Button } from '../ui/Button';
import { GorhomBottomSheet } from '../sheets/GorhomBottomSheet';
import {
  ArrowLeft01Icon,
  ZapIcon,
  Wallet01Icon,
  ChartUpIcon,
  SnowIcon,
  FingerPrintIcon,
  Tag01Icon,
} from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import { ImpactFeedbackStyle } from '@/utils/platformHaptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CardIntroScreenProps {
  onCreateCard: () => void;
  loading?: boolean;
}

function SignatureSvg({ color = '#fff', size = 80 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size * 0.6} viewBox="0 0 100 60" fill="none">
      <Path
        d="M10 45 Q20 20 35 35 Q50 50 55 30 Q60 10 70 25 Q80 40 90 20"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

function ChipSvg() {
  return (
    <View className="h-8 w-10 rounded-md bg-amber-100">
      <View className="absolute inset-0.5 rounded border border-amber-200/60" />
      <View className="absolute left-1/2 top-0 h-full w-px -translate-x-0.5 bg-amber-200/60" />
      <View className="absolute left-0 top-1/2 h-px w-full -translate-y-0.5 bg-amber-200/60" />
    </View>
  );
}

function CardStack() {
  const cardWidth = Math.min(SCREEN_WIDTH * 0.7, 280);
  const cardHeight = cardWidth * 1.58;

  return (
    <View className="items-center justify-center" style={{ height: cardHeight + 40 }}>
      {/* Back card (white) */}
      <View
        className="absolute rounded-2xl bg-stone-surface"
        style={{
          width: cardWidth,
          height: cardHeight,
          transform: [{ rotate: '-8deg' }, { translateX: -30 }, { translateY: -10 }],
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 8 },
            },
            android: { elevation: 4 },
          }),
        }}>
        <View className="absolute left-5 top-8">
          <Text
            className="font-subtitle text-sm text-smoke"
            style={{ transform: [{ rotate: '-90deg' }, { translateX: -30 }, { translateY: -20 }] }}>
            $yourname
          </Text>
        </View>
      </View>

      {/* Front card (black) */}
      <View
        className="rounded-2xl bg-black"
        style={{
          width: cardWidth,
          height: cardHeight,
          transform: [{ rotate: '4deg' }, { translateX: 20 }],
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOpacity: 0.25,
              shadowRadius: 30,
              shadowOffset: { width: 0, height: 15 },
            },
            android: { elevation: 12 },
          }),
        }}>
        {/* Username */}
        <View className="absolute left-5 top-8">
          <Text
            className="font-subtitle text-sm text-white"
            style={{ transform: [{ rotate: '-90deg' }, { translateX: -30 }, { translateY: -20 }] }}>
            $railuser
          </Text>
        </View>

        {/* Signature */}
        <View className="absolute bottom-24 right-6">
          <SignatureSvg color="#fff" size={100} />
        </View>

        {/* Chip */}
        <View className="absolute bottom-8 left-6">
          <ChipSvg />
        </View>
      </View>
    </View>
  );
}

export function CardIntroScreen({ onCreateCard, loading }: CardIntroScreenProps) {
  const [showLearnMore, setShowLearnMore] = useState(false);
  const { impact } = useHaptics();

  return (
    <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 pt-2">
        <Pressable
          onPress={() => {
            impact(ImpactFeedbackStyle.Light);
            playUISound('dismiss');
            router.back();
          }}
          className="size-11 items-center justify-center"
          hitSlop={8}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#343433" />
        </Pressable>
        <View className="px-5 pt-1">
          <Text className="font-headline text-3xl text-charcoal-primary">Free Debit Card</Text>
          <Text className="mt-1 font-body text-base text-smoke">With Instant Discounts</Text>
        </View>
      </View>

      {/* Card Stack */}
      <View className="flex-1 items-center justify-center">
        <CardStack />
      </View>

      {/* Bottom Buttons */}
      <View className="flex-row gap-3 px-5 pb-6">
        <Button
          title="Learn More"
          variant="white"
          size="large"
          flex
          onPress={() => setShowLearnMore(true)}
        />
        <Button
          title="Get Card"
          variant="black"
          size="large"
          flex
          loading={loading}
          onPress={onCreateCard}
        />
      </View>

      <GorhomBottomSheet
        visible={showLearnMore}
        onClose={() => setShowLearnMore(false)}
        showCloseButton>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Header */}
          <View className="mb-6">
            <Text className="font-headline text-[26px] leading-[32px] text-charcoal-primary">
              Rail Debit Card
            </Text>
            <Text className="mt-1.5 font-body text-sm text-smoke">
              A free virtual Visa linked to your spend balance.
            </Text>
          </View>

          {/* Feature rows */}
          {[
            {
              icon: ZapIcon,
              bg: '#FFF3E0',
              color: '#F57C00',
              title: 'Instant Issuance',
              body: 'Ready to use the moment you create it — no waiting, no shipping.',
            },
            {
              icon: Wallet01Icon,
              bg: '#E8F5E9',
              color: '#2E7D32',
              title: 'Spend Your Balance',
              body: 'Every purchase draws from your 70% spend allocation.',
            },
            {
              icon: ChartUpIcon,
              bg: '#EDE7F6',
              color: '#6A1B9A',
              title: 'Round-Up Investing',
              body: 'Spare change from every transaction auto-invests into your stash.',
            },
            {
              icon: SnowIcon,
              bg: '#E3F2FD',
              color: '#1565C0',
              title: 'Freeze Anytime',
              body: 'Freeze or unfreeze your card instantly from settings.',
            },
            {
              icon: FingerPrintIcon,
              bg: '#FCE4EC',
              color: '#C62828',
              title: 'Biometric Security',
              body: 'Card numbers revealed only after Face ID or Touch ID.',
            },
            {
              icon: Tag01Icon,
              bg: '#f7f2e8',
              color: '#474645',
              title: 'Zero Fees',
              body: 'No annual fee, no issuance fee. Completely free.',
            },
          ].map((item, i, arr) => (
            <View
              key={item.title}
              className={`flex-row gap-4 py-4 ${i < arr.length - 1 ? 'border-b border-stone-surface' : ''}`}>
              <View
                className="mt-0.5 h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: item.bg }}>
                <HugeiconsIcon icon={item.icon} size={20} color={item.color} strokeWidth={1.5} />
              </View>
              <View className="flex-1">
                <Text className="font-button text-[15px] text-charcoal-primary">{item.title}</Text>
                <Text className="mt-0.5 font-body text-[13px] leading-5 text-smoke">
                  {item.body}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </GorhomBottomSheet>
    </SafeAreaView>
  );
}
