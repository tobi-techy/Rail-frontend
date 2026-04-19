import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOut, FadeInRight } from 'react-native-reanimated';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { MoreHorizontalIcon, Cancel01Icon } from '@hugeicons/core-free-icons';
import type { HugeiconsProps } from '@hugeicons/react-native';
import { useHaptics } from '@/hooks/useHaptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

export function ExpandableActionMenu({ items }: Props) {
  const [open, setOpen] = useState(false);
  const { impact } = useHaptics();
  const insets = useSafeAreaInsets();

  const handleItem = (item: MenuItem) => {
    impact();
    setOpen(false);
    setTimeout(() => item.onPress(), 150);
  };

  return (
    <>
      <Pressable
        onPress={() => { impact(); setOpen(true); }}
        style={styles.trigger}>
        <HugeiconsIcon icon={MoreHorizontalIcon} size={20} color="#000" />
      </Pressable>

      <Modal visible={open} transparent animationType="fade">
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />

          {/* Close button */}
          <Animated.View entering={FadeIn.duration(200)} style={[styles.closeBtn, { top: insets.top + 12 }]}>
            <Pressable onPress={() => setOpen(false)} hitSlop={12}>
              <HugeiconsIcon icon={Cancel01Icon} size={22} color="#FFF" />
            </Pressable>
          </Animated.View>

          {/* Menu items — bottom aligned */}
          <View style={[styles.menuContainer, { paddingBottom: insets.bottom + 40 }]}>
            {items.map((item, i) => (
              <Animated.View
                key={item.id}
                entering={FadeInRight.delay(i * 60).duration(250)}>
                <Pressable
                  onPress={() => handleItem(item)}
                  style={styles.menuItem}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <View style={[styles.menuIcon, { backgroundColor: item.iconColor }]}>
                    <HugeiconsIcon icon={item.icon} size={22} color="#FFF" />
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </BlurView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuLabel: {
    fontFamily: 'SFProDisplay-Semibold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
