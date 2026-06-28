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
import { usePajBanks, usePajSavedBanks } from '@/api/hooks/usePaj';
import type { PajBank, PajSavedBankAccount } from '@/api/types/paj';
import { useHaptics } from '@/hooks/useHaptics';
import { ScreenHeader, RecipientRow } from '@/components/withdraw/shared';
import { formatCurrency } from '@/components/withdraw/method-screen/utils';

export default function NgnRecipientsScreen() {
  const { selection } = useHaptics();
  const params = useLocalSearchParams<{ amount: string; currency: string }>();
  const numericAmount = parseFloat(params.amount ?? '0') || 0;

  const { data: pajBanksData } = usePajBanks();
  const { data: pajSavedBanks } = usePajSavedBanks();
  const pajBanks = useMemo<PajBank[]>(() => pajBanksData?.banks ?? [], [pajBanksData?.banks]);
  const savedBanksList: PajSavedBankAccount[] = (pajSavedBanks as any)?.accounts ?? [];

  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecipients = useMemo(() => {
    if (!searchQuery.trim()) return savedBanksList;
    const q = searchQuery.toLowerCase();
    return savedBanksList.filter(
      (s) => s.accountName.toLowerCase().includes(q) || s.bank.toLowerCase().includes(q)
    );
  }, [savedBanksList, searchQuery]);

  const handleSelectRecipient = (s: PajSavedBankAccount) => {
    selection();
    const bank = pajBanks.find((b) => b.name === s.bank || b.id === s.bank);
    router.push({
      pathname: '/withdraw/ngn/confirm' as never,
      params: {
        amount: params.amount,
        currency: params.currency ?? 'NGN',
        bankId: bank?.id ?? s.bank,
        bankName: bank?.name ?? s.bank,
        accountNumber: s.accountNumber,
        accountName: s.accountName,
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
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(250)}>
          <Text className="font-subtitle text-[28px] text-text-primary">Send to bank</Text>
          <Text className="mt-1 font-body text-[14px] text-text-secondary">
            Send ₦{formatCurrency(numericAmount)} to a recent or new recipient
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
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <HugeiconsIcon icon={Cancel01Icon} size={15} color="#848281" />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* New recipient */}
        <Animated.View entering={FadeInUp.delay(100).duration(250)} className="mt-5">
          <Pressable
            className="flex-row items-center justify-between rounded-2xl bg-[#f8f7f4] px-4 py-4"
            onPress={() => {
              router.push({
                pathname: '/withdraw/ngn/select-bank' as never,
                params: { amount: params.amount, currency: params.currency ?? 'NGN' },
              } as never);
            }}>
            <View className="flex-row items-center gap-3">
              <View className="size-11 items-center justify-center rounded-full bg-[#0090ff]">
                <HugeiconsIcon icon={Add01Icon} size={20} color="#fff" />
              </View>
              <Text className="font-subtitle text-[15px] text-text-primary">
                Send to a new recipient
              </Text>
            </View>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#848281" />
          </Pressable>
        </Animated.View>

        <View className="my-5 h-px bg-stone-surface" />

        {/* Saved recipients */}
        <Animated.View entering={FadeInUp.delay(140).duration(250)}>
          <Text className="mb-3 font-subtitle text-[15px] text-text-primary">
            Recent Recipients
          </Text>
          {filteredRecipients.length === 0 ? (
            <Text className="py-6 text-center font-body text-[14px] text-text-secondary">
              No saved recipients yet
            </Text>
          ) : (
            filteredRecipients.map((s, i) => {
              const bank = pajBanks.find((b) => b.name === s.bank || b.id === s.bank);
              return (
                <RecipientRow
                  key={s.id}
                  name={s.accountName}
                  subtitle={`${bank?.name ?? s.bank} · ••${s.accountNumber.slice(-4)}`}
                  index={i}
                  onPress={() => handleSelectRecipient(s)}
                />
              );
            })
          )}
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
