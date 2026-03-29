import React, { useMemo, useCallback } from 'react';
import { StatusBar, ActivityIndicator, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CardMainScreen } from '@/components/card/CardMainScreen';
import { CardIntroScreen } from '@/components/card/CardIntroScreen';
import { useCards, useCreateCard } from '@/api/hooks/useCard';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';

export default function CardScreen() {
  const { data: cardsData, isLoading, isError, refetch } = useCards();
  const createCard = useCreateCard();
  const { showError } = useFeedbackPopup();

  const hasCard = useMemo(
    () => cardsData?.cards?.some((c) => c.status === 'active' || c.status === 'frozen') ?? false,
    [cardsData]
  );

  const handleCreateCard = useCallback(async () => {
    try {
      await createCard.mutateAsync({ type: 'virtual' });
    } catch (err: any) {
      const code = err?.code || err?.message || '';
      const msg =
        code === 'CARD_EXISTS' || err?.message === 'CARD_EXISTS'
          ? 'You already have an active card'
          : code === 'CUSTOMER_NOT_FOUND' || err?.message?.includes('onboarding')
            ? 'Complete onboarding before creating a card'
            : code === 'WALLET_NOT_FOUND' || err?.message?.includes('Wallet')
              ? 'Wallet required — please try again later'
              : err?.message || 'Failed to create card. Please try again.';
      showError('Card Error', msg);
    }
  }, [createCard, showError]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white" edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-white" edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <Text className="mb-4 font-body text-[15px] text-gray-500">Unable to load card</Text>
        <Pressable onPress={() => refetch()} className="rounded-full bg-black px-5 py-3">
          <Text className="font-subtitle text-white">Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!hasCard) {
    return (
      <View className="flex-1 bg-white" edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <CardIntroScreen onCreateCard={handleCreateCard} loading={createCard.isPending} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <CardMainScreen />
    </View>
  );
}
