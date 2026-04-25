import React from 'react';
import { Image, View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { LockIcon } from '@hugeicons/core-free-icons';
import type { Achievement } from '@/api/services/gameplay.service';
import { getAchievementStickerSource } from '@/assets/images/achievements';

const TIER: Record<string, { ring: string; label: string }> = {
  common: { ring: '#D1D5DB', label: 'Common' },
  uncommon: { ring: '#60A5FA', label: 'Uncommon' },
  rare: { ring: '#A78BFA', label: 'Rare' },
  epic: { ring: '#F59E0B', label: 'Epic' },
  legendary: { ring: '#FF2E01', label: 'Legendary' },
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

  const dims = size === 'large' ? 112 : size === 'small' ? 68 : 90;
  const stickerSize = size === 'large' ? 112 : size === 'small' ? 68 : 90;
  const lockSize = size === 'large' ? 28 : size === 'small' ? 18 : 22;
  const stickerSource = getAchievementStickerSource(achievement.name, achievement.icon);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.92, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
      style={{ alignItems: 'center' }}>
      <Animated.View style={[{ alignItems: 'center' }, animStyle]}>
        <View
          style={{
            width: dims,
            height: dims,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: dims * 0.34,
            overflow: 'hidden',
          }}>
          <Image
            source={stickerSource}
            resizeMode="contain"
            style={{
              width: stickerSize,
              height: stickerSize,
              opacity: unlocked ? 1 : 0.16,
              transform: [{ scale: unlocked ? 1 : 0.92 }],
            }}
          />
          {!unlocked && (
            <View
              style={{
                position: 'absolute',
                width: dims * 1.54,
                height: dims * 1.44,
                borderRadius: dims * 1.2,
                backgroundColor: 'rgba(255,255,255,0.92)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(229,231,235,0.95)',
              }}>
              <HugeiconsIcon icon={LockIcon} size={lockSize} color="#9CA3AF" />
            </View>
          )}
        </View>
      </Animated.View>

      <Text
        numberOfLines={2}
        style={{
          fontFamily: 'SFProDisplay-Medium',
          fontSize: 11,
          color: unlocked ? '#1A1A1A' : '#9CA3AF',
          textAlign: 'center',
          marginTop: 6,
          lineHeight: 14,
        }}>
        {name}
      </Text>

      <Text style={{
        fontFamily: 'SFMono-Medium',
        fontSize: 9,
        color: unlocked ? tier.ring : '#D1D5DB',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 2,
      }}>
        {tier.label}
      </Text>

      {earnedPct !== undefined && unlocked && (
        <Text style={{ fontFamily: 'SFMono-Regular', fontSize: 8, color: '#9CA3AF', marginTop: 2 }}>
          {earnedPct}% of users
        </Text>
      )}
    </Pressable>
  );
}
