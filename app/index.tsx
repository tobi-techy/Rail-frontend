import { router } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  ViewStyle,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onBoard1, onBoard2, onBoard3, onBoard4 } from '../assets/images';
import { Button } from '@/components/ui';
import { Apple } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  key: string;
  titleTop: string;
  titleBottom: [string, string];
  description: string;
  video: any;
  backgroundColor: string;
  textColor: string;
  indicatorBg: string;
  indicatorActiveBg: string;
  videoStyle?: { width: number; height: number };
}

const onboardingSlides: OnboardingSlide[] = [
  {
    key: '1',
    titleTop: 'Drop it in.',
    titleBottom: ['Watch it', 'work.'],
    description:
      'Your money moves the second it lands. No buttons, no stress, no "what do I do now?" Just momentum.',
    video: onBoard1,
    backgroundColor: '#000',
    textColor: 'text-[#fff]',
    indicatorBg: 'bg-white/30',
    indicatorActiveBg: 'bg-white',
    videoStyle: { width: width, height: height * 0.7 },
  },
  {
    key: '2',
    titleTop: 'Fund it',
    titleBottom: ['however', 'you want.'],
    description:
      'Bank transfer, card, or digital dollars—pick your lane. Either way, it hits instantly.',
    video: onBoard2,
    backgroundColor: '#000',
    textColor: 'text-[#fff]',
    indicatorBg: 'bg-white/30',
    indicatorActiveBg: 'bg-black',
    videoStyle: { width: width, height: height * 0.7 },
  },
  {
    key: '3',
    titleTop: 'Grow',
    titleBottom: ['without', 'the grind.'],
    description:
      'Follow the pros or let the system cook. You never have to pretend you know what a P/E ratio is.',
    video: onBoard3,
    backgroundColor: '#000',
    textColor: 'text-[#fff]',
    indicatorBg: 'bg-slate-400/50',
    indicatorActiveBg: 'bg-slate-800',
    videoStyle: { width: width, height: height * 0.7 },
  },
  {
    key: '4',
    titleTop: 'Spend now.',
    titleBottom: ['Stack', 'forever.'],
    description:
      'Every swipe rounds up and invests the change. Your coffee habit is secretly building your future.',
    video: onBoard4,
    backgroundColor: '#000',
    textColor: 'text-[#fff]',
    indicatorBg: 'bg-slate-400/50',
    indicatorActiveBg: 'bg-slate-800',
    videoStyle: { width: width * 1.05, height: height * 0.7 },
  },
];

const SLIDE_INTERVAL = 6000;

function VideoSlide({ item }: { item: OnboardingSlide }) {
  const player = useVideoPlayer(item.video, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <View
      className="h-full w-full flex-1 items-center overflow-hidden"
      style={{ width: width, backgroundColor: item.backgroundColor }}>
      <View className="w-full flex-1 items-start px-4 pt-24">
        <View className="flex-row flex-wrap items-center">
          <Text className={`font-display text-[50px] font-black uppercase ${item.textColor}`}>
            {item.titleTop}{' '}
          </Text>
        </View>
        <View className="flex-row flex-wrap items-center">
          <Text className={`font-display text-[50px] font-black uppercase ${item.textColor}`}>
            {item.titleBottom[0]}{' '}
          </Text>
          <Text className={`font-display text-[50px] font-black uppercase ${item.textColor}`}>
            {' '}
            {item.titleBottom[1]}
          </Text>
        </View>
        <Text className="mt-4 font-body text-[14px] leading-5 text-white/80">
          {item.description}
        </Text>
      </View>
      <VideoView
        player={player}
        style={[item.videoStyle, { position: 'absolute', bottom: 0 }]}
        contentFit="cover"
        nativeControls={false}
      />
    </View>
  );
}

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: 50 }).current;

  useEffect(() => {
    const setWelcomeFlag = async () => {
      try {
        await AsyncStorage.setItem('hasSeenWelcome', 'true');
        setFontsReady(true);
      } catch (error) {
        console.error('Error setting welcome flag:', error);
        setFontsReady(true);
      }
    };
    setWelcomeFlag();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (currentIndex + 1) % onboardingSlides.length;
      flatListRef.current?.scrollToIndex({ animated: true, index: nextIndex });
      setCurrentIndex(nextIndex);
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [currentIndex]);

  if (!fontsReady) {
    return <View style={{ flex: 1, backgroundColor: '#949FFF' }} />;
  }

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
        renderItem={({ item }) => <VideoSlide item={item} />}
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
        viewabilityConfig={viewabilityConfigRef}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />
      {renderIndicators()}

      <View className="absolute bottom-12 w-full items-center gap-y-2 px-6">
        <Button
          title="Create an account"
          size="large"
          onPress={() => router.push('/(tabs)')}
          variant="black"
        />
      </View>
    </View>
  );
}
