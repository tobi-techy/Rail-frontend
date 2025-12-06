import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  Dimensions,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgIcon } from '../atoms/SvgIcon';

export interface SlideData {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradient: string[];
  ctaText: string;
  onPress?: () => void;
}

interface ActionSlideshowProps {
  slides?: SlideData[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  style?: ViewStyle;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_WIDTH - 44; // 32px padding on each side
const SLIDE_SPACING = 16;

const defaultSlides: SlideData[] = [
  {
    id: '1',
    title: 'Verify Your Identity',
    description: 'Complete KYC to unlock full trading features',
    icon: 'shield-person-6',
    gradient: ['#667EEA', '#764BA2'],
    ctaText: 'Verify Now',
  },
  {
    id: '2',
    title: 'Get Your Dollar Card',
    description: 'Physical or virtual card for global spending',
    icon: 'credit-card-8',
    gradient: ['#F093FB', '#F5576C'],
    ctaText: 'Get Card',
  },
  {
    id: '3',
    title: 'Copy Top Investors',
    description: 'Follow and replicate winning strategies',
    icon: 'data-exploration-20',
    gradient: ['#4FACFE', '#00F2FE'],
    ctaText: 'Explore',
  },
  {
    id: '4',
    title: 'Fund with Stablecoins',
    description: 'Top up using USDC or USDT instantly',
    icon: 'usdc-8',
    gradient: ['#43E97B', '#38F9D7'],
    ctaText: 'Fund Account',
  },
  {
    id: '5',
    title: 'Start Investing',
    description: 'Build your portfolio with US stocks',
    icon: 'pie-chart-15',
    gradient: ['#FA709A', '#FEE140'],
    ctaText: 'Invest Now',
  },
];

export const ActionSlideshow: React.FC<ActionSlideshowProps> = ({
  slides = defaultSlides,
  autoPlay = true,
  autoPlayInterval = 4000,
  style,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const autoPlayTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (autoPlay && slides.length > 1) {
      startAutoPlay();
    }

    return () => {
      if (autoPlayTimer.current) {
        clearInterval(autoPlayTimer.current);
      }
    };
  }, [autoPlay, currentIndex, slides.length]);

  const startAutoPlay = () => {
    if (autoPlayTimer.current) {
      clearInterval(autoPlayTimer.current);
    }

    autoPlayTimer.current = setInterval(() => {
      const nextIndex = (currentIndex + 1) % slides.length;
      scrollToIndex(nextIndex);
    }, autoPlayInterval);
  };

  const scrollToIndex = (index: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * (SLIDE_WIDTH + SLIDE_SPACING),
        animated: true,
      });
      setCurrentIndex(index);
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / (SLIDE_WIDTH + SLIDE_SPACING));
        setCurrentIndex(index);
      },
    }
  );

  const handleMomentumScrollEnd = () => {
    if (autoPlay) {
      startAutoPlay();
    }
  };

  const handleScrollBeginDrag = () => {
    if (autoPlayTimer.current) {
      clearInterval(autoPlayTimer.current);
    }
  };

  return (
    <View style={[{ paddingVertical: 6 }, style]}>
            {/* Pagination Dots */}
     <View className="flex-row  gap-4 pb-2">
        {slides.map((_, index) => {
          const inputRange = [
            (index - 1) * (SLIDE_WIDTH + SLIDE_SPACING),
            index * (SLIDE_WIDTH + SLIDE_SPACING),
            (index + 1) * (SLIDE_WIDTH + SLIDE_SPACING),
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <TouchableOpacity
              key={index}
              onPress={() => scrollToIndex(index)}
              activeOpacity={0.7}
            >
              <Animated.View
                style={{
                  width: dotWidth,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#000',
                  opacity,
                }}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        snapToInterval={SLIDE_WIDTH + SLIDE_SPACING}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={{
          // paddingHorizontal: 32,
          gap: SLIDE_SPACING,
        }}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
      >
        {slides.map((slide, index) => (
          <SlideCard
            key={slide.id}
            slide={slide}
            index={index}
            scrollX={scrollX}
          />
        ))}
      </ScrollView>
    </View>
  );
};

interface SlideCardProps {
  slide: SlideData;
  index: number;
  scrollX: Animated.Value;
}

const SlideCard: React.FC<SlideCardProps> = ({ slide, index, scrollX }) => {
  const inputRange = [
    (index - 1) * (SLIDE_WIDTH + SLIDE_SPACING),
    index * (SLIDE_WIDTH + SLIDE_SPACING),
    (index + 1) * (SLIDE_WIDTH + SLIDE_SPACING),
  ];

  const scale = scrollX.interpolate({
    inputRange,
    outputRange: [0.9, 1, 0.9],
    extrapolate: 'clamp',
  });

  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.6, 1, 0.6],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={{
        width: SLIDE_WIDTH,
        transform: [{ scale }],
      }}
    >
      <View className="p-6 h-[150px] bg-[#000] rounded-xl mt-1 flex-row items-center gap-4">
        {/* Content */}
        <View className="flex-1 justify-center pr-2">
          <Text className="text-2xl font-body-bold text-white mb-2">
            {slide.title}
          </Text>
          <Text className="text-base font-body-regular text-white/90 leading-5">
            {slide.description}
          </Text>
        </View>
        
        {/* Icon */}
        <View className="w-[80px] h-[80px] items-center justify-center">
          <SvgIcon
            name={slide.icon}
            width={80}
            height={80}
            color="white"
          />
        </View>
      </View>
    </Animated.View>
  );
};
