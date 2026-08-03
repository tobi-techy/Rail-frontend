import React, { useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Haptics from '@/utils/platformHaptics';
import { logger } from '@/lib/logger';
import { MiriamCharacter } from './MiriamCharacter';

interface Props {
  title: string;
  subtitle?: string;
  level?: 'small' | 'big' | 'epic';
  onClose: () => void;
}

const GRADIENTS: Record<NonNullable<Props['level']>, readonly [string, string]> = {
  small: ['#FF8A5C', '#FF3E00'],
  big: ['#FF6A3D', '#FF3E00'],
  epic: ['#FF3E00', '#D43400'],
};

/**
 * A branded, screenshot-ready "win" card shown after a celebration. The card is
 * captured with view-shot and shared via the native share sheet — turning a
 * milestone into something users post to their story.
 */
export function ShareableWinCard({ title, subtitle, level = 'big', onClose }: Props) {
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSharing(true);
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        logger.warn('Sharing not available on this device');
        return;
      }
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your win' });
    } catch (err) {
      logger.warn('Failed to capture/share win card', { error: err });
    } finally {
      setSharing(false);
    }
  };

  return (
    <View className="w-full items-center">
      {/* The capturable card */}
      <View
        ref={cardRef}
        collapsable={false}
        style={{ width: 300, borderRadius: 28, overflow: 'hidden' }}>
        <LinearGradient
          colors={GRADIENTS[level]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center' }}>
          <MiriamCharacter size={64} emotion="happy" color="#ffffff" animate={false} />
          <Text className="mt-4 text-center font-heading text-[26px] leading-[32px] text-white">
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-2 text-center font-body text-[15px] leading-[21px] text-white/85">
              {subtitle}
            </Text>
          ) : null}
          <View className="mt-5 flex-row items-center gap-1.5">
            <View className="h-1.5 w-1.5 rounded-full bg-white/60" />
            <Text className="font-body-medium text-[12px] uppercase tracking-[2px] text-white/70">
              made with rail
            </Text>
          </View>
        </LinearGradient>
      </View>

      {/* Actions (not captured) */}
      <View className="mt-5 w-[300px] flex-row gap-3">
        <Pressable
          onPress={onClose}
          className="flex-1 items-center justify-center rounded-full border border-black/[0.1] bg-white py-3.5"
          accessibilityRole="button"
          accessibilityLabel="Dismiss">
          <Text className="font-body-medium text-[15px] text-charcoal-primary">Nice</Text>
        </Pressable>
        <Pressable
          onPress={handleShare}
          disabled={sharing}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-[#FF3E00] py-3.5"
          accessibilityRole="button"
          accessibilityLabel="Share your win">
          {sharing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="font-body-medium text-[15px] text-white">Share</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
