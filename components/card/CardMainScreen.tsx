import React, { useLayoutEffect } from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff, Lock, MoreVertical, Plus, Snowflake, Trash2 } from 'lucide-react-native';
import { useNavigation } from 'expo-router';

import { RailCard } from '../cards';

interface CardIntroScreenProps {
  onCreateCard: () => void;
}

const CardMainScreen = ({ onCreateCard }: CardIntroScreenProps) => {
  const navigation = useNavigation();
  const [showDetails, setShowDetails] = React.useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <Text className="pl-md font-headline text-headline-1">Card</Text>,
      headerShown: true,
      headerStyle: {
        backgroundColor: '#fff',
        elevation: 0,
        shadowColor: 'transparent',
      },
      headerTitle: '',
    });
  }, [navigation]);

  return (
    <SafeAreaView className="min-h-screen flex-1 bg-white" edges={['bottom']}>
      <ScrollView className="flex-1 px-[14px]" showsVerticalScrollIndicator={false}>
        <View className="mt-3">
          <Text className="font-numeric text-body text-slate-400">Balance</Text>
          <Text className="mb-1 font-subtitle text-headline-1 text-text-primary">$10.00</Text>
        </View>
        {/* Card Display */}
        <View className="items-center pt-4">
          <View
            className="items-center"
            style={{
              shadowColor: '#000',
              shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0,
              shadowRadius: 22,
              shadowOffset: { width: 0, height: 14 },
              elevation: Platform.OS === 'android' ? 6 : 0,
            }}>
            <RailCard
              brand="VISA"
              holderName="TOBI ADE"
              last4="2049"
              exp="09/29"
              currency="USD"
              accentColor="#FF6A00"
              patternIntensity={0.45}
              orientation="horizontal"
            />
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={onCreateCard}
        className="absolute bottom-[140px] right-4 h-14 w-14 items-center justify-center rounded-full bg-black">
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default CardMainScreen;
export { CardMainScreen };
