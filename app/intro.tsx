import { router } from 'expo-router';
import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { View, Text, FlatList, StatusBar, ViewToken, useWindowDimensions } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { onBoard1, onBoard2, onBoard3, onBoard4 } from '../assets/images';
import { AppleLogo } from '../assets/svg';
import { Button } from '@/components/ui';
import Animated, {
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAppleSignIn } from '@/api/hooks/useAuth';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { ROUTES } from '@/constants/routes';
import { getPostAuthRoute } from '@/utils/onboardingFlow';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface OnboardingSlide {
  key: string;
  titleTop: string;
  titleBottom: [string, string];
  video: any;
}

const onboardingSlides: OnboardingSlide[] = [
  {
    key: '1',
    titleTop: 'Start small.',
    titleBottom: ['Grow', 'big.'],
    video: onBoard1,
  },
  {
    key: '2',
    titleTop: 'Add money',
    titleBottom: ['in', 'seconds.'],
    video: onBoard2,
  },
  {
    key: '3',
    titleTop: 'Investing',
    titleBottom: ['made', 'easy.'],
    video: onBoard3,
  },
  {
    key: '4',
    titleTop: 'Spend.',
    titleBottom: ['Save.', 'Repeat.'],
    video: onBoard4,
  },
];

const SLIDE_INTERVAL = 6000;

// Memoized video slide - only re-renders when isActive changes
const VideoSlide = memo(function VideoSlide({
  item,
  isActive,
  width,
  height,
  topInset,
}: {
  item: OnboardingSlide;
  isActive: boolean;
  width: number;
  height: number;
  topInset: number;
}) {
  const player = useVideoPlayer(item.video, (p) => {
    p.loop = true;
    p.muted = true;
  });

  // Play/pause based on visibility
  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  return (
    <View className="flex-1 overflow-hidden bg-black" style={{ width }}>
      {/* Video behind everything */}
      <VideoView
        player={player}
        style={{ width, height: height * 0.75, position: 'absolute', bottom: 0 }}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Text content — pinned to top with safe area */}
      <View className="z-10 w-full px-5" style={{ paddingTop: topInset + 16 }}>
        <Text className="font-headline text-display-lg uppercase text-white">
          {item.titleTop} {item.titleBottom[0]} {item.titleBottom[1]}
        </Text>
      </View>
    </View>
  );
});

const IndicatorBar = memo(function IndicatorBar({
  index,
  currentIndex,
  progress,
}: {
  index: number;
  currentIndex: number;
  progress: SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    if (index < currentIndex) {
      return { width: '100%' };
    }
    if (index === currentIndex) {
      return {
        width: `${interpolate(progress.value, [0, 1], [0, 100], Extrapolation.CLAMP)}%`,
      };
    }
    return { width: '0%' };
  });

  return (
    <View className="h-1 flex-1 rounded-full bg-white/30">
      <Animated.View className="h-1 rounded-full bg-white" style={animatedStyle} />
    </View>
  );
});

export default function App() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);
  const progress = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { mutate: appleSignIn } = useAppleSignIn();
  const { showError } = useFeedbackPopup();

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  // Auto-advance with animated progress
  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: SLIDE_INTERVAL });

    timerRef.current = setTimeout(() => {
      const nextIndex = (currentIndex + 1) % onboardingSlides.length;
      flatListRef.current?.scrollToIndex({ animated: true, index: nextIndex });
    }, SLIDE_INTERVAL);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, progress]);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: OnboardingSlide; index: number }) => (
      <VideoSlide
        item={item}
        isActive={index === currentIndex}
        width={width}
        height={height}
        topInset={insets.top}
      />
    ),
    [currentIndex, width, height, insets.top]
  );

  return (
    <ErrorBoundary>
      <View className="flex-1 bg-black">
        <StatusBar barStyle="light-content" />

        <FlatList
          ref={flatListRef}
          data={onboardingSlides}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          bounces={false}
          scrollEventThrottle={32}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={getItemLayout}
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          windowSize={3}
          removeClippedSubviews
        />

        {/*<ProgressIndicator currentIndex={currentIndex} progress={progress} />*/}

        <View
          className="absolute left-1 right-1"
          style={{ bottom: Math.max(insets.bottom, 16) + 12 }}>
          <View className="flex-row gap-x-2">
            <Button
              title="Sign Up with Apple"
              leftIcon={<AppleLogo width={24} height={24} />}
              size="large"
              onPress={() => {
                appleSignIn(undefined, {
                  onSuccess: (resp) => {
                    const targetRoute = getPostAuthRoute(resp.user?.onboardingStatus);
                    router.replace(targetRoute as any);
                  },
                  onError: () => {
                    showError('Apple Sign-In Failed', 'Please try again or use email sign in.');
                  },
                });
              }}
              variant="white"
            />
            <Button
              title="Continue with Mail"
              size="large"
              onPress={() => router.push(ROUTES.AUTH.SIGNUP as any)}
              variant="orange"
            />
          </View>
        </View>
      </View>
    </ErrorBoundary>
  );
}
