import React, { useEffect, useState } from 'react';
import { View, Text, Image, Dimensions, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GorhomBottomSheet } from '@/components/sheets/GorhomBottomSheet';
import { Button } from '@/components/ui';
import { useButtonFeedback } from '@/hooks/useButtonFeedback';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SEEN_KEY = '@miriam_intro_seen_v1';

interface Props {
  /** Called when user clicks "Get Started" or "Skip for later". */
  onDismiss: () => void;
}

/**
 * One-time intro sheet that introduces Miriam to new users.
 * Shown once on first mount — subsequent mounts are no-ops.
 * Similar pattern to InvestmentDisclaimerSheet.
 */
export function MiriamIntroSheet({ onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  const triggerFeedback = useButtonFeedback();

  useEffect(() => {
    AsyncStorage.getItem(SEEN_KEY).then((v) => {
      if (!v) setVisible(true);
    });
  }, []);

  const dismiss = async () => {
    await AsyncStorage.setItem(SEEN_KEY, '1');
    setVisible(false);
    onDismiss();
  };

  return (
    <GorhomBottomSheet
      visible={visible}
      onClose={dismiss}
      showCloseButton={false}
      dismissible={false}
      scrollable={false}>
      <View>
        {/* Edge-to-edge image */}
        <View style={{ marginHorizontal: -20, marginTop: -8 }}>
          <Image
            source={require('@/assets/images/onboard-slide-2.jpg')}
            style={{ width: SCREEN_WIDTH, height: 260 }}
            resizeMode="cover"
          />
        </View>

        {/* Title — strongest element in the hierarchy */}
        <Text className="mt-5 font-subtitle text-[20px] text-charcoal-primary">
          Meet Miriam, your money co-pilot
        </Text>

        {/* Description — secondary, body weight, muted color */}
        <Text className="mt-3 font-body text-[15px] leading-[23px] text-graphite">
          Say &quot;Hey Miriam&quot; anytime. She tracks your spending, warns you about shortfalls,
          and quietly moves money to Stash when it&apos;s safe — always with your permission.
        </Text>

        {/* Buttons — clear CTA hierarchy */}
        <View className="mt-6 flex-row gap-3">
          <Pressable
            onPress={() => {
              triggerFeedback();
              dismiss();
            }}
            className="flex-1 items-center justify-center rounded-full bg-ash/10 py-4 active:scale-[0.96]">
            <Text className="font-button text-[15px] text-charcoal-primary">Skip for later</Text>
          </Pressable>
          <View className="flex-1">
            <Button title="Get started" onPress={dismiss} />
          </View>
        </View>
      </View>
    </GorhomBottomSheet>
  );
}
