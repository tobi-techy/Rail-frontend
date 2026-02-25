import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useHaptics } from '@/hooks/useHaptics';

type TabBarProps = BottomTabBarProps & {
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  rightIconAccessibilityLabel?: string;
};

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
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.85, { damping: 15 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15 });
      }}
      style={styles.item}>
      <Animated.View style={animatedStyle}>
        {options.tabBarIcon?.({
          focused: isFocused,
          color: isFocused ? '#FF2E01' : '#ccc',
          size: 28,
        })}
      </Animated.View>
    </Pressable>
  );
}

export function TabBar({
  state,
  descriptors,
  navigation,
  rightIcon,
  onRightIconPress,
  rightIconAccessibilityLabel,
}: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { impact } = useHaptics();

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom + 1 }]} pointerEvents="box-none">
      <View style={styles.row}>
        <View style={styles.container}>
          <BlurView intensity={40} tint="light" style={styles.blur}>
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

        {rightIcon && (
          <Pressable
            onPress={() => {
              impact();
              onRightIconPress?.();
            }}
            style={styles.rightButton}
            accessibilityRole="button"
            accessibilityLabel={rightIconAccessibilityLabel}
            accessibilityState={{ disabled: !onRightIconPress }}>
            <BlurView intensity={80} tint="light" style={styles.rightButtonBlur}>
              {rightIcon}
            </BlurView>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    borderRadius: 40,
    overflow: 'hidden',
  },
  blur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightButton: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  rightButtonBlur: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    overflow: 'hidden',
  },
});
