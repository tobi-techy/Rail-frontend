import React, { useState, useMemo, useCallback } from 'react';
import { StatusBar, ActivityIndicator, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CardMainScreen } from '@/components/card/CardMainScreen';
import { CardIntroScreen } from '@/components/card/CardIntroScreen';
import { useCards, useCreateCard } from '@/api/hooks/useCard';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';

export default function CardScreen() {
  const { data: cardsData, isLoading } = useCards();
  const createCard = useCreateCard();
  const { showError } = useFeedbackPopup();
  const [isCreating, setIsCreating] = useState(false);

  const hasCard = useMemo(
    () => cardsData?.cards?.some((c) => c.status === 'active' || c.status === 'frozen') ?? false,
    [cardsData]
  );

  const handleCreateCard = useCallback(async () => {
    setIsCreating(true);
    try {
      await createCard.mutateAsync({ type: 'virtual' });
      // Don't reset isCreating on success — the query invalidation will
      // update cardsData and hasCard will become true, switching to CardMainScreen.
    } catch (err: any) {
      setIsCreating(false);
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
      <SafeAreaView className="flex-1 items-center justify-center bg-white" edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <ActivityIndicator size="small" color="#000" />
      </SafeAreaView>
    );
  }

  if (!hasCard) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        {isCreating ? (
          <View className="flex-1 items-center justify-center gap-3">
            <ActivityIndicator size="large" color="#000" />
            <Text className="font-body text-base text-gray-500">Creating your card…</Text>
          </View>
        ) : (
          <CardIntroScreen onCreateCard={handleCreateCard} />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <CardMainScreen />
    </SafeAreaView>
  );
}
