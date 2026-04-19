import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { MoreHorizontalIcon, Cancel01Icon } from '@hugeicons/core-free-icons';
import type { HugeiconsProps } from '@hugeicons/react-native';
import { useHaptics } from '@/hooks/useHaptics';

type HugeIconType = HugeiconsProps['icon'];

interface MenuItem {
  id: string;
  label: string;
  icon: HugeIconType;
  iconColor: string;
  onPress: () => void;
}

interface Props {
  items: MenuItem[];
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ExpandableActionMenu({ items }: Props) {
  const [open, setOpen] = useState(false);
  const { impact } = useHaptics();
  const rotation = useSharedValue(0);

  const toggle = () => {
    impact();
    setOpen((v) => !v);
    rotation.value = withSpring(open ? 0 : 1, { damping: 15 });
  };

  const handleItem = (item: MenuItem) => {
    impact();
    setOpen(false);
    rotation.value = withSpring(0, { damping: 15 });
    item.onPress();
  };

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 45}deg` }],
  }));

  return (
    <View style={styles.container}>
      {/* Backdrop */}
      {open && (
        <Pressable style={StyleSheet.absoluteFill} onPress={toggle}>
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(100)}
            style={styles.backdrop}
          />
        </Pressable>
      )}

      {/* Menu items */}
      {open && (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)} style={styles.menu}>
          {items.map((item, i) => (
            <AnimatedPressable
              key={item.id}
              entering={FadeIn.delay(i * 40).duration(200)}
              onPress={() => handleItem(item)}
              style={styles.menuItem}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <View style={[styles.menuIcon, { backgroundColor: item.iconColor + '15' }]}>
                <HugeiconsIcon icon={item.icon} size={20} color={item.iconColor} />
              </View>
            </AnimatedPressable>
          ))}
        </Animated.View>
      )}

      {/* FAB */}
      <Pressable onPress={toggle} style={[styles.fab, open && styles.fabOpen]}>
        <Animated.View style={iconStyle}>
          <HugeiconsIcon
            icon={open ? Cancel01Icon : MoreHorizontalIcon}
            size={22}
            color={open ? '#FFFFFF' : '#000000'}
          />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    alignItems: 'flex-end',
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menu: {
    marginBottom: 12,
    alignItems: 'flex-end',
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  menuLabel: {
    fontFamily: 'SFProDisplay-Semibold',
    fontSize: 16,
    color: '#1A1A1A',
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  fabOpen: {
    backgroundColor: '#1A1A1A',
  },
});
