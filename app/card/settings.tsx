import React from 'react';
import { StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CardSettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View className="flex-1 items-center justify-center">
        <Text className="font-subtitle text-lg">Card Settings</Text>
      </View>
    </SafeAreaView>
  );
}
