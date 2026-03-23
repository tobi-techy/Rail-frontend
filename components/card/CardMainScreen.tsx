import React, { useLayoutEffect, useCallback, useMemo } from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { RailCard, RailCardReveal } from '../cards';
import { TransactionList } from '../molecules/TransactionList';
import { TransactionItemSkeleton, type Transaction } from '../molecules/TransactionItem';
import { useUIStore } from '@/stores';
import { useAuthStore } from '@/stores/authStore';
import { useCards, useCardTransactions, useUnfreezeCard } from '@/api/hooks/useCard';
import { queryKeys } from '@/api/queryClient';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import type { CardTransaction } from '@/api/types/card';
import { EyeIcon, Settings01Icon, SnowIcon, ViewOffIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

function mapCardTransaction(tx: CardTransaction): Transaction {
  const isCredit = tx.type === 'refund' || tx.type === 'reversal';
  const typeMap: Record<string, Transaction['type']> = {
    authorization: 'withdraw',
    capture: 'withdraw',
    refund: 'receive',
    reversal: 'receive',
  };
  const statusMap: Record<string, Transaction['status']> = {
    pending: 'pending',
    completed: 'completed',
    declined: 'failed',
    reversed: 'completed',
  };
  return {
    id: tx.id,
    type: typeMap[tx.type] ?? 'withdraw',
    title: tx.merchant_name ?? (isCredit ? 'Refund' : 'Card Payment'),
    subtitle: tx.merchant_category ?? tx.type,
    amount: isCredit ? Math.abs(parseFloat(tx.amount)) : -Math.abs(parseFloat(tx.amount)),
    currency: tx.currency?.toUpperCase() ?? 'USD',
    merchant: tx.merchant_name ?? undefined,
    status: statusMap[tx.status] ?? 'pending',
    createdAt: new Date(tx.created_at),
    icon: { type: 'icon' as const, iconName: 'credit-card', bgColor: '#F3F4F6' },
  };
}

function CircleAction({
  icon,
  label,
  onPress,
  index = 0,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  index?: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()} className="items-center">
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        activeOpacity={0.7}
        className="mb-2 h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        {icon}
      </TouchableOpacity>
      <Text className="font-body text-[12px] text-gray-500">{label}</Text>
    </Animated.View>
  );
}

const CardMainScreen = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { isBalanceVisible } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const { showError, showSuccess } = useFeedbackPopup();
  const unfreezeCard = useUnfreezeCard();

  const { data: cardsData, isLoading: cardsLoading, isRefetching: cardsRefetching } = useCards();
  const {
    data: txData,
    isLoading: txLoading,
    isRefetching: txRefetching,
  } = useCardTransactions({ limit: 50 });

  const activeCard = useMemo(
    () =>
      cardsData?.cards?.find((c) => c.status === 'active' || c.status === 'frozen') ??
      cardsData?.cards?.[0],
    [cardsData]
  );

  const isFrozen = activeCard?.status === 'frozen';

  const holderName = useMemo(() => {
    const full = [user?.firstName, user?.lastName].filter(Boolean).join(' ').toUpperCase();
    return full || 'CARDHOLDER';
  }, [user]);

  const transactions = useMemo(() => txData?.transactions?.map(mapCardTransaction) ?? [], [txData]);

  const isLoading = cardsLoading || txLoading;
  const isRefreshing = cardsRefetching || txRefetching;

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.card.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.spending.stash() });
  }, [queryClient]);

  const handleSettings = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/card/settings' as never);
  }, []);

  const handleUnfreeze = useCallback(async () => {
    if (!activeCard) return;
    try {
      await unfreezeCard.mutateAsync(activeCard.id);
      showSuccess('Card Unfrozen', 'Your card is now active');
    } catch {
      showError('Error', 'Failed to unfreeze card');
    }
  }, [activeCard, unfreezeCard, showSuccess, showError]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View className="px-5">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-2 pt-1">
            <Text className="font-headline text-headline-3 text-gray-900">Card</Text>
            <TouchableOpacity
              onPress={handleSettings}
              activeOpacity={0.7}
              className="h-9 w-9 items-center justify-center rounded-full bg-gray-100">
              <HugeiconsIcon icon={Settings01Icon} size={18} color="#374151" strokeWidth={1.8} />
            </TouchableOpacity>
          </View>

          {/* Card */}
          <View className="mt-5 items-center">
            <View
              style={{
                shadowColor: '#000',
                shadowOpacity: Platform.OS === 'ios' ? 0.18 : 0,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 12 },
                elevation: Platform.OS === 'android' ? 10 : 0,
                opacity: isFrozen ? 0.55 : 1,
              }}>
              <RailCardReveal
                cardId={activeCard?.id ?? ''}
                brand="VISA"
                holderName={holderName}
                last4={activeCard?.last_4 ?? '••••'}
                exp={activeCard?.expiry ?? '••/••'}
                currency="USD"
                accentColor={isFrozen ? '#6B7280' : '#FF6A00'}
                patternIntensity={0.35}
              />
            </View>
            {isFrozen && (
              <View className="absolute inset-0 items-center justify-center">
                <View className="rounded-full bg-blue-500/90 p-3">
                  <HugeiconsIcon icon={SnowIcon} size={32} color="#fff" />
                </View>
              </View>
            )}
          </View>

          {/* Frozen Banner */}
          {isFrozen && (
            <TouchableOpacity
              onPress={handleUnfreeze}
              activeOpacity={0.8}
              className="mt-4 flex-row items-center justify-between rounded-xl bg-blue-50 px-4 py-3">
              <View className="flex-row items-center">
                <HugeiconsIcon icon={SnowIcon} size={18} color="#3B82F6" />
                <Text className="ml-2 font-subtitle text-sm text-blue-700">Card is frozen</Text>
              </View>
              <Text className="font-subtitle text-sm text-blue-600">Tap to unfreeze</Text>
            </TouchableOpacity>
          )}

          {/* Action Buttons */}
          <View className="mt-6 flex-row justify-around">
            <CircleAction
              index={0}
              icon={
                isBalanceVisible ? (
                  <HugeiconsIcon icon={EyeIcon} size={22} color="#111" />
                ) : (
                  <HugeiconsIcon icon={ViewOffIcon} size={22} color="#111" />
                )
              }
              label="Hide"
              onPress={() => {}}
            />
            <CircleAction
              index={1}
              icon={<HugeiconsIcon icon={Settings01Icon} size={22} color="#111" />}
              label="Settings01Icon"
              onPress={handleSettings}
            />
          </View>

          {/* Transactions */}
          <View className="mt-7">
            <Text className="mb-3 font-headline text-headline-3 text-gray-900">Transactions</Text>
            {isLoading ? (
              <View>
                {Array.from({ length: 4 }).map((_, i) => (
                  <TransactionItemSkeleton key={i} />
                ))}
              </View>
            ) : transactions.length === 0 ? (
              <View className="items-center py-10">
                <Text className="font-body text-body text-gray-400">No transactions yet</Text>
                <Text className="mt-1 font-body text-caption text-gray-300">
                  Use your card to see activity here
                </Text>
              </View>
            ) : (
              <TransactionList transactions={transactions} scrollEnabled={false} />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CardMainScreen;
export { CardMainScreen };
