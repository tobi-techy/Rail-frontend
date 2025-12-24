import React, { useEffect, useCallback } from 'react';
import { View, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

const SPRING_CONFIG = { damping: 25, stiffness: 300 };

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
  const overlayOpacity = useSharedValue(0);

  const animateClose = useCallback(() => {
    translateY.value = withSpring(screenHeight, SPRING_CONFIG, () => {
      runOnJS(onClose)();
    });
    overlayOpacity.value = withTiming(0, { duration: 200 });
  }, [onClose, screenHeight, translateY, overlayOpacity]);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, SPRING_CONFIG);
      overlayOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [visible, translateY, overlayOpacity]);

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

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  if (!visible) return null;

  return (
    <View className="absolute inset-0">
      <Animated.View className="absolute inset-0 bg-black/40" style={overlayStyle}>
        <Pressable className="flex-1" onPress={dismissible ? animateClose : undefined} />
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View
          className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-white px-6 pt-6"
          style={[sheetStyle, { paddingBottom: insets.bottom + 24 }]}>
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
    </View>
  );
}
