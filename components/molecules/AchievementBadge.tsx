import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { LockIcon } from '@hugeicons/core-free-icons';
import type { Achievement } from '@/api/services/gameplay.service';

const TIER: Record<string, { ring: string; fill: string; label: string }> = {
  common:    { ring: '#D1D5DB', fill: '#F9FAFB', label: 'Common' },
  uncommon:  { ring: '#60A5FA', fill: '#EFF6FF', label: 'Uncommon' },
  rare:      { ring: '#A78BFA', fill: '#F5F3FF', label: 'Rare' },
  epic:      { ring: '#F59E0B', fill: '#FFFBEB', label: 'Epic' },
  legendary: { ring: '#FF2E01', fill: '#FFF0ED', label: 'Legendary' },
};

const LOCKED = { ring: '#E5E7EB', fill: '#F9FAFB' };

interface Props {
  achievement: Achievement;
  icon: any;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  earnedPct?: number;
}

export function AchievementBadge({ achievement, icon, size = 'medium', onPress, earnedPct }: Props) {
  const { unlocked, rarity, name } = achievement;
  const tier = TIER[rarity] ?? TIER.common;
  const colors = unlocked ? tier : LOCKED;
  const scale = useSharedValue(1);

  const dims = size === 'large' ? 88 : size === 'small' ? 56 : 72;
  const ringWidth = size === 'large' ? 3 : 2.5;
  const iconSize = size === 'large' ? 30 : size === 'small' ? 20 : 26;

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
        <View style={{
          width: dims,
          height: dims,
          borderRadius: dims / 2,
          borderWidth: ringWidth,
          borderColor: colors.ring,
          backgroundColor: colors.fill,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {unlocked ? (
            <HugeiconsIcon icon={icon} size={iconSize} color={tier.ring} />
          ) : (
            <HugeiconsIcon icon={LockIcon} size={iconSize - 6} color="#C4C4C4" />
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

      {earnedPct != null && unlocked && (
        <Text style={{ fontFamily: 'SFMono-Regular', fontSize: 8, color: '#9CA3AF', marginTop: 2 }}>
          {earnedPct}% of users
        </Text>
      )}
    </Pressable>
  );
}
