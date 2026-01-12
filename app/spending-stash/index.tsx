import { View, Text, TouchableOpacity } from 'react-native';
import React, { useLayoutEffect } from 'react';
import { useNavigation } from 'expo-router';

const ComponentName = () => {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <View className="flex-row items-center gap-x-3 pl-[14px]">
          <Text className="font-subtitle text-headline-1">{'Spending'}</Text>
        </View>
      ),
      headerShown: true,
      headerStyle: {
        backgroundColor: 'transparent',
      },
      title: '',
    });
  }, [navigation]);

  return (
    <View>
      <Text>first</Text>
    </View>
  );
};

export default ComponentName;
