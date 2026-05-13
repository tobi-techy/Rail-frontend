import React, { useState, useRef, useCallback } from 'react';
import { View, Text, Image, Dimensions, FlatList, Pressable } from 'react-native';
import { GorhomBottomSheet } from './GorhomBottomSheet';
import { Button } from '@/components/ui';
import * as WebBrowser from 'expo-web-browser';
import { virtualAccountService } from '@/api/services/virtualAccount.service';
import { logger } from '@/lib/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_WIDTH - 48; // padding

interface InvestmentDisclaimerSheetProps {
  visible: boolean;
  onAccept: () => void;
}

const slides = [
  {
    image: require('@/assets/images/onboard-slide-1.png'),
    title: 'Money Splits Automatically',
    description:
      'Every deposit is instantly split — 70% to Spend, 30% to Stash. No buttons, no decisions. Your money starts working the moment it arrives.',
  },
  {
    image: require('@/assets/images/onboard-slide-2.png'),
    title: 'Stash Earns Yield',
    description:
      'Your 30% stash earns yield automatically, backed by US Treasuries. No staking, no claiming — it just grows while you do nothing.',
  },
  {
    image: require('@/assets/images/onboard-slide-3.png'),
    title: 'Spend With Your Card',
    description:
      'Use your Rail card anywhere Visa is accepted. Round-ups from purchases go straight to your stash for extra growth.',
  },
  {
    image: require('@/assets/images/onboard-slide-4.png'),
    title: 'Investing Involves Risk',
    description:
      'The value of investments can go up or down. Rail does not provide financial advice. Past performance does not guarantee future results.',
  },
];

export function InvestmentDisclaimerSheet({ visible, onAccept }: InvestmentDisclaimerSheetProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const isLastSlide = activeIndex === slides.length - 1;

  const handleNext = useCallback(async () => {
    if (!isLastSlide) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
      setActiveIndex(activeIndex + 1);
    } else {
      setLoading(true);
      try {
        const res = await virtualAccountService.getTOSLink();
        const url = res?.tos_link;
        if (url) await WebBrowser.openAuthSessionAsync(url);
      } catch (error) {
        logger.warn('[Disclaimer] Failed to open Bridge TOS', {
          component: 'InvestmentDisclaimerSheet',
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setLoading(false);
        onAccept();
      }
    }
  }, [activeIndex, isLastSlide, onAccept]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems?.[0]) setActiveIndex(viewableItems[0].index ?? 0);
  }).current;

  return (
    <GorhomBottomSheet
      visible={visible}
      onClose={onAccept}
      showCloseButton={false}
      dismissible={false}>
      <View>
        <FlatList
          ref={flatListRef}
          data={slides}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <View style={{ width: SLIDE_WIDTH, alignItems: 'center' }}>
              <Image
                source={item.image}
                style={{ width: SLIDE_WIDTH, height: 220, borderRadius: 16 }}
                resizeMode="cover"
              />
              <Text className="mt-5 text-center font-subtitle text-[22px] text-charcoal-primary">
                {item.title}
              </Text>
              <Text className="mt-2 px-2 text-center font-body text-[15px] leading-[22px] text-graphite">
                {item.description}
              </Text>
            </View>
          )}
        />

        {/* Dots */}
        <View className="mt-5 flex-row items-center justify-center gap-2">
          {slides.map((_, i) => (
            <View
              key={i}
              className={`h-2 rounded-full ${i === activeIndex ? 'w-6 bg-charcoal-primary' : 'w-2 bg-ash/30'}`}
            />
          ))}
        </View>

        {/* Buttons */}
        <View className="mt-6 flex-row gap-3">
          {isLastSlide ? (
            <>
              <Pressable
                onPress={onAccept}
                className="flex-1 items-center justify-center rounded-full border border-ash/20 py-4">
                <Text className="font-button text-[15px] text-charcoal-primary">Maybe later</Text>
              </Pressable>
              <View className="flex-1">
                <Button
                  title={loading ? 'Opening…' : 'I Understand'}
                  onPress={handleNext}
                  disabled={loading}
                />
              </View>
            </>
          ) : (
            <View className="flex-1">
              <Button title="Next" onPress={handleNext} />
            </View>
          )}
        </View>
      </View>
    </GorhomBottomSheet>
  );
}
