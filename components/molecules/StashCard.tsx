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

function Shimmer({ className }: { className: string }) {
  const opacity = useSharedValue(0.4);
  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 700 }), withTiming(0.4, { duration: 700 })),
      -1
    );
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={style} className={`rounded-lg bg-gray-200 ${className}`} />;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface StashCardBadge {
  label: string;
  /** 'green' | 'red' | 'gray' */
  color: 'green' | 'red' | 'gray';
}

interface StashCardProps {
  title: string;
  amount: string;
  amountCents?: string;
  icon: React.ReactNode;
  badge?: StashCardBadge;
  subtitle?: string;
  className?: string;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
  isLoading?: boolean;
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
  className,
  onPress,
  disabled,
  testID,
  isLoading,
}) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const { isBalanceVisible } = useUIStore();
  const { impact } = useHaptics();

  const badgeColors = badge ? BADGE_COLORS[badge.color] : null;

  return (
    <AnimatedPressable
      style={animStyle}
      className={`flex-1 rounded-2xl border border-gray-200 bg-transparent px-5 py-5 ${className || ''} ${disabled ? 'opacity-50' : ''}`}
      onPress={() => { impact(); onPress?.(); }}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 20, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 20, stiffness: 300 }); }}
      disabled={disabled}
      testID={testID}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `${title}: ${amount}${amountCents || ''}` : undefined}
      accessibilityState={{ disabled }}>
      <View className="mb-14 flex-row items-start justify-between">
        <View>{icon}</View>
        {badge && badgeColors ? (
          <View
            style={{ backgroundColor: badgeColors.bg }}
            className="flex-row items-center gap-1 rounded-full px-2 py-[3px]">
            <View
              style={{ backgroundColor: badgeColors.dot, width: 6, height: 6, borderRadius: 3 }}
            />
            <Text style={{ color: badgeColors.text, fontSize: 11, fontWeight: '600' }}>
              {badge.label}
            </Text>
          </View>
        ) : null}
      </View>

      {isLoading ? (
        <View className="gap-y-2">
          <Shimmer className="h-7 w-20" />
          <Shimmer className="h-3 w-12" />
        </View>
      ) : (
        <>
          <View className="min-w-0 flex-row items-baseline">
            <MaskedBalance
              value={`${amount}${amountCents ?? ''}`}
              visible={isBalanceVisible}
              textClass="text-stash"
              colorClass="text-text-primary"
            />
          </View>
          <Text className="mt-1 font-body text-body tracking-wide text-text-tertiary">{title}</Text>
          {subtitle ? (
            <Text className="mt-0.5 font-body text-[11px] text-text-tertiary">{subtitle}</Text>
          ) : null}
        </>
      )}
    </AnimatedPressable>
  );
};
