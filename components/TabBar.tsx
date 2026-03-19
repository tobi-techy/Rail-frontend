import React from 'react';
import { View, Text, Pressable } from 'react-native';
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
          color: isFocused ? '#FF2E01' : '#9CA3AF',
          size: 24,
        })}
        <Text
          className="font-body tracking-[0.2px]"
          style={{ fontSize: 10, color: isFocused ? '#FF2E01' : '#9CA3AF' }}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute bottom-0 left-0 right-0 items-center"
      style={{ paddingBottom: insets.bottom + 1 }}
      pointerEvents="box-none">
      <View className="flex-row items-center justify-center">
        <View className="overflow-hidden rounded-[40px]">
          <BlurView
            intensity={9}
            tint="default"
            className="flex-row items-center gap-7 px-6 pb-2.5 pt-3">
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
      </View>
    </View>
  );
}
