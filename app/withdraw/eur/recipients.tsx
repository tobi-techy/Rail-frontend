import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StatusBar, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import {
  Search01Icon,
  Add01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  IconComponent as HugeiconsIcon,
} from '@/lib/icons';
import { useHaptics } from '@/hooks/useHaptics';
import { useFiatRecipients } from '@/hooks/useFiatRecipients';
import { ScreenHeader, RecipientRow } from '@/components/withdraw/shared';
import { formatCurrency } from '@/components/withdraw/method-screen/utils';

export default function EurRecipientsScreen() {
  const { selection } = useHaptics();
  const params = useLocalSearchParams<{ amount: string; currency: string }>();
  const numericAmount = parseFloat(params.amount ?? '0') || 0;
  const { recipients } = useFiatRecipients('EUR');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return recipients;
    const q = searchQuery.toLowerCase();
    return recipients.filter(
      (r) => r.accountHolderName.toLowerCase().includes(q) || r.routingNumber.includes(q)
    );
  }, [recipients, searchQuery]);

  const handleSelect = (r: (typeof recipients)[number]) => {
    selection();
    router.push({
      pathname: '/withdraw/eur/confirm' as never,
      params: {
        amount: params.amount,
        currency: 'EUR',
        accountHolderName: r.accountHolderName,
        iban: r.routingNumber,
        bic: r.accountNumber,
      },
    } as never);
  };

  return (
    <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <ScreenHeader />

      <ScrollView
        className="flex-1 px-5"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(250)}>
          <Text className="font-subtitle text-[28px] text-text-primary" maxFontSizeMultiplier={1.3}>
            Send EUR
          </Text>
          <Text
            className="mt-1 font-body text-[14px] text-text-secondary"
            maxFontSizeMultiplier={1.4}>
            Send €{formatCurrency(numericAmount)} to a recent or new recipient
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(60).duration(250)} className="mt-6">
          <View
            className="flex-row items-center gap-3 rounded-2xl bg-[#f7f2e8] px-4"
            style={{ height: 52 }}>
            <HugeiconsIcon icon={Search01Icon} size={18} color="#848281" />
            <TextInput
              className="flex-1 font-body text-[15px] text-text-primary"
              placeholder="Search by name"
              placeholderTextColor="#848281"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <HugeiconsIcon icon={Cancel01Icon} size={15} color="#848281" />
              </Pressable>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).duration(250)} className="mt-5">
          <Pressable
            className="flex-row items-center justify-between rounded-2xl bg-[#f8f7f4] px-4 py-4"
            onPress={() => {
              router.push({
                pathname: '/withdraw/eur/new-recipient' as never,
                params: { amount: params.amount, currency: 'EUR' },
              } as never);
            }}>
            <View className="flex-row items-center gap-3">
              <View className="size-11 items-center justify-center rounded-full bg-[#0090ff]">
                <HugeiconsIcon icon={Add01Icon} size={20} color="#fff" />
              </View>
              <Text
                className="font-subtitle text-[15px] text-text-primary"
                maxFontSizeMultiplier={1.3}>
                New recipient
              </Text>
            </View>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#848281" />
          </Pressable>
        </Animated.View>

        <View className="my-5 h-px bg-stone-surface" />

        <Animated.View entering={FadeInUp.delay(140).duration(250)}>
          <Text
            className="mb-3 font-subtitle text-[15px] text-text-primary"
            maxFontSizeMultiplier={1.3}>
            Recent Recipients
          </Text>
          {filtered.length === 0 ? (
            <Text
              className="py-6 text-center font-body text-[14px] text-text-secondary"
              maxFontSizeMultiplier={1.4}>
              {searchQuery ? 'No matching recipients' : 'No recent recipients yet'}
            </Text>
          ) : (
            filtered.map((r, i) => (
              <RecipientRow
                key={r.id}
                name={r.accountHolderName}
                subtitle={`${r.routingNumber.slice(0, 4)}••••${r.routingNumber.slice(-4)}`}
                index={i}
                onPress={() => handleSelect(r)}
              />
            ))
          )}
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
