import type { ImageSourcePropType } from 'react-native';

import centurion from './centurion.png';
import diamondHands from './diamond-hands.png';
import firstBlood from './first-blood.png';
import fiveFigureClub from './five-figure-club.png';
import grand from './grand.png';
import og from './og.png';
import recruiter from './recruiter.png';
import roundUpKing from './round-up-king.png';
import streakLord from './streak-lord.png';
import yearOne from './year-one.png';

export const achievementStickersByName: Record<string, ImageSourcePropType> = {
  'first blood': firstBlood,
  centurion,
  'streak lord': streakLord,
  grand,
  'round-up king': roundUpKing,
  'diamond hands': diamondHands,
  'five figure club': fiveFigureClub,
  'year one': yearOne,
  recruiter,
  og,
};

export const achievementStickersByIcon: Record<string, ImageSourcePropType> = {
  deposit: firstBlood,
  shield: centurion,
  flame: streakLord,
  star: grand,
  crown: roundUpKing,
  diamond: diamondHands,
  trophy: fiveFigureClub,
  calendar: yearOne,
  users: recruiter,
  gem: og,
};

export function getAchievementStickerSource(
  name?: string,
  icon?: string,
): ImageSourcePropType {
  const normalizedName = name?.trim().toLowerCase();
  const normalizedIcon = icon?.trim().toLowerCase();

  return (
    (normalizedName ? achievementStickersByName[normalizedName] : undefined) ??
    (normalizedIcon ? achievementStickersByIcon[normalizedIcon] : undefined) ??
    firstBlood
  );
}
