import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { launchScanner } from '@dariyd/react-native-document-scanner';
import { useAIChatStore } from '@/stores/aiChatStore';
import { logger } from '@/lib/logger';

export default function ReceiptScannerScreen() {
  const router = useRouter();
  const setPendingScannedReceipt = useAIChatStore((s) => s.setPendingScannedReceipt);
  const [status, setStatus] = useState('Opening scanner...');

  useEffect(() => {
    let cancelled = false;

    async function scan() {
      try {
        const result = await launchScanner({
          quality: 0.7,
          includeBase64: true,
        });

        if (cancelled) return;

        if (result.error) {
          logger.warn('Document scanner error', { message: result.errorMessage });
          router.back();
          return;
        }

        if (result.didCancel) {
          router.back();
          return;
        }

        const image = result.images?.[0];
        if (image?.base64) {
          setPendingScannedReceipt({
            uri: image.uri,
            base64: image.base64,
          });
        }

        router.back();
      } catch (err) {
        if (cancelled) return;
        logger.warn('Document scanner failed', { error: err });
        router.back();
      }
    }

    void scan();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-black">
      <ActivityIndicator size="large" color="#fff" />
      <Text className="mt-4 font-body text-[15px] text-white/70">{status}</Text>
    </View>
  );
}
