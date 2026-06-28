import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, StatusBar, TextInput, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Search01Icon,
  Cancel01Icon,
  Building04Icon,
  IconComponent as HugeiconsIcon,
} from '@/lib/icons';
import { usePajBanks } from '@/api/hooks/usePaj';
import type { PajBank } from '@/api/types/paj';
import { ScreenHeader } from '@/components/withdraw/shared';

const BankRow = React.memo(function BankRow({
  bank,
  onPress,
}: {
  bank: PajBank;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-4 px-5 py-3.5 active:bg-surface">
      {bank.logo ? (
        <Image source={{ uri: bank.logo }} className="size-12 rounded-full" />
      ) : (
        <View className="size-12 items-center justify-center rounded-full bg-[#f2f2f2]">
          <HugeiconsIcon icon={Building04Icon} size={20} color="#848281" />
        </View>
      )}
      <Text className="flex-1 font-subtitle text-[16px] text-text-primary">{bank.name}</Text>
    </Pressable>
  );
});

export default function NgnSelectBankScreen() {
  const params = useLocalSearchParams<{ amount: string; currency: string }>();
  const { data: pajBanksData } = usePajBanks();
  const banks = useMemo<PajBank[]>(() => pajBanksData?.banks ?? [], [pajBanksData?.banks]);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return banks;
    const q = search.toLowerCase();
    return banks.filter((b) => b.name.toLowerCase().includes(q));
  }, [banks, search]);

  const onSelect = useCallback(
    (bank: PajBank) => {
      router.push({
        pathname: '/withdraw/ngn/enter-account' as never,
        params: { ...params, bankId: bank.id, bankName: bank.name, bankLogo: bank.logo ?? '' },
      } as never);
    },
    [params]
  );

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
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <HugeiconsIcon icon={Cancel01Icon} size={15} color="#848281" />
            </Pressable>
          )}
        </View>
      </Animated.View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BankRow bank={item} onPress={() => onSelect(item)} />}
        className="mt-4"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        windowSize={7}
        removeClippedSubviews
        getItemLayout={(_, index) => ({ length: 68, offset: 68 * index, index })}
      />
    </SafeAreaView>
  );
}
