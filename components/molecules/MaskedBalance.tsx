import React from 'react';
import { Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface MaskedBalanceProps {
  /** The real value to show when visible */
  value: string;
  visible: boolean;
  /** text size class, e.g. 'text-[48px]' */
  textClass?: string;
  colorClass?: string;
}

const MASK = '****';

export const MaskedBalance: React.FC<MaskedBalanceProps> = ({
  value,
  visible,
  textClass = 'text-[48px]',
  colorClass = 'text-text-primary',
}) => {
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    opacity.value = withTiming(0, { duration: 80, easing: Easing.out(Easing.ease) }, () => {
      opacity.value = withTiming(1, { duration: 150, easing: Easing.in(Easing.ease) });
    });
  }, [visible, opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={animStyle} className="min-w-0">
      <Text
        className={`font-subtitle ${textClass} ${colorClass}`}
        style={{ fontVariant: ['tabular-nums'] }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.62}
        ellipsizeMode="tail"
        accessibilityLabel={visible ? value : 'Balance hidden'}
        accessibilityHint={visible ? undefined : 'Enable balance visibility in settings to view'}>
        {visible ? value : MASK}
      </Text>
    </Animated.View>
  );
};
