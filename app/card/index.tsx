import React, { useMemo, useCallback } from 'react';
import { StatusBar, ActivityIndicator, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CardMainScreen } from '@/components/card/CardMainScreen';
import { CardIntroScreen } from '@/components/card/CardIntroScreen';
import { useCards, useCreateCard } from '@/api/hooks/useCard';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { useButtonFeedback } from '@/hooks/useButtonFeedback';

export default function CardScreen() {
  const { data: cardsData, isLoading, isError, refetch } = useCards();
  const createCard = useCreateCard();
  const { showError } = useFeedbackPopup();
  const triggerFeedback = useButtonFeedback();

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
      <SafeAreaView className="flex-1 items-center justify-center bg-warm-canvas" edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <ActivityIndicator size="small" color="#000" />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-warm-canvas" edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <Text className="mb-4 font-body text-[15px] text-ash" maxFontSizeMultiplier={1.4}>
          Unable to load card
        </Text>
        <Pressable
          onPress={() => {
            triggerFeedback();
            refetch();
          }}
          className="rounded-full bg-black px-5 py-3">
          <Text className="font-subtitle text-white" maxFontSizeMultiplier={1.3}>
            Retry
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!hasCard) {
    return (
      <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <CardIntroScreen onCreateCard={handleCreateCard} loading={createCard.isPending} />
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-warm-canvas">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <CardMainScreen />
    </View>
  );
}
