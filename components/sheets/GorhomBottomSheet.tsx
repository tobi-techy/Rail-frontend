import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Dimensions, Keyboard, Platform, Pressable, StyleSheet } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHaptics } from '@/hooks/useHaptics';
import * as Haptics from 'expo-haptics';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const MAX_SNAP = Math.round(SCREEN_HEIGHT * 0.8);

interface GorhomBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  showCloseButton?: boolean;
  dismissible?: boolean;
}

export function GorhomBottomSheet({
  visible,
  onClose,
  children,
  showCloseButton = true,
  dismissible = true,
}: GorhomBottomSheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const { impact } = useHaptics();

  useEffect(() => {
    if (visible) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [visible]);

  const handleDismiss = useCallback(() => {
    Keyboard.dismiss();
    impact(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [impact, onClose]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior={dismissible ? 'close' : 'none'}
      />
    ),
    [dismissible]
  );

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      maxDynamicContentSize={MAX_SNAP}
      enablePanDownToClose={dismissible}
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.indicator}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize">
      <BottomSheetScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {showCloseButton && (
          <Pressable
            style={styles.closeButton}
            onPress={() => ref.current?.dismiss()}
            hitSlop={12}
            accessibilityLabel="Close"
            accessibilityRole="button">
            <HugeiconsIcon icon={Cancel01Icon} size={24} color="#757575" />
          </Pressable>
        )}
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  indicator: {
    backgroundColor: '#D1D5DB',
    width: 36,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  closeButton: {
    position: 'absolute',
    right: 24,
    top: 8,
    zIndex: 10,
    padding: 4,
  },
});
