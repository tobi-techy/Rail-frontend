import { router } from 'expo-router';
import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  useWindowDimensions,
  StatusBar,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
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

const SlideTitle = memo(function SlideTitle({
  item,
  topInset,
}: {
  item: OnboardingSlide;
  topInset: number;
}) {
  return (
    <View className="z-10 w-full px-5" style={{ paddingTop: topInset + 16 }}>
      <Text className="font-headline text-display-lg uppercase text-white">
        {item.titleTop} {item.titleBottom[0]} {item.titleBottom[1]}
      </Text>
    </View>
  );
});

const StaticSlide = memo(function StaticSlide({
  item,
  width,
  topInset,
}: {
  item: OnboardingSlide;
  width: number;
  topInset: number;
}) {
  return (
    <View className="flex-1 overflow-hidden bg-black" style={{ width }}>
      <SlideTitle item={item} topInset={topInset} />
    </View>
  );
});

// Active slide only: creates a single video player to avoid ExoPlayer OOM on Android.
const ActiveVideoSlide = memo(function ActiveVideoSlide({
  item,
  width,
  height,
  topInset,
}: {
  item: OnboardingSlide;
  width: number;
  height: number;
  topInset: number;
}) {
  const [firstFrameRendered, setFirstFrameRendered] = useState(false);
  const player = useVideoPlayer(item.video, (p) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    setFirstFrameRendered(false);
  }, [item.key]);

  useEffect(() => {
    const fallback = setTimeout(() => setFirstFrameRendered(true), 1500);
    player.play();
    return () => {
      clearTimeout(fallback);
      player.pause();
    };
  }, [item.key, player]);

  return (
    <View className="flex-1 overflow-hidden bg-black" style={{ width }}>
      {/* Video behind everything */}
      <VideoView
        player={player}
        style={{ width, height: height * 0.75, position: 'absolute', bottom: 0 }}
        contentFit="cover"
        nativeControls={false}
        onFirstFrameRender={() => setFirstFrameRendered(true)}
        useExoShutter={false}
      />

      {!firstFrameRendered && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            width,
            height: height * 0.75,
            backgroundColor: '#000000',
            zIndex: 5,
          }}
        />
      )}

      <SlideTitle item={item} topInset={topInset} />
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
  const isCompactWidth = width < 380;
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);
  const currentIndexRef = useRef(0);
  const progress = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { mutate: appleSignIn } = useAppleSignIn();
  const { showError } = useFeedbackPopup();

  const clampIndex = useCallback((index: number) => {
    return Math.min(onboardingSlides.length - 1, Math.max(0, index));
  }, []);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const rawIndex = Math.round(event.nativeEvent.contentOffset.x / Math.max(width, 1));
      const nextIndex = clampIndex(Number.isFinite(rawIndex) ? rawIndex : 0);
      if (nextIndex !== currentIndexRef.current) {
        setCurrentIndex(nextIndex);
      }
    },
    [clampIndex, width]
  );

  const onScrollToIndexFailed = useCallback(
    ({ index }: { index: number }) => {
      const safeIndex = clampIndex(Number.isFinite(index) ? index : 0);
      flatListRef.current?.scrollToOffset({ offset: safeIndex * width, animated: true });
      setCurrentIndex(safeIndex);
    },
    [clampIndex, width]
  );

  // Auto-advance with animated progress
  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: SLIDE_INTERVAL });

    timerRef.current = setTimeout(() => {
      const activeIndex = clampIndex(currentIndexRef.current);
      const nextIndex = (activeIndex + 1) % onboardingSlides.length;
      try {
        flatListRef.current?.scrollToIndex({ animated: true, index: nextIndex });
      } catch {
        flatListRef.current?.scrollToOffset({ offset: nextIndex * width, animated: true });
      }
    }, SLIDE_INTERVAL);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [clampIndex, currentIndex, progress, width]);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: OnboardingSlide; index: number }) =>
      index === currentIndex ? (
        <ActiveVideoSlide item={item} width={width} height={height} topInset={insets.top} />
      ) : (
        <StaticSlide item={item} width={width} topInset={insets.top} />
      ),
    [currentIndex, width, height, insets.top]
  );

  return (
    <ErrorBoundary>
      <View className="flex-1 bg-black">
        <StatusBar hidden />

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
          onMomentumScrollEnd={onMomentumScrollEnd}
          onScrollToIndexFailed={onScrollToIndexFailed}
          getItemLayout={getItemLayout}
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          windowSize={1}
          removeClippedSubviews
        />

        {/*<ProgressIndicator currentIndex={currentIndex} progress={progress} />*/}

        <View
          className="absolute left-1 right-1"
          style={{ bottom: Math.max(insets.bottom, 16) + 12 }}>
          <View
            style={{
              flexDirection: isCompactWidth ? 'column' : 'row',
              rowGap: isCompactWidth ? 10 : 0,
              columnGap: isCompactWidth ? 0 : 8,
            }}>
            <Button
              title="Sign Up with Apple"
              leftIcon={<AppleLogo width={24} height={24} />}
              size="large"
              flex={!isCompactWidth}
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
              flex={!isCompactWidth}
              onPress={() => router.push(ROUTES.AUTH.SIGNUP as any)}
              variant="orange"
            />
          </View>
        </View>
      </View>
    </ErrorBoundary>
  );
}
