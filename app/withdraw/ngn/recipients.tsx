import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StatusBar, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import {
  Search01Icon,
  Add01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  IconComponent as HugeiconsIcon,
} from '@/lib/icons';
import { useRampBanks } from '@/api/hooks/useRamp';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import * as Haptics from '@/utils/platformHaptics';
import { ScreenHeader } from '@/components/withdraw/shared';

export default function NgnRecipientsScreen() {
  const { impact } = useHaptics();

  // Bank list preloaded so select-bank renders instantly
  useRampBanks();

  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <ScreenHeader />

      <ScrollView
        className="flex-1 px-5"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(250)}>
          <Text className="font-subtitle text-[28px] text-text-primary" maxFontSizeMultiplier={1.3}>
            Send to bank
          </Text>
          <Text
            className="mt-1 font-body text-[14px] text-text-secondary"
            maxFontSizeMultiplier={1.4}>
            Pick a saved recipient or send to a new bank account
          </Text>
        </Animated.View>

        {/* Search */}
        <Animated.View entering={FadeInUp.delay(60).duration(250)} className="mt-6">
          <View
            className="flex-row items-center gap-3 rounded-2xl bg-[#f7f2e8] px-4"
            style={{ height: 52 }}>
            <HugeiconsIcon icon={Search01Icon} size={18} color="#848281" />
            <TextInput
              className="flex-1 font-body text-[15px] text-text-primary"
              placeholder="Search by account name"
              placeholderTextColor="#848281"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => {
                  impact(Haptics.ImpactFeedbackStyle.Light);
                  playUISound('buttonClick');
                  setSearchQuery('');
                }}
                hitSlop={8}>
                <HugeiconsIcon icon={Cancel01Icon} size={15} color="#848281" />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* New recipient */}
        <Animated.View entering={FadeInUp.delay(100).duration(250)} className="mt-5">
          <Pressable
            className="flex-row items-center justify-between rounded-2xl bg-[#f8f7f4] px-4 py-4 active:scale-[0.98]"
            onPress={() => {
              impact(Haptics.ImpactFeedbackStyle.Medium);
              playUISound('buttonClick');
              router.push({
                pathname: '/withdraw/ngn/select-bank' as never,
              } as never);
            }}>
            <View className="flex-row items-center gap-3">
              <View className="size-11 items-center justify-center rounded-full bg-[#0090ff]">
                <HugeiconsIcon icon={Add01Icon} size={20} color="#fff" />
              </View>
              <Text
                className="font-subtitle text-[15px] text-text-primary"
                maxFontSizeMultiplier={1.3}>
                Send to a new recipient
              </Text>
            </View>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#848281" />
          </Pressable>
        </Animated.View>

        <View className="my-5 h-px bg-stone-surface" />

        {/* Saved recipients — not available with RampHub */}
        <Animated.View entering={FadeInUp.delay(140).duration(250)}>
          <Text
            className="mb-3 font-subtitle text-[15px] text-text-primary"
            maxFontSizeMultiplier={1.3}>
            Recent Recipients
          </Text>
          <Text
            className="py-6 text-center font-body text-[14px] text-text-secondary"
            maxFontSizeMultiplier={1.4}>
            No saved recipients yet
          </Text>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
