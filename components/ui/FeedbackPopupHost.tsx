import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@/components/atoms/SafeIonicons';
import { useFeedbackPopupStore } from '@/stores/feedbackPopupStore';

const DEFAULT_DURATION = 3200;

const typeStyles = {
  success: {
    icon: 'checkmark-circle' as const,
    iconColor: '#00ca48',
    iconBgColor: '#ecfdf3',
    accentColor: '#00ca48',
  },
  error: {
    icon: 'alert-circle' as const,
    iconColor: '#ff2b3a',
    iconBgColor: '#fff1f2',
    accentColor: '#ff2b3a',
  },
  warning: {
    icon: 'warning' as const,
    iconColor: '#d48f00',
    iconBgColor: '#fff7df',
    accentColor: '#ffbb26',
  },
  info: {
    icon: 'information-circle' as const,
    iconColor: '#0090ff',
    iconBgColor: '#e7f5ff',
    accentColor: '#0090ff',
  },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FeedbackPopupHost() {
  const insets = useSafeAreaInsets();
  const popup = useFeedbackPopupStore((state) => state.popup);
  const dismissPopup = useFeedbackPopupStore((state) => state.dismissPopup);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-24);
  const scale = useSharedValue(0.98);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const style = useMemo(() => {
    if (!popup) return null;
    return typeStyles[popup.type];
  }, [popup]);

  const hidePopup = useCallback(
    (onHidden?: () => void) => {
      clearTimer();
      opacity.value = withTiming(
        0,
        { duration: 160, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (!finished) return;
          runOnJS(dismissPopup)();
          if (onHidden) runOnJS(onHidden)();
        }
      );
      translateY.value = withTiming(-18, { duration: 160, easing: Easing.out(Easing.cubic) });
      scale.value = withTiming(0.98, { duration: 160, easing: Easing.out(Easing.cubic) });
    },
    [clearTimer, dismissPopup, opacity, scale, translateY]
  );

  useEffect(() => {
    clearTimer();
    if (!popup) return;

    opacity.value = 0;
    translateY.value = -24;
    scale.value = 0.98;

    opacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) });
    scale.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });

    const duration = popup.duration ?? DEFAULT_DURATION;
    if (duration > 0) {
      timerRef.current = setTimeout(() => {
        hidePopup();
      }, duration);
    }

    return clearTimer;
  }, [clearTimer, hidePopup, opacity, popup, scale, translateY]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  if (!popup || !style) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
      <Pressable
        onPress={() => hidePopup()}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <AnimatedPressable
        onPress={() => {}}
        style={[
          cardStyle,
          {
            position: 'absolute',
            top: insets.top + 10,
            left: 14,
            right: 14,
            borderWidth: 1,
            borderColor: '#f7f2e8',
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            paddingVertical: 12,
            paddingHorizontal: 14,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 3,
          },
        ]}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View
            style={{
              position: 'absolute',
              left: -14,
              top: -12,
              bottom: -12,
              width: 4,
              backgroundColor: style.accentColor,
              borderTopLeftRadius: 20,
              borderBottomLeftRadius: 20,
            }}
          />
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: style.iconBgColor,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 1,
            }}>
            <Ionicons name={style.icon} size={16} color={style.iconColor} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text
              className="text-[15px] text-charcoal-primary"
              style={{ fontFamily: 'Geist-SemiBold' }}>
              {popup.title}
            </Text>
            {popup.message ? (
              <Text
                className="mt-1 text-[13px] text-graphite"
                style={{ fontFamily: 'Geist-Regular' }}>
                {popup.message}
              </Text>
            ) : null}
          </View>
          {popup.action ? (
            <Pressable
              onPress={() => hidePopup(popup.action?.onPress)}
              hitSlop={6}
              style={{ marginLeft: 10, alignSelf: 'center' }}>
              <Text style={{ fontFamily: 'Geist-SemiBold', fontSize: 13, color: '#343433' }}>
                {popup.action.label}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => hidePopup()}
              hitSlop={6}
              style={{ marginLeft: 10, alignSelf: 'center' }}>
              <Ionicons name="close" size={16} color="#6B7280" />
            </Pressable>
          )}
        </View>
      </AnimatedPressable>
    </View>
  );
}
