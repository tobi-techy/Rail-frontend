import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useUIStore } from '@/stores';
import { MaskedBalance } from './MaskedBalance';
import { useHaptics } from '@/hooks/useHaptics';

function Shimmer({ light, className }: { light?: boolean; className: string }) {
  const opacity = useSharedValue(0.4);
  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 700 }), withTiming(0.4, { duration: 700 })),
      -1
    );
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={style}
      className={`rounded-lg ${light ? 'bg-white/30' : 'bg-gray-200'} ${className}`}
    />
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface StashCardBadge {
  label: string;
  color: 'green' | 'red' | 'gray';
}

interface StashCardProps {
  title: string;
  amount: string;
  amountCents?: string;
  icon: React.ReactNode;
  badge?: StashCardBadge;
  subtitle?: string;
  /** Solid background color hex — enables the colored card style */
  cardColor?: string;
  className?: string;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
  isLoading?: boolean;
  /** Shows 'Get started' text instead of amount when true */
  getStarted?: boolean;
}

const BADGE_COLORS: Record<StashCardBadge['color'], { bg: string; text: string; dot: string }> = {
  green: { bg: '#ECFDF3', text: '#15803D', dot: '#22C55E' },
  red: { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444' },
  gray: { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF' },
};

export const StashCard: React.FC<StashCardProps> = ({
  title,
  amount,
  amountCents,
  icon,
  badge,
  subtitle,
  cardColor,
  className,
  onPress,
  disabled,
  testID,
  isLoading,
  getStarted,
}) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const { isBalanceVisible } = useUIStore();
  const { impact } = useHaptics();

  const isColored = !!cardColor;
  const badgeColors = badge ? BADGE_COLORS[badge.color] : null;

  return (
    <AnimatedPressable
      style={[animStyle, isColored ? { backgroundColor: cardColor } : undefined]}
      className={`flex-1 rounded-3xl ${isColored ? '' : 'border border-gray-200 bg-white'} px-4 py-4 ${className || ''} ${disabled ? 'opacity-50' : ''}`}
      onPress={() => {
        impact();
        onPress?.();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 20, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      }}
      disabled={disabled}
      testID={testID}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `${title}: ${amount}${amountCents || ''}` : undefined}
      accessibilityState={{ disabled }}>
      {/* Top row: icon + dot */}
      <View className="mb-16 flex-row items-start justify-between">
        {/* Icon in frosted circle */}
        <View>{icon}</View>
      </View>

      {/* Bottom: amount + title */}
      {isLoading ? (
        <View className="gap-y-2">
          <Shimmer light={isColored} className="h-6 w-20" />
          <Shimmer light={isColored} className="h-3 w-12" />
        </View>
      ) : getStarted ? (
        <View>
          <Text
            className="font-subtitle text-lg text-white"
            style={{ color: isColored ? 'white' : '#FF2E01' }}>
            Get started
          </Text>
          <Text
            className="mt-1 font-body text-body tracking-wide"
            style={{ color: isColored ? 'rgba(255,255,255,0.75)' : undefined }}
            numberOfLines={1}>
            {title}
          </Text>
        </View>
      ) : (
        <>
          <MaskedBalance
            value={`${amount}${amountCents ?? ''}`}
            visible={isBalanceVisible}
            textClass="text-stash"
            colorClass={isColored ? 'text-white' : 'text-text-primary'}
          />
          <Text
            className="mt-1 font-body text-body tracking-wide"
            style={{ color: isColored ? 'rgba(255,255,255,0.75)' : undefined }}
            numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              className="mt-0.5 font-body text-[11px]"
              style={{ color: isColored ? 'rgba(255,255,255,0.6)' : undefined }}
              numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </>
      )}
    </AnimatedPressable>
  );
};
