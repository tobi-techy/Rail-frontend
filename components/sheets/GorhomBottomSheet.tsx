import React, { useCallback, useEffect, useRef } from 'react';
import { Dimensions, Keyboard, Pressable, StyleSheet, View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps, BottomSheetBackgroundProps } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '@/utils/platformHaptics';
import { Cancel01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import { GlassView } from '@/components/ui/GlassView';
import { BlurView } from 'expo-blur';
import { playUISound } from '@/lib/uiSounds';
import { useUIStore } from '@/stores';

interface GorhomBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  showCloseButton?: boolean;
  dismissible?: boolean;
  scrollable?: boolean;
  snapPoints?: (string | number)[];
  glassBackground?: boolean;
  /**
   * How this modal behaves when presented over another. Default `'switch'`
   * minimizes the modal below it — which breaks a sheet nested inside another
   * sheet's content (the parent unmounts our children). Use `'push'` to stack
   * on top and keep the parent mounted. See CurrencySelectorPill.
   */
  stackBehavior?: 'push' | 'replace' | 'switch';
  /**
   * Called after the dismiss animation completes. Use this for post-dismiss
   * actions like navigation — it fires once the sheet is fully off-screen.
   */
  onAfterDismiss?: () => void;
}

function GlassBackground({ style }: BottomSheetBackgroundProps) {
  return (
    <GlassView
      effect="regular"
      white
      fallbackColor="rgba(255,255,255,0.97)"
      style={[style, { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }]}
    />
  );
}

export function GorhomBottomSheet({
  visible,
  onClose,
  children,
  showCloseButton = true,
  dismissible = true,
  scrollable = true,
  snapPoints,
  glassBackground = false,
  stackBehavior,
  onAfterDismiss,
}: GorhomBottomSheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const hapticsEnabled = useUIStore((s) => s.hapticsEnabled);

  useEffect(() => {
    if (visible) {
      ref.current?.present();
      // Subtle confirmation as the sheet rises.
      if (hapticsEnabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      playUISound('buttonClick');
    } else {
      ref.current?.dismiss();
    }
  }, [visible, hapticsEnabled]);

  const handleDismiss = useCallback(() => {
    Keyboard.dismiss();
    playUISound('buttonClick');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    onAfterDismiss?.();
  }, [onClose, onAfterDismiss]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <View style={StyleSheet.absoluteFill}>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
          pressBehavior={dismissible ? 'close' : 'none'}
        />
      </View>
    ),
    [dismissible]
  );

  const Wrapper = scrollable ? BottomSheetScrollView : BottomSheetView;

  return (
    <BottomSheetModal
      ref={ref}
      {...(snapPoints
        ? { snapPoints }
        : {
            enableDynamicSizing: true,
            maxDynamicContentSize: Dimensions.get('window').height * 0.8,
          })}
      enablePanDownToClose={dismissible}
      {...(stackBehavior ? { stackBehavior } : {})}
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      {...(glassBackground
        ? {
            backgroundComponent: GlassBackground,
            backgroundStyle: { backgroundColor: 'transparent' },
          }
        : {
            backgroundStyle: {
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            },
          })}
      handleIndicatorStyle={{
        backgroundColor: '#c6c6c6',
        width: 36,
        height: 4,
        borderRadius: 2,
        marginTop: 8,
      }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize">
      <Wrapper
        {...(scrollable
          ? {
              contentContainerStyle: {
                paddingHorizontal: 20,
                paddingBottom: Math.max(insets.bottom, 16),
              },
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
