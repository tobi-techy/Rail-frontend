import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity } from 'react-native';

import { RailCard } from '../../components/cards';
import { Plus } from 'lucide-react-native';

const CardScreen = () => {
  return (
    <SafeAreaView className="min-h-screen flex-1 bg-transparent">
      <View className="mt-[120px] items-center px-4 ">
        <RailCard
          brand="VISA"
          holderName="TOBI ADE"
          last4="2049"
          exp="09/29"
          currency="USD"
          accentColor="#FF6A00"
          patternIntensity={0.55}
          orientation="vertical"
        />
        <Text className="mt-[124px] font-subtitle text-display-lg">Rail Virtual Card</Text>
      </View>

      <View className="absolute bottom-14 right-4">
        <TouchableOpacity className="h-14 w-14 items-center justify-center rounded-full bg-black">
          <Plus size={24} color={'#fff'} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CardScreen;
