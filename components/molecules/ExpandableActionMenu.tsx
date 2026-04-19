import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';
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
        {/* White frosted glass */}
        <View style={StyleSheet.absoluteFill}>
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.6)' }]} />
        </View>

        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />

        {/* Close */}
        <Animated.View entering={FadeIn.duration(200)} style={[styles.closeBtn, { top: insets.top + 12 }]}>
          <Pressable onPress={() => setOpen(false)} hitSlop={12}>
            <HugeiconsIcon icon={Cancel01Icon} size={22} color="#1A1A1A" />
          </Pressable>
        </Animated.View>

        {/* Menu items */}
        <View style={[styles.menuContainer, { paddingBottom: insets.bottom + 40 }]}>
          {items.map((item, i) => (
            <Animated.View key={item.id} entering={FadeInRight.delay(i * 60).duration(250)}>
              <Pressable onPress={() => handleItem(item)} style={styles.menuItem}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <HugeiconsIcon icon={item.icon} size={24} color={item.iconColor} />
              </Pressable>
            </Animated.View>
          ))}
        </View>
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
    zIndex: 10,
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    gap: 28,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuLabel: {
    fontFamily: 'SFProDisplay-Semibold',
    fontSize: 20,
    color: '#1A1A1A',
  },
});
