import { router } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  Image,
  TouchableOpacity,
  StatusBar,
  ViewStyle,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cards, onBoard1, onBoard2, onBoard3, onBoard4 } from '../assets/images';
import { Button } from '@/components/ui';

const { width, height } = Dimensions.get('window');

// Define TypeScript interfaces
interface OnboardingSlide {
  key: string;
  title: string;
  description: string;
  image: any;
  backgroundColor: string;
  textColor: string;
  indicatorBg: string;
  indicatorActiveBg: string;
  textSmall?: string;
  imageStyle?: {
    width: number;
    height: number;
  };
}

interface ViewableItemsChanged {
  viewableItems: {
    index: number;
    item: OnboardingSlide;
    key: string;
    isViewable: boolean;
  }[];
}

// --- Onboarding Data ---
// This array holds the content for each slide.
const onboardingSlides: OnboardingSlide[] = [
  {
    key: '1',
    title: 'Finance built\n for the internet generation.',
    description:
      'We’re flipping the script—no suits, no gatekeeping, just DeFi speed and TradFi clout. Your money, your rules.',
    image: onBoard1,
    backgroundColor: '#949FFF',
    textColor: 'text-[#1E1A3E]',
    indicatorBg: 'bg-white/30',
    indicatorActiveBg: 'bg-white',
    imageStyle: { width: width, height: height * 0.7 },
  },
  {
    key: '2',
    title: 'Top-Up\nIn A Blink',
    description:
      'Stablecoins on EVM & Solana hit your wallet faster than your ex’s apology. Zero waiting, all flexing.',
    image: onBoard2,
    backgroundColor: '#D4FF00',
    textColor: 'text-black',
    indicatorBg: 'bg-black/30',
    indicatorActiveBg: 'bg-black',
    imageStyle: { width: width, height: height * 0.7 },
  },
  {
    key: '3',
    title: 'Invest\nLike A Stan',
    description:
      'Pre-built baskets curated by the smartest nerds. Tech moonshots, eco glow-ups—pick your vibe, we’ll handle the rest.',
    image: onBoard3,
    backgroundColor: '#EAE8FF',
    textColor: 'text-[#1E1F4B]',
    indicatorBg: 'bg-slate-400/50',
    indicatorActiveBg: 'bg-slate-800',
    imageStyle: { width: width, height: height * 0.7 },
  },
  {
    key: '4',
    title: 'Swipe\nStack & Repeat',
    description:
      'Cop a card that rounds up every latte and yeets the spare change straight into your portfolio. Cash-back? More like bag-back.',
    image: onBoard4,
    backgroundColor: '#f39abe',
    textColor: 'text-[#fb088f]',
    indicatorBg: 'bg-slate-400/50',
    indicatorActiveBg: 'bg-slate-800',
    imageStyle: { width: width * 1.05, height: height * 0.7 }, // Different size for cards image
  },
];

const SLIDE_INTERVAL = 6000; // 4 seconds

// --- Main App Component ---
export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);

  // Mark that user has seen the welcome screen
  useEffect(() => {
    const setWelcomeFlag = async () => {
      try {
        await AsyncStorage.setItem('hasSeenWelcome', 'true');
      } catch (error) {
        console.error('Error setting welcome flag:', error);
      }
    };
    setWelcomeFlag();
  }, []);

  // --- Auto-scroll Logic ---
  useEffect(() => {
    const timer = setInterval(() => {
      // Move to the next slide, or loop back to the first
      const nextIndex = (currentIndex + 1) % onboardingSlides.length;
      flatListRef.current?.scrollToIndex({ animated: true, index: nextIndex });
      setCurrentIndex(nextIndex);
    }, SLIDE_INTERVAL);

    // Clear the interval when the component is unmounted or index changes
    return () => clearInterval(timer);
  }, [currentIndex]);

  // --- Handle scroll to update the current index ---
  const onViewableItemsChanged = useRef((info: ViewableItemsChanged) => {
    if (info.viewableItems.length > 0) {
      setCurrentIndex(info.viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  // --- Renders each slide item ---
  const renderItem = ({ item }: { item: OnboardingSlide }) => (
    <View
      className="h-full w-full flex-1  items-center overflow-hidden"
      style={{ width: width, backgroundColor: item.backgroundColor }}>
      <View className="w-full flex-1 items-start px-4 pt-24 ">
        <Text
          className={`tracking-wides w-full font-display font-black text-[30px] uppercase ${item.textColor}`}>
          {item.title}
        </Text>
        <Text className={`mt-4 max-w-xs font-caption text-base font-bold  opacity-80`}>
          {item.description}
        </Text>
      </View>

      <Image
        source={item.image}
        style={item.imageStyle}
        className="absolute -bottom-0 "
        resizeMode="cover"
        onError={(e) => console.log('Image failed to load', e.nativeEvent.error)}
      />
    </View>
  );

  // --- Renders the top progress indicators ---
  const renderIndicators = () => {
    const currentSlide = onboardingSlides[currentIndex];
    return (
      <View className="absolute left-6 right-6 top-16 flex-row space-x-2">
        {onboardingSlides.map((_, index) => (
          <View
            key={index}
            className={`h-1 flex-1 rounded-full ${index === currentIndex ? currentSlide.indicatorActiveBg : currentSlide.indicatorBg}`}>
            {index === currentIndex && (
              <View
                className={`h-1 rounded-full ${currentSlide.indicatorActiveBg}`}
                style={{ width: '100%' } as ViewStyle}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar
        barStyle={
          onboardingSlides[currentIndex].backgroundColor === '#D4FF00'
            ? 'dark-content'
            : 'light-content'
        }
      />
      <FlatList
        ref={flatListRef}
        data={onboardingSlides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        bounces={false}
        scrollEventThrottle={16}
        decelerationRate={0.85}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        onViewableItemsChanged={({ viewableItems }) => {
          if (viewableItems.length > 0 && viewableItems[0].index !== null) {
            setCurrentIndex(viewableItems[0].index);
          }
        }}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />
      {renderIndicators()}

      {/* --- "Get Started" Button --- */}
      <View className="absolute bottom-6  w-full gap-y-2 items-center px-6">
        <Button title="Create an account" variant="primary" onPress={() => router.push('/(auth)')} />
        <TouchableOpacity onPress={() => router.push('/(auth)/login-passcode')}>
          <Text className="text-center font-sf-pro-medium text-[14px] text-border-primary">
            Already have an account?
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
