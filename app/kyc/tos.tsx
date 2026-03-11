import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

export default function KycTosScreen() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const [loading, setLoading] = useState(true);

  const handleDone = () => {
    router.back();
  };

  if (!url) {
    handleDone();
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3">
        <Text className="font-subtitle text-base text-gray-900">Terms of Service</Text>
        <Pressable
          onPress={handleDone}
          className="rounded-full bg-gray-900 px-4 py-1.5"
          accessibilityRole="button">
          <Text className="font-subtitle text-sm text-white">Done</Text>
        </Pressable>
      </View>
      {loading && (
        <View className="absolute inset-0 items-center justify-center">
          <ActivityIndicator size="small" color="#000" />
        </View>
      )}
      <WebView
        source={{ uri: decodeURIComponent(url) }}
        onLoadEnd={() => setLoading(false)}
        style={{ flex: 1 }}
      />
    </SafeAreaView>
  );
}
