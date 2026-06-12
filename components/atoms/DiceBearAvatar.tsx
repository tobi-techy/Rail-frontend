import { useMemo } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { getAvatarSvg } from '@/utils/avatarConfig';

interface DiceBearAvatarProps {
  seed: string;
  size?: number;
}

export function DiceBearAvatar({ seed, size = 88 }: DiceBearAvatarProps) {
  const svg = useMemo(() => getAvatarSvg(seed, size), [seed, size]);

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
      <SvgXml xml={svg} width={size} height={size} />
    </View>
  );
}
