import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TouchableOpacityProps,
  ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgProps } from 'react-native-svg';
import { Icon } from '../atoms/Icon';

export interface CategoryCardProps extends Omit<TouchableOpacityProps, 'children'> {
  /** Unique identifier */
  id: string;
  /** Category title */
  title: string;
  /** Number of baskets in this category */
  basketsCount: number;
  /** Performance percentage for the category */
  performancePercent: number;
  /** Optional SVG icon component sourced from assets */
  icon?: React.ComponentType<SvgProps>;
  /** Optional Lucide icon fallback when an asset icon is not supplied */
  iconName?: string;
  /** Optional gradient colours for the icon bubble */
  iconGradient?: readonly [string, string];
  /** Token/logo images shown as overlapping avatars */
  tokenLogos?: ImageSourcePropType[];
  /** Press handler */
  onPress?: () => void;
  /** Additional tailwind class names */
  className?: string;
}

/**
 * CategoryCard
 * A compact, reusable card for displaying a basket category with:
 * - Leading icon bubble
 * - Title and baskets count
 * - Performance indicator
 * - Row of overlapping token avatars
 * Matches the reference design while using shared atoms and tokens.
 */
const DEFAULT_GRADIENT: readonly [string, string] = ['#F7F8FF', '#E2E5FF'];

export const CategoryCard: React.FC<CategoryCardProps> = ({
  id,
  title,
  basketsCount,
  performancePercent,
  icon: SvgIcon,
  iconName = 'layers-3',
  iconGradient = DEFAULT_GRADIENT,
  tokenLogos = [],
  onPress,
  className,
  style,
  ...props
}) => {
  const isPositive = performancePercent >= 0;
  const basketLabel = `${basketsCount} ${basketsCount === 1 ? 'basket' : 'baskets'}`;
  const performanceLabel = `${Math.abs(performancePercent).toFixed(2)}%`;

  const accessibilityLabel = useMemo(
    () =>
      `${title} category. ${basketLabel}. Performance ${isPositive ? 'up' : 'down'} ${performanceLabel}.`,
    [title, basketLabel, isPositive, performanceLabel],
  );

  const gradientColors: readonly [string, string] =
    Array.isArray(iconGradient) && iconGradient.length === 2
      ? iconGradient
      : DEFAULT_GRADIENT;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className={['w-full active:opacity-90', className].filter(Boolean).join(' ')}
      style={style}
      {...props}
    >
      <View
        className="w-full rounded-[28px] border border-[#EEF1F8] bg-white px-4 py-5"
        style={{
          shadowColor: '#1E1A3E',
          shadowOpacity: 0.06,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 12 },
          elevation: 3,
        }}
      >
        <View className="flex-row items-start justify-between">
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              height: 45,
              width: 45,
              borderRadius: 40,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#1E1A3E',
              shadowOpacity: 0.12,
              shadowOffset: { width: 0, height: 8 },
              shadowRadius: 16,
              elevation: 6,
            }}
          >
            {SvgIcon ? (
              <SvgIcon width={24} height={24} />
            ) : (
              <Icon name={iconName} size={32} color="#1E1A3E" />
            )}
          </LinearGradient>

          <View className="rounded-full bg-[#F4F5FA] px-3 py-1">
            <Text className="text-[12px] font-body-medium text-[#5A5D72]">
              {basketLabel}
            </Text>
          </View>
        </View>

        <View className="mt-6 flex-row justify-between">
       <View>
       <Text
            className="text-[18px] font-body-bold text-text-primary"
            numberOfLines={1}
          >
            {title}
          </Text>
          <View className="mt-2 flex-row items-center">
            <View
              className={`mr-2 h-2 w-2 rounded-full ${isPositive ? 'bg-[#1BC773]' : 'bg-[#FB088F]'}`}
              accessibilityLabel={isPositive ? 'Positive performance' : 'Negative performance'}
            />
            <Text className={`text-[14px] font-body-medium ${isPositive ? 'text-[#1E1A3E]' : 'text-[#FB088F]'}`}>
              {performanceLabel}
            </Text>
          </View>
       </View>

          {tokenLogos.length > 0 && (
            <View className="mt-4 flex-row">
              {tokenLogos.slice(0, 3).map((src, index) => (
                <View
                  key={`${id}-token-${index}`}
                  className="h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white"
                  style={{
                    marginLeft: index > 0 ? -10 : 0,
                    zIndex: 3 - index,
                  }}
                >
                  <Image
                    source={src}
                    className="h-7 w-7 rounded-full"
                  />
                </View>
              ))}
              {tokenLogos.length > 3 && (
                <View
                  className="h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#949FFF]"
                  style={{ marginLeft: -10 }}
                >
                  <Text className="text-[12px] font-body-bold text-white">
                    +{tokenLogos.length - 3}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
