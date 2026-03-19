import { genConfig } from '@zamplyy/react-native-nice-avatar';

/**
 * Generates a fully deterministic avatar config from a seed string.
 * Every field is explicitly picked so genConfig never falls back to Math.random().
 */
export function getAvatarConfig(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const pick = <T>(arr: T[]): T =>
    arr[((hash = (hash * 1664525 + 1013904223) >>> 0), hash % arr.length)];

  const sex = pick(['man', 'woman'] as const);
  return genConfig({
    sex,
    faceColor: pick(['#F9C9B6', '#AC6651', '#FDDBB4', '#D08B5B', '#EDB98A']),
    earSize: pick(['small', 'big'] as const),
    hairStyle: pick(['normal', 'thick', 'mohawk', 'womanLong', 'womanShort'] as const),
    hairColor: pick(['#000', '#FC909F', '#77311D', '#D2EFF3', '#506AF4']),
    hatStyle: 'none' as const,
    eyeStyle: pick(['circle', 'oval', 'smile'] as const),
    eyeBrowStyle: sex === 'woman' ? pick(['up', 'upWoman'] as const) : ('up' as const),
    noseStyle: pick(['short', 'long', 'round'] as const),
    mouthStyle: pick(['laugh', 'smile', 'peace'] as const),
    shirtStyle: pick(['hoody', 'short', 'polo'] as const),
    shirtColor: pick(['#9287FF', '#6BD9E9', '#FC909F', '#F4D150', '#77311D']),
    glassesStyle: 'none' as const,
    bgColor: pick(['#FFEDEF', '#E0DDFF', '#D2EFF3', '#FFEBA4', '#F4D150']),
  });
}
