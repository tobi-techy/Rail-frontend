import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { CardIntroScreen, CardMainScreen } from '../../components/card';

const HAS_CARD_KEY = 'has_created_card';

const CardScreen = () => {
  const [hasCard, setHasCard] = useState<boolean | null>(null);

  useEffect(() => {
    checkCardStatus();
  }, []);

  const checkCardStatus = async () => {
    try {
      const hasCreatedCard = await AsyncStorage.getItem(HAS_CARD_KEY);
      setHasCard(hasCreatedCard === 'true');
    } catch (error) {
      console.error('Error checking card status:', error);
      setHasCard(false);
    }
  };

  const handleCreateCard = async () => {
    try {
      await AsyncStorage.setItem(HAS_CARD_KEY, 'false');
      setHasCard(true);
    } catch (error) {
      console.error('Error saving card status:', error);
      setHasCard(true);
    }
  };

  // Loading state
  if (hasCard === null) {
    return (
      <SafeAreaView className="min-h-screen flex-1 items-center justify-center bg-white">
        <View />
      </SafeAreaView>
    );
  }

  // Show intro screen if no card created yet
  if (!hasCard) {
    return <CardIntroScreen onCreateCard={handleCreateCard} />;
  }

  // Show main card screen
  return <CardMainScreen onCreateCard={handleCreateCard} />;
};

export default CardScreen;
