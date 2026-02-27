import React, { useEffect, useCallback } from 'react';
import {
  Keyboard,
  Pressable,
  Modal,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { X } from 'lucide-react-native';
import { layout, responsive } from '@/utils/layout';

const SPRING_CONFIG = { damping: 30, stiffness: 400, mass: 0.8 };
const KB_SPRING = { damping: 22, stiffness: 280, mass: 0.8 };

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  showCloseButton?: boolean;
  dismissible?: boolean;
}

export function BottomSheet({
  visible,
  onClose,
  children,
  showCloseButton = true,
  dismissible = true,
}: BottomSheetProps) {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(screenHeight);
  const keyboardOffset = useSharedValue(0);
  const sheetBottomBase = layout.isSeekerDevice
    ? 14
    : responsive({ default: 24, tall: 20, android: 18 });
  const sheetSideInset = layout.isSeekerDevice
    ? 8
    : responsive({ default: 12, tall: 12, android: 10 });
  const sheetRadius = layout.isSeekerDevice
    ? 28
    : responsive({ default: 34, tall: 32, android: 30 });
  const sheetPaddingX = layout.isSeekerDevice
    ? 20
    : responsive({ default: 24, tall: 24, android: 22 });
  const sheetPaddingTop = layout.isSeekerDevice
    ? 20
    : responsive({ default: 24, tall: 22, android: 20 });

  const animateClose = useCallback(() => {
    translateY.value = withSpring(screenHeight, SPRING_CONFIG, () => {
      runOnJS(onClose)();
    });
  }, [onClose, screenHeight, translateY]);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, SPRING_CONFIG);
    }
  }, [visible, translateY]);

  // Track keyboard to lift the sheet
  useEffect(() => {
    if (!visible) return;

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (e) => {
      // Subtract bottom inset since the sheet already accounts for it
      keyboardOffset.value = withSpring(e.endCoordinates.height - insets.bottom, KB_SPRING);
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      keyboardOffset.value = withSpring(0, KB_SPRING);
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [visible, insets.bottom, keyboardOffset]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 96 || e.velocityY > 800) {
        runOnJS(animateClose)();
      } else {
        translateY.value = withSpring(0, SPRING_CONFIG);
      }
    })
    .enabled(dismissible);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    bottom: sheetBottomBase + keyboardOffset.value,
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismissible ? animateClose : undefined}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismissible ? animateClose : undefined}
          />
        </BlurView>

        <GestureDetector gesture={pan}>
          <Animated.View
            className="absolute bg-white"
            style={[
              sheetStyle,
              {
                left: sheetSideInset,
                right: sheetSideInset,
                borderRadius: sheetRadius,
                paddingHorizontal: sheetPaddingX,
                paddingTop: sheetPaddingTop,
                paddingBottom: Math.max(insets.bottom, 10),
              },
            ]}>
            {showCloseButton && (
              <Pressable
                className="absolute right-5 top-5 z-10 p-1"
                onPress={animateClose}
                hitSlop={12}
                accessibilityLabel="Close"
                accessibilityRole="button">
                <X size={24} color="#757575" />
              </Pressable>
            )}
            {children}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}
