import React, { useCallback, useMemo, useState } from 'react';
import { StatusBar, Text, Pressable, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  SlideInUp,
  FadeIn,
} from 'react-native-reanimated';
import { PaymentModal, usePaymentModal } from '@chainrails/react-native';
import { useChainRailsSession } from '@/api/hooks/useChainRails';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Keypad } from '@/components/molecules/Keypad';
import { Button } from '@/components/ui';
import { AnimatedAmount } from '@/app/withdraw/method-screen/AnimatedAmount';
import { normalizeAmount } from '@/app/withdraw/method-screen/utils';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

const BRAND_COLOR = '#FF2E01';
const MAX_INTEGER_DIGITS = 7;

export default function FundCrosschainScreen() {
  const insets = useSafeAreaInsets();
  const [rawAmount, setRawAmount] = useState('0');
  const [loading, setLoading] = useState(false);
  const crSessionMutation = useChainRailsSession();

  const cr = usePaymentModal({
    sessionToken: null,
    onSuccess: () => router.back(),
    onCancel: () => {},
  });

  const numericAmount = useMemo(() => {
    const n = parseFloat(rawAmount);
    return isFinite(n) ? n : 0;
  }, [rawAmount]);

  const displayAmount = useMemo(() => {
    const normalized = rawAmount || '0';
    const hasDecimal = normalized.includes('.');
    const [intRaw, dec = ''] = normalized.split('.');
    const intPart = intRaw.replace(/^0+(?=\d)/, '') || '0';
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return hasDecimal ? `${grouped}.${dec}` : grouped;
  }, [rawAmount]);

  const onKeyPress = useCallback((key: string) => {
    setRawAmount((cur) => {
      if (key === 'backspace') return cur === '0' ? cur : normalizeAmount(cur.slice(0, -1));
      if (key === 'decimal') return cur.includes('.') ? cur : `${cur}.`;
      if (!/^\d$/.test(key)) return cur;
      if (cur.includes('.')) {
        const [int, dec = ''] = cur.split('.');
        return dec.length >= 2 ? cur : `${int}.${dec}${key}`;
      }
      const next = (cur === '0' ? key : `${cur}${key}`).replace(/^0+(?=\d)/, '') || '0';
      return next.length > MAX_INTEGER_DIGITS ? cur : next;
    });
  }, []);

  // TODO: ChainRails PaymentModal renders blank on iOS (SDK bug).
  // Blocked on @chainrails/react-native fix. Once resolved, remove
  // the early return and uncomment the cr.updateSession + cr.open flow.
  const onContinue = useCallback(async () => {
    if (numericAmount <= 0) return;
    setLoading(true);
    try {
      const session = await crSessionMutation.mutateAsync(rawAmount);
      cr.updateSession({ ...session, amount: rawAmount });
      cr.open();
    } catch (e) {
      console.error('ChainRails session failed:', e);
    } finally {
      setLoading(false);
    }
  }, [numericAmount, rawAmount, crSessionMutation, cr]);

  const keypadTranslateY = useSharedValue(60);
  React.useEffect(() => {
    keypadTranslateY.value = withSpring(0, { damping: 18, stiffness: 120 });
  }, []);
  const keypadStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: keypadTranslateY.value }],
  }));

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1" style={{ backgroundColor: BRAND_COLOR }} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={BRAND_COLOR} />
        <View className="flex-1 px-5">
          <Animated.View
            entering={FadeIn.duration(400)}
            className="flex-row items-center justify-between pb-2 pt-1">
            <Pressable
              className="size-11 items-center justify-center rounded-full bg-white/20"
              onPress={() => router.back()}>
              <HugeiconsIcon icon={Cancel01Icon} size={20} color="#FFFFFF" />
            </Pressable>
            <Text className="font-subtitle text-[20px] text-white">Cross-Chain Deposit</Text>
            <View className="size-11" />
          </Animated.View>
          <View className="flex-1 items-center justify-center px-2">
            <Text className="font-body text-[13px] text-white/80">Enter deposit amount (USD)</Text>
            <View className="mt-2">
              <AnimatedAmount amount={displayAmount} />
            </View>
          </View>
          <Animated.View entering={SlideInUp.delay(80).duration(500)} className="pb-3 pt-1">
            <Button
              title={loading ? 'Loading...' : 'Fund'}
              onPress={onContinue}
              disabled={numericAmount <= 0 || loading}
            />
          </Animated.View>

          <Animated.View entering={SlideInUp.delay(100).duration(500)} style={keypadStyle}>
            <Keypad
              className="pb-2"
              onKeyPress={onKeyPress}
              backspaceIcon="delete"
              variant="dark"
              leftKey="decimal"
            />
          </Animated.View>
        </View>

        <View style={{ paddingBottom: Math.max(insets.bottom, 12) }} />
      </SafeAreaView>
      <PaymentModal {...cr} isPending={loading} />
    </ErrorBoundary>
  );
}
