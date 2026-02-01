import { router } from 'expo-router';
import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { View, Text, FlatList, Dimensions, StatusBar, ViewToken } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { onBoard1, onBoard2, onBoard3, onBoard4 } from '../assets/images';
import { Button } from '@/components/ui';
import { SharedValue, useSharedValue, useAnimatedStyle, withTiming, interpolate, Extrapolation } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  key: string;
  titleTop: string;
  titleBottom: [string, string];
  description: string;
  video: any;
}

const onboardingSlides: OnboardingSlide[] = [
  {
    key: '1',
    titleTop: 'Drop it in.',
    titleBottom: ['Watch it', 'work.'],
    description:
      'Your money moves the second it lands. No buttons, no stress, no "what do I do now?" Just momentum.',
    video: onBoard1,
  },
  {
    key: '2',
    titleTop: 'Fund it',
    titleBottom: ['however', 'you want.'],
    description:
      'Bank transfer, card, or digital dollars—pick your lane. Either way, it hits instantly.',
    video: onBoard2,
  },
  {
    key: '3',
    titleTop: 'Grow',
    titleBottom: ['without', 'the grind.'],
    description:
      'Follow the pros or let the system cook. You never have to pretend you know what a P/E ratio is.',
    video: onBoard3,
  },
  {
    key: '4',
    titleTop: 'Spend now.',
    titleBottom: ['Stack', 'forever.'],
    description:
      'Every swipe rounds up and invests the change. Your coffee habit is secretly building your future.',
    video: onBoard4,
  },
];

const SLIDE_INTERVAL = 6000;
const VIDEO_STYLE = { width, height: height * 0.7 };

// Memoized video slide - only re-renders when isActive changes
const VideoSlide = memo(function VideoSlide({
  item,
  isActive,
}: {
  item: OnboardingSlide;
  isActive: boolean;
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
    <View className="flex-1 items-center overflow-hidden bg-black" style={{ width }}>
      <View className="w-full flex-1 px-4 pt-24">
        <Text className="font-display text-[50px] font-black uppercase text-white">
          {item.titleTop}
        </Text>
        <Text className="font-display text-[50px] font-black uppercase text-white">
          {item.titleBottom[0]} {item.titleBottom[1]}
        </Text>
        <Text className="mt-4 font-body text-[14px] leading-5 text-white/80">
          {item.description}
        </Text>
      </View>
      <VideoView
        player={player}
        style={[VIDEO_STYLE, { position: 'absolute', bottom: 0 }]}
        contentFit="cover"
        nativeControls={false}
      />
    </View>
  );
});

// Animated progress indicator
function ProgressIndicator({
  currentIndex,
  progress,
}: {
  currentIndex: number;
  progress: SharedValue<number>;
}) {
  return (
    <View className="absolute left-6 right-6 top-16 flex-row gap-x-2">
      {onboardingSlides.map((_, index) => (
        <IndicatorBar key={index} index={index} currentIndex={currentIndex} progress={progress} />
      ))}
    </View>
  );
}

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);
  const progress = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  }, [currentIndex]);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    []
  );

  const renderItem = useCallback(
    ({ item, index }: { item: OnboardingSlide; index: number }) => (
      <VideoSlide item={item} isActive={index === currentIndex} />
    ),
    [currentIndex]
  );

  return (
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

      <ProgressIndicator currentIndex={currentIndex} progress={progress} />

      <View className="absolute bottom-12 w-full gap-y-2 px-6">
        <View className="flex-row gap-x-3">
          <Button
            title="Sign Up with Apple"
            size="large"
            onPress={() => router.push('/(auth)/signin')}
            variant="black"
          />
          <Button
            title="Continue with Mail"
            size="large"
            onPress={() => router.push('/(auth)/signin')}
            variant="orange"
          />
        </View>
      </View>
    </View>
  );
}
