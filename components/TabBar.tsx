import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom + 10 }]} pointerEvents="box-none">
      <BlurView intensity={5} style={styles.container}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}>
              {options.tabBarIcon?.({
                focused: isFocused,
                color: isFocused ? '#000000' : '#9CA3AF', // Black active, Grey inactive
                size: 28,
              })}
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 0,
    alignItems: 'flex-start',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 40,
    overflow: 'hidden',
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemPressed: {
    opacity: 0.6,
  },
});
