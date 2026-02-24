import React, { useEffect, useCallback } from 'react';
import { Pressable, Dimensions, Modal, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { X } from 'lucide-react-native';

const SPRING_CONFIG = { damping: 30, stiffness: 400, mass: 0.8 };

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
  const { height: screenHeight } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(screenHeight);

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

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 100 || e.velocityY > 800) {
        runOnJS(animateClose)();
      } else {
        translateY.value = withSpring(0, SPRING_CONFIG);
      }
    })
    .enabled(dismissible);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
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
          <Pressable style={StyleSheet.absoluteFill} onPress={dismissible ? animateClose : undefined} />
        </BlurView>

        <GestureDetector gesture={pan}>
          <Animated.View
            className="absolute bottom-6 left-3 right-3 rounded-[34px] bg-white px-6 pt-6"
            style={[sheetStyle, { paddingBottom: Math.max(insets.bottom, 10) }]}>
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
