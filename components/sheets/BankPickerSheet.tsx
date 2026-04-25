import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, Keyboard, StyleSheet } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Search01Icon, BankIcon, Cancel01Icon } from '@hugeicons/core-free-icons';
import type { PajBank } from '@/api/types/paj';

interface BankPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  banks: PajBank[];
  loading?: boolean;
  onSelect: (bank: PajBank) => void;
}

const SNAP_POINTS = ['80%'];

export function BankPickerSheet({ visible, onClose, banks, loading, onSelect }: BankPickerSheetProps) {
  const [search, setSearch] = useState('');
  const ref = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) ref.current?.present();
    else ref.current?.dismiss();
  }, [visible]);

  const filtered = useMemo(() => {
    if (!search) return banks;
    const q = search.toLowerCase();
    return banks.filter((b) => b.name.toLowerCase().includes(q));
  }, [banks, search]);

  const handleSelect = useCallback(
    (bank: PajBank) => {
      setSearch('');
      onSelect(bank);
    },
    [onSelect]
  );

  const handleDismiss = useCallback(() => {
    Keyboard.dismiss();
    setSearch('');
    onClose();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} pressBehavior="close" />
    ),
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: PajBank }) => (
      <Pressable
        className="flex-row items-center px-5 py-3.5 active:bg-[#F9FAFB]"
        onPress={() => handleSelect(item)}>
        <View className="mr-3 size-10 items-center justify-center rounded-full bg-[#F3F4F6]">
          <HugeiconsIcon icon={BankIcon} size={18} color="#6B7280" />
        </View>
        <Text className="flex-1 font-body text-[15px] text-text-primary">{item.name}</Text>
      </Pressable>
    ),
    [handleSelect]
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={SNAP_POINTS}
      enableDynamicSizing={false}
      enablePanDownToClose
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.indicator}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize">
      <View className="px-5 pb-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-subtitle text-[20px] text-text-primary">Bank List</Text>
            <Text className="mt-1 font-body text-[14px] text-text-secondary">
              Choose a bank to send money to
            </Text>
          </View>
          <Pressable
            className="size-8 items-center justify-center rounded-full bg-[#F3F4F6]"
            onPress={() => ref.current?.dismiss()}
            hitSlop={12}>
            <HugeiconsIcon icon={Cancel01Icon} size={18} color="#9CA3AF" />
          </Pressable>
        </View>

        <View className="mt-4 flex-row items-center rounded-xl bg-[#F3F4F6] px-3 py-2.5">
          <HugeiconsIcon icon={Search01Icon} size={18} color="#9CA3AF" />
          <BottomSheetTextInput
            className="ml-2 flex-1 font-body text-[15px] text-text-primary"
            placeholder="Search bank"
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
        </View>
      </View>

      {loading ? (
        <View className="items-center py-12">
          <ActivityIndicator color="#FF2E01" />
          <Text className="mt-2 font-body text-[13px] text-[#9CA3AF]">Loading banks...</Text>
        </View>
      ) : (
        <BottomSheetFlatList
          data={filtered}
          keyExtractor={(b: PajBank) => b.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) }}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text className="font-body text-[14px] text-text-secondary">
                {search ? 'No banks match your search' : 'No banks available'}
              </Text>
            </View>
          }
        />
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  indicator: { backgroundColor: '#D1D5DB', width: 36, height: 4, borderRadius: 2, marginTop: 8 },
});
