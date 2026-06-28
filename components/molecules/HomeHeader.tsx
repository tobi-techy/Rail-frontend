import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { getAvatarSvg } from '@/utils/avatarConfig';
import { useAuthStore } from '@/stores/authStore';

const AVATAR_SIZE = 44;

function getGreeting(hour = new Date().getHours()): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Square, bordered avatar built from the shared DiceBear generator.
 * (DiceBearAvatar renders a circle — here we want a rounded-square dexicon.)
 */
function SquareAvatar({ seed }: { seed: string }) {
  const svg = useMemo(() => getAvatarSvg(seed, AVATAR_SIZE), [seed]);
  return (
    <View
      style={{
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: 13,
        borderWidth: 1.5,
        borderColor: '#ECE7DB',
        backgroundColor: '#F8F7F4',
        overflow: 'hidden',
      }}>
      <SvgXml xml={svg} width={AVATAR_SIZE} height={AVATAR_SIZE} />
    </View>
  );
}

export function HomeHeader() {
  const user = useAuthStore((s) => s.user);

  const firstName = user?.firstName?.trim() || user?.fullName?.trim()?.split(' ')[0] || 'there';
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  const seed = user?.id || user?.email || firstName;
  const greeting = getGreeting();

  return (
    <View className="flex-row items-center gap-3">
      <SquareAvatar seed={seed} />
      <View>
        <Text className="font-body text-[13px] leading-[16px] text-ash">{greeting}</Text>
        <Text className="font-display text-[20px] leading-[24px] text-charcoal-primary">
          {displayName}
        </Text>
      </View>
    </View>
  );
}
