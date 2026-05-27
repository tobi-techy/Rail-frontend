import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, Keyboard } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';
import { Search01Icon, BankIcon, Cancel01Icon } from '@/lib/icons';
import type { PajBank } from '@/api/types/paj';

interface BankPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  banks: PajBank[];
  loading?: boolean;
  onSelect: (bank: PajBank) => void;
}

const SNAP_POINTS = ['80%'];

export function BankPickerSheet({
  visible,
  onClose,
  banks,
  loading,
  onSelect,
}: BankPickerSheetProps) {
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
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: PajBank }) => (
      <Pressable
        className="flex-row items-center px-5 py-4 active:bg-stone-surface"
        onPress={() => handleSelect(item)}>
        <View className="mr-4 size-11 items-center justify-center rounded-full bg-stone-surface">
          <HugeiconsIcon icon={BankIcon} size={20} color="#848281" />
        </View>
        <Text className="flex-1 font-body text-body text-text-primary">{item.name}</Text>
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
      backgroundStyle={{
        backgroundColor: '#f7f4ef',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
      handleIndicatorStyle={{
        backgroundColor: '#c6c6c6',
        width: 36,
        height: 4,
        borderRadius: 2,
        marginTop: 8,
      }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize">
      <View className="px-5 pb-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-heading text-heading text-text-primary">Bank List</Text>
            <Text className="mt-1 font-body text-caption text-text-secondary">
              Choose a bank to send money to
            </Text>
          </View>
          <Pressable
            className="size-9 items-center justify-center rounded-full bg-stone-surface"
            onPress={() => ref.current?.dismiss()}
            hitSlop={12}>
            <HugeiconsIcon icon={Cancel01Icon} size={18} color="#848281" />
          </Pressable>
        </View>

        <View className="mt-4 flex-row items-center rounded-full bg-stone-surface px-4 py-3">
          <HugeiconsIcon icon={Search01Icon} size={18} color="#848281" />
          <BottomSheetTextInput
            className="ml-2.5 flex-1 font-body text-body text-text-primary"
            placeholder="Search bank"
            placeholderTextColor="#a7a7a7"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
        </View>
      </View>

      {loading ? (
        <View className="items-center py-12">
          <ActivityIndicator color="#343433" />
          <Text className="mt-3 font-body text-caption text-text-secondary">Loading banks...</Text>
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
