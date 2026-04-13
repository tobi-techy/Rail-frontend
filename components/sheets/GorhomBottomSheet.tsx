import React, { useCallback, useEffect, useRef } from 'react';
import { Dimensions, Keyboard, Pressable, StyleSheet, View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

interface GorhomBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  showCloseButton?: boolean;
  dismissible?: boolean;
  scrollable?: boolean;
  snapPoints?: (string | number)[];
}

export function GorhomBottomSheet({
  visible,
  onClose,
  children,
  showCloseButton = true,
  dismissible = true,
  scrollable = true,
  snapPoints,
}: GorhomBottomSheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [visible]);

  const handleDismiss = useCallback(() => {
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

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

  const Wrapper = scrollable ? BottomSheetScrollView : BottomSheetView;

  return (
    <BottomSheetModal
      ref={ref}
      {...(snapPoints ? { snapPoints } : { enableDynamicSizing: true, maxDynamicContentSize: Dimensions.get('window').height * 0.8 })}
      enablePanDownToClose={dismissible}
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.indicator}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize">
      <Wrapper
        {...(scrollable
          ? {
              contentContainerStyle: { paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 16) },
              keyboardShouldPersistTaps: 'handled',
              showsVerticalScrollIndicator: false,
            }
          : { style: { paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 16) } })}>
        {showCloseButton && (
          <Pressable
            style={styles.closeButton}
            onPress={() => ref.current?.dismiss()}
            hitSlop={12}
            accessibilityLabel="Close"
            accessibilityRole="button">
            <HugeiconsIcon icon={Cancel01Icon} size={22} color="#9CA3AF" />
          </Pressable>
        )}
        {children}
      </Wrapper>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  indicator: {
    backgroundColor: '#D1D5DB',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 4,
    zIndex: 10,
    padding: 4,
  },
});
