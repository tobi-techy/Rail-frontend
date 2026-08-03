import React, { useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, Pressable, StatusBar, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Search01Icon, Cancel01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import { useRampBanks } from '@/api/hooks/useRamp';
import type { RampBank } from '@/api/types/ramp';
import { ScreenHeader } from '@/components/withdraw/shared';
import { BankLogo } from '@/components/molecules/BankLogo';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import * as Haptics from '@/utils/platformHaptics';

const BankRow = React.memo(function BankRow({
  bank,
  onPress,
}: {
  bank: RampBank;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-4 px-5 py-3.5 active:scale-[0.98] active:bg-surface">
      <BankLogo bankName={bank.bankName} bankCode={bank.bankCode} size={48} />
      <Text
        className="flex-1 font-subtitle text-[16px] text-text-primary"
        maxFontSizeMultiplier={1.3}>
        {bank.bankName}
      </Text>
    </Pressable>
  );
});

export default function NgnSelectBankScreen() {
  const { data: rampBanksData } = useRampBanks();
  const { impact } = useHaptics();
  const [search, setSearch] = useState('');
  const scrollRef = useRef<FlatList>(null);

  const banks = useMemo<RampBank[]>(() => rampBanksData?.banks ?? [], [rampBanksData?.banks]);

  const filtered = useMemo(() => {
    if (!search.trim()) return banks;
    const q = search.toLowerCase();
    return banks.filter((b) => b.bankName.toLowerCase().includes(q));
  }, [banks, search]);

  const onSelect = useCallback(
    (bank: RampBank) => {
      impact(Haptics.ImpactFeedbackStyle.Medium);
      playUISound('buttonClick');
      router.push({
        pathname: '/withdraw/ngn/enter-account' as never,
        params: { bankCode: bank.bankCode, bankName: bank.bankName },
      } as never);
    },
    [impact]
  );

  const onClearSearch = useCallback(() => {
    impact(Haptics.ImpactFeedbackStyle.Light);
    playUISound('buttonClick');
    setSearch('');
  }, [impact]);

  const scrollHapticFired = useRef(false);

  const onScrollBeginDrag = useCallback(() => {
    if (!scrollHapticFired.current) {
      impact(Haptics.ImpactFeedbackStyle.Light);
      scrollHapticFired.current = true;
    }
  }, [impact]);

  const onScrollEndDrag = useCallback(() => {
    scrollHapticFired.current = false;
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <ScreenHeader />

      <Animated.Text
        entering={FadeInDown.duration(300)}
        className="px-5 font-subtitle text-[28px] text-text-primary">
        Select Bank
      </Animated.Text>

      <Animated.View entering={FadeInDown.delay(80).duration(300)} className="mx-5 mt-5">
        <View
          className="flex-row items-center gap-3 rounded-2xl bg-[#f7f2e8] px-4"
          style={{ height: 48 }}>
          <HugeiconsIcon icon={Search01Icon} size={18} color="#848281" />
          <TextInput
            className="flex-1 font-body text-[15px] text-text-primary"
            placeholder="Search banks"
            placeholderTextColor="#848281"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={onClearSearch} hitSlop={8}>
              <HugeiconsIcon icon={Cancel01Icon} size={15} color="#848281" />
            </Pressable>
          )}
        </View>
      </Animated.View>

      <FlatList
        ref={scrollRef}
        data={filtered}
        keyExtractor={(item) => item.bankCode}
        renderItem={({ item }) => <BankRow bank={item} onPress={() => onSelect(item)} />}
        className="mt-4"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        windowSize={7}
        removeClippedSubviews
        getItemLayout={(_, index) => ({ length: 68, offset: 68 * index, index })}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
      />
    </SafeAreaView>
  );
}
