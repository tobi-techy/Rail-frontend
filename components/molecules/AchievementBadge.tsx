import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { LockIcon } from '@hugeicons/core-free-icons';
import type { Achievement } from '@/api/services/gameplay.service';

const TIER: Record<string, { ring: string; fill: string; glow: string; label: string }> = {
  common:    { ring: '#D1D5DB', fill: '#F9FAFB', glow: 'transparent', label: 'Common' },
  uncommon:  { ring: '#60A5FA', fill: '#EFF6FF', glow: 'rgba(96,165,250,0.15)', label: 'Uncommon' },
  rare:      { ring: '#A78BFA', fill: '#F5F3FF', glow: 'rgba(167,139,250,0.2)', label: 'Rare' },
  epic:      { ring: '#F59E0B', fill: '#FFFBEB', glow: 'rgba(245,158,11,0.2)', label: 'Epic' },
  legendary: { ring: '#FF2E01', fill: '#FFF0ED', glow: 'rgba(255,46,1,0.25)', label: 'Legendary' },
};

const LOCKED = { ring: '#E5E7EB', fill: '#F9FAFB', glow: 'transparent' };

interface Props {
  achievement: Achievement;
  icon: any; // HugeIcon component
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  earnedPct?: number; // "12% of users have this"
}

export function AchievementBadge({ achievement, icon, size = 'medium', onPress, earnedPct }: Props) {
  const { unlocked, rarity, name } = achievement;
  const tier = TIER[rarity] ?? TIER.common;
  const colors = unlocked ? tier : LOCKED;
  const scale = useSharedValue(1);

  const dims = size === 'large' ? 96 : size === 'small' ? 64 : 80;
  const ringWidth = size === 'large' ? 3 : 2.5;
  const iconSize = size === 'large' ? 34 : size === 'small' ? 22 : 28;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.92, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
      style={{ alignItems: 'center', width: dims + 16 }}>
      <Animated.View style={animStyle}>
        {/* Glow layer */}
        {unlocked && colors.glow !== 'transparent' && (
          <View style={{
            position: 'absolute',
            width: dims + 12,
            height: dims + 12,
            borderRadius: (dims + 12) / 2,
            backgroundColor: colors.glow,
            top: -6,
            left: -6 + 8,
          }} />
        )}

        {/* Outer ring */}
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
          {/* Inner icon */}
          {unlocked ? (
            <HugeiconsIcon icon={icon} size={iconSize} color={tier.ring} />
          ) : (
            <HugeiconsIcon icon={LockIcon} size={iconSize - 4} color="#C4C4C4" />
          )}
        </View>
      </Animated.View>

      {/* Name */}
      <Text
        numberOfLines={2}
        style={{
          fontFamily: 'SFProDisplay-Medium',
          fontSize: size === 'small' ? 10 : 11,
          color: unlocked ? '#1A1A1A' : '#9CA3AF',
          textAlign: 'center',
          marginTop: 8,
          lineHeight: 14,
        }}>
        {name}
      </Text>

      {/* Rarity label */}
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

      {/* Earned percentage */}
      {earnedPct != null && unlocked && (
        <Text style={{
          fontFamily: 'SFMono-Regular',
          fontSize: 8,
          color: '#9CA3AF',
          marginTop: 2,
        }}>
          {earnedPct}% of users
        </Text>
      )}
    </Pressable>
  );
}
