import React, { useCallback, useEffect, useRef } from 'react';
import { Dimensions, Keyboard, Pressable, View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Cancel01Icon } from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';

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
      backgroundStyle={{ backgroundColor: '#fbfaf9', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
      handleIndicatorStyle={{ backgroundColor: '#c6c6c6', width: 36, height: 4, borderRadius: 2, marginTop: 8 }}
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
            className="absolute right-5 top-1 z-10 p-1"
            onPress={() => ref.current?.dismiss()}
            hitSlop={12}
            accessibilityLabel="Close"
            accessibilityRole="button">
            <HugeiconsIcon icon={Cancel01Icon} size={22} color="#848281" />
          </Pressable>
        )}
        {children}
      </Wrapper>
    </BottomSheetModal>
  );
}
