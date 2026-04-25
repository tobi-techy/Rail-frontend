import React from 'react';
import { Image, Text, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { LockIcon, Tick02Icon } from '@hugeicons/core-free-icons';

import type { Achievement } from '@/api/services/gameplay.service';
import { getAchievementStickerSource } from '@/assets/images/achievements';
import { GorhomBottomSheet } from './GorhomBottomSheet';

const RARITY_LABEL: Record<Achievement['rarity'], string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

const ACHIEVEMENT_DETAILS: Record<
  string,
  {
    about: string;
    unlock: string;
  }
> = {
  'first blood': {
    about: 'A starter badge for taking the first real step toward building your Rail balance.',
    unlock: 'Make your first deposit into Rail.',
  },
  centurion: {
    about: 'A savings milestone badge for getting your stash past the first meaningful checkpoint.',
    unlock: 'Grow your stash balance to $100.',
  },
  'streak lord': {
    about: 'A consistency badge for users who keep showing up and building their balance over time.',
    unlock: 'Keep a deposit streak alive for 30 days.',
  },
  grand: {
    about: 'A balance growth badge for crossing into your first four-figure Rail balance.',
    unlock: 'Reach $1,000 in total balance.',
  },
  'round-up king': {
    about: 'A momentum badge for turning everyday card activity into steady stash growth.',
    unlock: 'Trigger 100 round-ups.',
  },
  'diamond hands': {
    about: 'A discipline badge for holding your stash through the temptation to withdraw.',
    unlock: 'Go 90 days without withdrawing from your stash.',
  },
  'five figure club': {
    about: 'A high-value milestone badge for users who build a serious Rail balance.',
    unlock: 'Reach $10,000 in total balance.',
  },
  'year one': {
    about: 'A loyalty badge for staying active and building a long-term Rail habit.',
    unlock: 'Keep your account active for 365 days.',
  },
  recruiter: {
    about: 'A community badge for helping more people start building on Rail.',
    unlock: 'Refer 5 friends who make a deposit.',
  },
  og: {
    about: 'A legendary early-supporter badge reserved for the first wave of Rail users.',
    unlock: 'Be among the first 1,000 Rail users.',
  },
};

interface AchievementDetailSheetProps {
  achievement: Achievement | null;
  visible: boolean;
  onClose: () => void;
}

function getAchievementDetail(achievement: Achievement) {
  return (
    ACHIEVEMENT_DETAILS[achievement.name.trim().toLowerCase()] ?? {
      about: achievement.description,
      unlock: achievement.description,
    }
  );
}

export function AchievementDetailSheet({
  achievement,
  visible,
  onClose,
}: AchievementDetailSheetProps) {
  if (!achievement) return null;

  const detail = getAchievementDetail(achievement);
  const stickerSource = getAchievementStickerSource(achievement.name, achievement.icon);
  const isUnlocked = achievement.unlocked;

  return (
    <GorhomBottomSheet visible={visible} onClose={onClose} snapPoints={['58%']}>
      <View className="items-center pr-8">
        <View className="h-48 w-48 items-center justify-center overflow-hidden rounded-[56px]">
          <Image
            source={stickerSource}
            resizeMode="contain"
            className="h-48 w-48"
            style={{ opacity: isUnlocked ? 1 : 0.18, transform: [{ scale: isUnlocked ? 1 : 0.92 }] }}
          />
          {!isUnlocked && (
            <View className="absolute h-28 w-28 items-center justify-center rounded-[36px] border border-gray-200 bg-white/95">
              <HugeiconsIcon icon={LockIcon} size={34} color="#9CA3AF" />
            </View>
          )}
        </View>

        <View
          className={`mt-2 flex-row items-center gap-2 rounded-full px-3 py-1 ${
            isUnlocked ? 'bg-emerald-50' : 'bg-gray-100'
          }`}>
          <HugeiconsIcon
            icon={isUnlocked ? Tick02Icon : LockIcon}
            size={14}
            color={isUnlocked ? '#059669' : '#6B7280'}
          />
          <Text
            className={`font-mono text-[11px] ${
              isUnlocked ? 'text-emerald-700' : 'text-gray-600'
            }`}>
            {isUnlocked ? 'Unlocked' : 'Locked'}
          </Text>
        </View>

        <Text className="mt-4 text-center font-heading text-2xl text-text-primary">
          {achievement.name}
        </Text>
        <Text className="mt-1 text-center font-mono text-[11px] text-text-tertiary">
          {RARITY_LABEL[achievement.rarity]} badge
        </Text>
      </View>

      <View className="mt-6 gap-4">
        <View className="rounded-2xl border border-gray-100 bg-white p-4">
          <Text className="font-subtitle text-base text-text-primary">What it means</Text>
          <Text className="mt-2 font-body text-[15px] leading-5 text-text-secondary">
            {detail.about}
          </Text>
        </View>

        <View className="rounded-2xl border border-gray-100 bg-surface p-4">
          <Text className="font-subtitle text-base text-text-primary">
            {isUnlocked ? 'How you earned it' : 'How to unlock it'}
          </Text>
          <Text className="mt-2 font-body text-[15px] leading-5 text-text-secondary">
            {detail.unlock}
          </Text>
        </View>
      </View>
    </GorhomBottomSheet>
  );
}
