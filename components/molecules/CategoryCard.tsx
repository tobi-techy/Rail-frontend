import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TouchableOpacityProps,
  ImageSourcePropType,
} from 'react-native';
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
  /** Optional legacy icon colours. The card renders a restrained solid Rail surface. */
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
 * Matches Rail's restrained money UI: warm surfaces, inset borders, and one accent.
 */
const DEFAULT_ICON_COLOR = '#ff3e00';

export const CategoryCard: React.FC<CategoryCardProps> = ({
  id,
  title,
  basketsCount,
  performancePercent,
  icon: SvgIcon,
  iconName = 'layers-3',
  iconGradient,
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
    [title, basketLabel, isPositive, performanceLabel]
  );

  const iconColor =
    Array.isArray(iconGradient) && iconGradient.length === 2 ? iconGradient[0] : DEFAULT_ICON_COLOR;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className={['w-full active:opacity-90', className].filter(Boolean).join(' ')}
      style={style}
      {...props}>
      <View className="w-full rounded-2xl border border-stone-surface bg-parchment-card px-4 py-5">
        <View className="flex-row items-start justify-between">
          <View className="h-[45px] w-[45px] items-center justify-center rounded-full bg-stone-surface">
            {SvgIcon ? (
              <SvgIcon width={24} height={24} />
            ) : (
              <Icon name={iconName} size={30} color={iconColor} />
            )}
          </View>

          <View className="rounded-full bg-stone-surface px-3 py-1">
            <Text className="font-body-medium text-[12px] text-ash">{basketLabel}</Text>
          </View>
        </View>

        <View className="mt-6 flex-row justify-between">
          <View>
            <Text className="font-body-bold text-[18px] text-text-primary" numberOfLines={1}>
              {title}
            </Text>
            <View className="mt-2 flex-row items-center">
              <View
                className={`mr-2 h-2 w-2 rounded-full ${isPositive ? 'bg-meadow-green' : 'bg-coral-red'}`}
                accessibilityLabel={isPositive ? 'Positive performance' : 'Negative performance'}
              />
              <Text
                className={`font-body-medium text-[14px] ${isPositive ? 'text-charcoal-primary' : 'text-coral-red'}`}>
                {isPositive ? '↑' : '↓'} {performanceLabel}
              </Text>
            </View>
          </View>

          {tokenLogos.length > 0 && (
            <View className="mt-4 flex-row">
              {tokenLogos.slice(0, 3).map((src, index) => (
                <View
                  key={`${id}-token-${index}`}
                  className="h-8 w-8 items-center justify-center rounded-full border-2 border-parchment-card bg-parchment-card"
                  style={{
                    marginLeft: index > 0 ? -10 : 0,
                    zIndex: 3 - index,
                  }}>
                  <Image source={src} className="h-7 w-7 rounded-full" />
                </View>
              ))}
              {tokenLogos.length > 3 && (
                <View
                  className="h-8 w-8 items-center justify-center rounded-full border-2 border-parchment-card bg-sky-blue"
                  style={{ marginLeft: -10 }}>
                  <Text className="font-body-bold text-[12px] text-text-inverse">
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
