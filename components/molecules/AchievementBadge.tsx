import React from 'react';
import { Image, View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';
import { LockIcon } from '@/lib/icons';
import type { Achievement } from '@/api/services/gameplay.service';
import { getAchievementStickerSource } from '@/assets/images/achievements';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';

const TIER: Record<string, { ring: string; label: string }> = {
  common: { ring: '#c6c6c6', label: 'Common' },
  uncommon: { ring: '#60A5FA', label: 'Uncommon' },
  rare: { ring: '#A78BFA', label: 'Rare' },
  epic: { ring: '#F59E0B', label: 'Epic' },
  legendary: { ring: '#ff3e00', label: 'Legendary' },
};

interface Props {
  achievement: Achievement;
  icon?: any;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  earnedPct?: number;
}

export function AchievementBadge({ achievement, size = 'medium', onPress, earnedPct }: Props) {
  const { unlocked, rarity, name } = achievement;
  const tier = TIER[rarity] ?? TIER.common;
  const scale = useSharedValue(1);
  const haptics = useHaptics();

  const dims = size === 'large' ? 88 : size === 'small' ? 64 : 76;
  const stickerSize = size === 'large' ? 72 : size === 'small' ? 52 : 64;
  const lockSize = size === 'large' ? 24 : size === 'small' ? 16 : 20;
  const stickerSource = getAchievementStickerSource(achievement.name, achievement.icon);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={() => {
        haptics.selection();
        playUISound('buttonClick');
        onPress?.();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.92, { damping: 15 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12 });
      }}
      className="items-center">
      <Animated.View style={[{ alignItems: 'center' }, animStyle]}>
        <View
          className="items-center justify-center overflow-hidden"
          style={{
            width: dims,
            height: dims,
            borderRadius: dims / 2,
            backgroundColor: unlocked ? `${tier.ring}18` : '#f7f2e8',
          }}>
          <Image
            source={stickerSource}
            resizeMode="contain"
            style={{
              width: stickerSize,
              height: stickerSize,
              opacity: unlocked ? 1 : 0.35,
            }}
          />
          {!unlocked && (
            <View
              className="absolute items-center justify-center rounded-full border border-gray-200 bg-white/90"
              style={{
                width: lockSize + 18,
                height: lockSize + 18,
              }}>
              <HugeiconsIcon icon={LockIcon} size={lockSize} color="#9CA3AF" />
            </View>
          )}
        </View>
      </Animated.View>

      <Text
        numberOfLines={2}
        className={`mt-2 text-center font-body-medium text-[11px] leading-[14px] ${
          unlocked ? 'text-text-primary' : 'text-text-tertiary'
        }`}>
        {name}
      </Text>

      <Text
        className="mt-1 font-mono-medium text-[9px] uppercase tracking-wide"
        style={{ color: unlocked ? tier.ring : '#c6c6c6' }}>
        {tier.label}
      </Text>

      {earnedPct !== undefined && unlocked && (
        <Text className="mt-1 font-mono text-[8px] text-text-tertiary">{earnedPct}% of users</Text>
      )}
    </Pressable>
  );
}
