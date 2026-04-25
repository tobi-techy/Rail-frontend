import React, { useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useHaptics } from '@/hooks/useHaptics';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { useAIChatStore } from '@/stores/aiChatStore';
import { MiriamCharacter } from '@/components/ai';

const ACCENT = '#FF2E01';

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

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.85, { damping: 15 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15 });
      }}
      hitSlop={8}
      style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }}>
      <Animated.View style={animatedStyle}>
        {options.tabBarIcon?.({
          focused: isFocused,
          color: isFocused ? '#FF2E01' : '#8C8C8C',
          size: 26,
        })}
      </Animated.View>
    </Pressable>
  );
}

// ─── AI Button (Miriam) ─────────────────────────────────────────

function AIButton() {
  const router = useRouter();
  const { impact } = useHaptics();
  const open = useAIChatStore((s) => s.open);
  const { requireFeature } = useFeatureGate();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: '#FFFFFF',
  }));

  const handlePress = useCallback(() => {
    impact();
    requireFeature(
      () => {
        open();
        router.push('/ai-chat');
      },
      {
        onProfileRequired: () => router.push('/complete-profile/personal-info'),
        onKycRequired: () => router.push('/kyc'),
      }
    );
  }, [impact, open, router, requireFeature]);

  return (
    <View>
      <Pressable
        onPress={handlePress}
        onPressIn={() => {
          scale.value = withSpring(0.88, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
        hitSlop={8}
        accessibilityLabel="Miriam AI"
        accessibilityRole="button"
        style={{ width: 64, height: 64 }}>
          <MiriamCharacter size={64} emotion="sad" animate={true} />
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
      {/* Left: blurred pill with tab icons */}
      <View style={{ borderRadius: 40, overflow: 'hidden' }}>
        <BlurView
          intensity={40}
          tint="light"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: 12,
            backgroundColor: 'rgba(255,255,255,0.75)',
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.06)',
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
        </BlurView>
      </View>

      {/* Right: AI button */}
      <AIButton />
    </View>
  );
}
