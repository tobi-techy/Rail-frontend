import React, { useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { useHaptics } from '@/hooks/useHaptics';
import { useAIChatStore } from '@/stores/aiChatStore';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Tab Item ────────────────────────────────────────────────────

function TabBarItem({
  route,
  descriptor,
  isFocused,
  navigation,
}: {
  route: any;
  descriptor: any;
  isFocused: boolean;
  navigation: any;
}) {
  const scale = useSharedValue(1);
  const { options } = descriptor;
  const { impact } = useHaptics();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPress = () => {
    impact();
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  const label = options.title ?? route.name;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.85, { damping: 15 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15 });
      }}
      className="items-center justify-center">
      <Animated.View style={animatedStyle} className="items-center gap-[3px]">
        {options.tabBarIcon?.({
          focused: isFocused,
          color: isFocused ? '#FF2E01' : '#6B7280',
          size: 14,
        })}
        <Text
          className="font-body tracking-[0.2px]"
          style={{ fontSize: 10, color: isFocused ? '#FF2E01' : '#6B7280' }}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── AI Button ───────────────────────────────────────────────────

function AIButton() {
  const router = useRouter();
  const { impact } = useHaptics();
  const open = useAIChatStore((s) => s.open);
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  const handlePress = useCallback(() => {
    impact();
    glow.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) }, () => {
      glow.value = withTiming(0, { duration: 400 });
    });
    open();
    router.push('/ai-chat');
  }, [impact, open, router, glow]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(glow.value, [0, 1], ['#1F2937', '#374151']),
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withSpring(0.88, { damping: 15 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15 });
      }}
      accessibilityRole="button"
      accessibilityLabel="AI Chat"
      style={[
        buttonStyle,
        {
          width: 42,
          height: 42,
          borderRadius: 21,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}>
      <Text style={{ fontSize: 18, color: '#FFFFFF' }}>✦</Text>
    </AnimatedPressable>
  );
}

// ─── Tab Bar ─────────────────────────────────────────────────────

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute bottom-0 left-0 right-0 items-center"
      style={{ paddingBottom: insets.bottom + 1 }}
      pointerEvents="box-none">
      <View className="flex-row items-center justify-center gap-3">
        {/* Main tab pill */}
        <View className="overflow-hidden rounded-[40px]">
          <BlurView
            intensity={40}
            tint="light"
            className="flex-row items-center gap-7 border border-black/[0.06] px-6 pb-2.5 pt-3"
            style={{ backgroundColor: 'rgba(255,255,255,0.75)' }}>
            {state.routes.map((route, index) => (
              <TabBarItem
                key={route.key}
                route={route}
                descriptor={descriptors[route.key]}
                isFocused={state.index === index}
                navigation={navigation}
              />
            ))}
          </BlurView>
        </View>

        {/* AI button — pushed to the right, separate from the pill */}
        <AIButton />
      </View>
    </View>
  );
}
