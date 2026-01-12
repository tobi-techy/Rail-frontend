import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

type TabBarProps = BottomTabBarProps & {
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
};

export function TabBar({
  state,
  descriptors,
  navigation,
  rightIcon,
  onRightIconPress,
}: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom + 10 }]} pointerEvents="box-none">
      <View style={styles.row}>
        <View style={styles.container}>
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
                  color: isFocused ? '#fff' : '#FFFFFF',
                  size: 28,
                })}
              </Pressable>
            );
          })}
        </View>

        {rightIcon && (
          <Pressable
            onPress={onRightIconPress}
            style={({ pressed }) => [styles.rightButton, pressed && styles.itemPressed]}>
            <BlurView intensity={80} tint="dark" style={styles.rightButtonBlur}>
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
    left: 20,
    right: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemPressed: {
    opacity: 0.6,
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
