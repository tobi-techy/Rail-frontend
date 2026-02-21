import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { Pressable, Dimensions, Modal, StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { X, ChevronLeft } from 'lucide-react-native';

const SPRING_CONFIG = { damping: 30, stiffness: 400, mass: 0.8 };

export interface BottomSheetScreen {
  id: string;
  title: string;
  subtitle?: string;
  component: React.ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

interface NavigableBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  screens: BottomSheetScreen[];
  initialScreenId?: string;
  showCloseButton?: boolean;
  dismissible?: boolean;
  navigation?: NavigableBottomSheetNavigation;
}

export interface NavigableBottomSheetNavigation {
  screenStack: string[];
  setScreenStack: React.Dispatch<React.SetStateAction<string[]>>;
  navigateTo: (screenId: string) => void;
  goBack: () => void;
  reset: (initialScreenId?: string) => void;
}

const getInitialStack = (initialScreenId?: string, screens: BottomSheetScreen[] = []): string[] => {
  if (initialScreenId) return [initialScreenId];
  if (screens.length > 0) return [screens[0].id];
  return [];
};

export function NavigableBottomSheet({
  visible,
  onClose,
  screens,
  initialScreenId,
  showCloseButton = true,
  dismissible = true,
  navigation,
}: NavigableBottomSheetProps) {
  const { height: screenHeight } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(screenHeight);
  const initialStack = useMemo(
    () => getInitialStack(initialScreenId, screens),
    [initialScreenId, screens]
  );
  const defaultScreenId = initialStack[0];
  const localNavigation = useNavigableBottomSheet(defaultScreenId);
  const { screenStack, setScreenStack, goBack, reset } = navigation ?? localNavigation;

  useEffect(() => {
    if (!defaultScreenId) {
      if (screenStack.length > 0) setScreenStack([]);
      return;
    }

    if (screenStack.length === 0) {
      setScreenStack([defaultScreenId]);
      return;
    }

    const currentId = screenStack[screenStack.length - 1];
    if (!screens.some((screen) => screen.id === currentId)) {
      setScreenStack([defaultScreenId]);
    }
  }, [defaultScreenId, screenStack, screens, setScreenStack]);

  const currentScreenId = screenStack[screenStack.length - 1];
  const currentScreen = screens.find((s) => s.id === currentScreenId);
  const canGoBack = screenStack.length > 1;

  const animateClose = useCallback(() => {
    translateY.value = withSpring(screenHeight, SPRING_CONFIG, () => {
      runOnJS(onClose)();
      runOnJS(reset)(defaultScreenId);
    });
  }, [defaultScreenId, onClose, reset, screenHeight, translateY]);

  const goToPreviousScreen = useCallback(() => {
    if (canGoBack) {
      const previousScreenId = screenStack[screenStack.length - 2];
      const previousScreen = screens.find((s) => s.id === previousScreenId);
      previousScreen?.onBackPress?.();
      goBack();
    }
  }, [canGoBack, goBack, screenStack, screens]);

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
    .enabled(dismissible && !canGoBack); // Disable swipe-to-close if we can go back

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible || !currentScreen) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={canGoBack ? goToPreviousScreen : dismissible ? animateClose : undefined}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismissible && !canGoBack ? animateClose : undefined}
          />
        </BlurView>

        <GestureDetector gesture={pan}>
          <Animated.View
            className="absolute bottom-6 left-3 right-3 rounded-[34px] bg-white px-6 pt-6"
            style={[sheetStyle, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            {/* Header with Navigation */}
            <View className="mb-6 flex-row items-center justify-between">
              {canGoBack ? (
                <Pressable
                  onPress={goToPreviousScreen}
                  className="p-1"
                  hitSlop={12}
                  accessibilityLabel="Back"
                  accessibilityRole="button">
                  <ChevronLeft size={24} color="#1F2937" />
                </Pressable>
              ) : (
                <View className="w-6" />
              )}

              <View className="flex-1 items-center">
                <Text className="text-center font-subtitle text-lg text-text-primary">
                  {currentScreen.title}
                </Text>
                {currentScreen.subtitle && (
                  <Text className="mt-1 text-center font-caption text-[13px] leading-4 text-gray-500">
                    {currentScreen.subtitle}
                  </Text>
                )}
              </View>

              {showCloseButton ? (
                <Pressable
                  className="p-1"
                  onPress={animateClose}
                  hitSlop={12}
                  accessibilityLabel="Close"
                  accessibilityRole="button">
                  <X size={24} color="#757575" />
                </Pressable>
              ) : (
                <View className="w-6" />
              )}
            </View>

            {/* Screen Content */}
            <View>{currentScreen.component}</View>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

export function useNavigableBottomSheet(initialScreenId?: string): NavigableBottomSheetNavigation {
  const [screenStack, setScreenStack] = useState<string[]>(() =>
    initialScreenId ? [initialScreenId] : []
  );

  const navigateTo = useCallback((screenId: string) => {
    setScreenStack((prev) => [...prev, screenId]);
  }, []);

  const goBack = useCallback(() => {
    setScreenStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const reset = useCallback(
    (nextInitialScreenId?: string) => {
      const seedScreenId = nextInitialScreenId ?? initialScreenId;
      setScreenStack((prev) => {
        const next = seedScreenId ? [seedScreenId] : [];
        const sameLength = prev.length === next.length;
        const sameValues = sameLength && prev.every((value, index) => value === next[index]);
        return sameValues ? prev : next;
      });
    },
    [initialScreenId]
  );

  return {
    screenStack,
    setScreenStack,
    navigateTo,
    goBack,
    reset,
  };
}
