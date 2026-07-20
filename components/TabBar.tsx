import React, { useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from '@/components/ui/GlassView';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useHaptics } from '@/hooks/useHaptics';
import { SPRING_PRESS } from '@/lib/motion';
import { playUISound } from '@/lib/uiSounds';

import { useMiriamIntro } from '@/stores/miriamIntro';
import { MiriamCharacter } from '@/components/ai';

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
    playUISound('buttonClick');
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

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.92, SPRING_PRESS);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_PRESS);
      }}
      hitSlop={8}
      style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }}>
      <Animated.View style={animatedStyle}>
        {options.tabBarIcon?.({
          focused: isFocused,
          color: isFocused ? '#ff3e00' : '#848281',
          size: 26,
        })}
      </Animated.View>
    </Pressable>
  );
}

// ─── AI Button ───────────────────────────────────────────────────

function AIButton() {
  const { impact } = useHaptics();
  const openIntro = useMiriamIntro((s) => s.open);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Miriam now lives on iMessage/WhatsApp — the tab button opens the connect
  // intro instead of the in-app chat.
  const handlePress = useCallback(() => {
    playUISound('buttonClick');
    impact();
    openIntro();
  }, [impact, openIntro]);

  return (
    <View style={{ alignItems: 'center' }}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => {
          scale.value = withSpring(0.9, SPRING_PRESS);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING_PRESS);
        }}
        hitSlop={8}
        accessibilityLabel="Miriam AI"
        accessibilityRole="button"
        style={{ width: 64, height: 64 }}>
        <Animated.View style={animatedStyle}>
          <MiriamCharacter size={64} emotion="happy" animate={true} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

// ─── Tab Bar ─────────────────────────────────────────────────────

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 4,
      }}
      pointerEvents="box-none">
      {/* Left: glass pill with tab icons */}
      <View style={{ borderRadius: 40, overflow: 'hidden' }}>
        <GlassView
          effect="clear"
          interactive
          fallbackColor="rgba(255,255,255,0.82)"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: 12,
            borderRadius: 40,
          }}>
          {state.routes.map((route, index) => (
            <TabBarItem
              key={route.key}
              route={route}
              descriptor={descriptors[route.key]}
              isFocused={state.index === index}
              navigation={navigation}
            />
          ))}
        </GlassView>
      </View>

      {/* Right: AI button */}
      <AIButton />
    </View>
  );
}
