import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useButtonFeedback } from '@/hooks/useButtonFeedback';

export default function KycTosScreen() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const [loading, setLoading] = useState(true);
  const triggerFeedback = useButtonFeedback();

  const handleDone = () => {
    router.back();
  };

  // SECURITY FIX (R4-M1): Only allow URLs from trusted domains in the WebView
  // to prevent in-app phishing via deep link URL injection.
  const TRUSTED_HOSTS = ['userail.money', 'api.userail.money', 'alpaca.markets', 'didit.me'];
  let safeUrl: string | null = null;
  try {
    const decoded = decodeURIComponent(url ?? '');
    const parsed = new URL(decoded);
    if (
      parsed.protocol === 'https:' &&
      TRUSTED_HOSTS.some((h) => parsed.hostname === h || parsed.hostname.endsWith('.' + h))
    ) {
      safeUrl = decoded;
    }
  } catch {}

  if (!safeUrl) {
    handleDone();
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between border-b border-stone-surface px-4 py-3">
        <Text className="font-subtitle text-base text-charcoal-primary" maxFontSizeMultiplier={1.3}>
          Terms of Service
        </Text>
        <Pressable
          onPress={() => {
            triggerFeedback();
            handleDone();
          }}
          className="rounded-full bg-primary px-4 py-1.5"
          accessibilityRole="button">
          <Text className="font-subtitle text-sm text-white" maxFontSizeMultiplier={1.3}>
            Done
          </Text>
        </Pressable>
      </View>
      {loading && (
        <View className="absolute inset-0 items-center justify-center">
          <ActivityIndicator size="small" color="#000" />
        </View>
      )}
      <WebView
        source={{ uri: safeUrl }}
        onLoadEnd={() => setLoading(false)}
        style={{ flex: 1 }}
        originWhitelist={TRUSTED_HOSTS.map((h) => `https://*.${h}`)}
      />
    </SafeAreaView>
  );
}
