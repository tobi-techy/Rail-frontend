import React, { useRef, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { IconComponent as HugeiconsIcon, Cancel01Icon, FlashIcon, Camera01Icon } from '@/lib/icons';
import { useHaptics } from '@/hooks/useHaptics';
import { useAIChatStore } from '@/stores/aiChatStore';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const FRAME_W = SCREEN_W * 0.82;
const FRAME_H = FRAME_W * 1.4; // Receipt aspect ratio
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

/** Module-level store for the last scanned receipt. Consumed by ai-chat on focus. */
export let lastScannedReceipt: { uri: string; base64: string } | null = null;
export function clearScannedReceipt() {
  lastScannedReceipt = null;
}

export default function ReceiptScannerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { impact } = useHaptics();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    impact();

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        base64: true,
      });

      if (photo?.base64) {
        // Store in module-level export for ai-chat to pick up
        lastScannedReceipt = { uri: photo.uri, base64: photo.base64 };
        router.back();
      }
    } catch {
      // Camera may have been released
    } finally {
      setCapturing(false);
    }
  }, [capturing, impact, router]);

  const toggleFlash = useCallback(() => {
    setFlash((f) => !f);
  }, []);

  if (!permission?.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="mb-4 text-center font-body text-[16px] text-white">
          Camera access needed to scan receipts
        </Text>
        <Pressable onPress={requestPermission} className="rounded-full bg-white px-6 py-3">
          <Text className="font-heading-bold text-[15px] text-black">Allow Camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        flash={flash ? 'on' : 'off'}
      />

      {/* Dark overlay with cutout */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Top */}
        <View style={[styles.overlay, { height: (SCREEN_H - FRAME_H) / 2 }]} />
        {/* Middle row */}
        <View style={{ flexDirection: 'row', height: FRAME_H }}>
          <View style={[styles.overlay, { width: (SCREEN_W - FRAME_W) / 2 }]} />
          {/* Transparent cutout */}
          <View style={{ width: FRAME_W, height: FRAME_H }} />
          <View style={[styles.overlay, { width: (SCREEN_W - FRAME_W) / 2 }]} />
        </View>
        {/* Bottom */}
        <View style={[styles.overlay, { flex: 1 }]} />
      </View>

      {/* Corner brackets */}
      <View
        style={[
          styles.frameContainer,
          { top: (SCREEN_H - FRAME_H) / 2, left: (SCREEN_W - FRAME_W) / 2 },
        ]}
        pointerEvents="none">
        {/* Top-left */}
        <View style={[styles.corner, styles.cornerTL]} />
        {/* Top-right */}
        <View style={[styles.corner, styles.cornerTR]} />
        {/* Bottom-left */}
        <View style={[styles.corner, styles.cornerBL]} />
        {/* Bottom-right */}
        <View style={[styles.corner, styles.cornerBR]} />
      </View>

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={{ paddingTop: insets.top + 12 }}
        className="absolute left-0 right-0 top-0 flex-row items-center justify-between px-5">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="h-10 w-10 items-center justify-center rounded-full bg-black/40">
          <HugeiconsIcon icon={Cancel01Icon} size={18} color="#fff" />
        </Pressable>
        <Text className="font-mono-bold text-[13px] tracking-wider text-white/90">
          SCAN RECEIPT
        </Text>
        <Pressable
          onPress={toggleFlash}
          hitSlop={12}
          className="h-10 w-10 items-center justify-center rounded-full bg-black/40">
          <HugeiconsIcon icon={FlashIcon} size={18} color={flash ? '#fbbf24' : '#fff'} />
        </Pressable>
      </Animated.View>

      {/* Instruction text */}
      <Animated.View
        entering={FadeInUp.delay(200).duration(400)}
        style={{ top: (SCREEN_H - FRAME_H) / 2 - 40 }}
        className="absolute left-0 right-0 items-center">
        <Text className="font-body text-[14px] text-white/70">Align receipt within the frame</Text>
      </Animated.View>

      {/* Capture button */}
      <View
        style={{ paddingBottom: insets.bottom + 24 }}
        className="absolute bottom-0 left-0 right-0 items-center">
        <Pressable
          onPress={handleCapture}
          disabled={capturing}
          className="items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Capture receipt">
          <View style={styles.captureOuter}>
            <Animated.View style={[styles.captureInner, capturing && { opacity: 0.5 }]} />
          </View>
        </Pressable>
        <Text className="mt-3 font-body text-[12px] text-white/50">Tap to capture</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  frameContainer: {
    position: 'absolute',
    width: FRAME_W,
    height: FRAME_H,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: '#fff',
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: '#fff',
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: '#fff',
    borderBottomRightRadius: 4,
  },
  captureOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },
});
