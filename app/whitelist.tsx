import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BottomSheet } from '@/components/sheets';
import { Button } from '@/components/ui';
import { InputField } from '@/components/atoms/InputField';
import {
  useWhitelist,
  useAddWhitelistAddress,
  useRemoveWhitelistAddress,
} from '@/api/hooks/useSecurity';
import type { WhitelistedAddress } from '@/api/types/security';
import { useHaptics } from '@/hooks/useHaptics';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import {
  ArrowLeft01Icon,
  Delete02Icon,
  PlusSignIcon,
  ShieldKeyIcon,
  CheckmarkCircle01Icon,
  Clock01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

const CHAINS = ['SOL', 'ETH', 'BASE', 'POLYGON', 'ARBITRUM'] as const;

const truncateAddress = (addr: string) =>
  addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;

const getCoolingHours = (coolingUntil: string | null) => {
  if (!coolingUntil) return 0;
  const diff = new Date(coolingUntil).getTime() - Date.now();
  return diff > 0 ? Math.ceil(diff / 3600000) : 0;
};

function StatusBadge({ address }: { address: WhitelistedAddress }) {
  const hours = getCoolingHours(address.cooling_until);
  if (address.status === 'pending' || hours > 0) {
    return (
      <View className="flex-row items-center rounded-full bg-yellow-50 px-2.5 py-1">
        <HugeiconsIcon icon={Clock01Icon} size={12} color="#CA8A04" />
        <Text className="ml-1 font-caption text-xs text-yellow-700">
          {hours > 0 ? `Active in ${hours}h` : 'Pending'}
        </Text>
      </View>
    );
  }
  return (
    <View className="flex-row items-center rounded-full bg-green-50 px-2.5 py-1">
      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} color="#16A34A" />
      <Text className="ml-1 font-caption text-xs text-green-700">Active</Text>
    </View>
  );
}

function AddressRow({ item, onDelete }: { item: WhitelistedAddress; onDelete: () => void }) {
  return (
    <View className="bg-surface-secondary mb-3 flex-row items-center rounded-2xl border border-surface p-4">
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-surface">
        <Text className="font-body-bold text-xs text-text-secondary">{item.chain}</Text>
      </View>
      <View className="flex-1">
        <Text className="font-subtitle text-body text-text-primary" numberOfLines={1}>
          {item.label || truncateAddress(item.address)}
        </Text>
        <Text className="mt-0.5 font-caption text-caption text-text-secondary">
          {truncateAddress(item.address)}
        </Text>
      </View>
      <StatusBadge address={item} />
      <Pressable
        onPress={onDelete}
        className="ml-2 h-9 w-9 items-center justify-center rounded-full bg-red-50"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <HugeiconsIcon icon={Delete02Icon} size={16} color="#EF4444" />
      </Pressable>
    </View>
  );
}

export default function WhitelistScreen() {
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WhitelistedAddress | null>(null);
  const [chain, setChain] = useState<string>(CHAINS[0]);
  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('');
  const { impact, notification } = useHaptics();
  const { showError } = useFeedbackPopup();

  const { data, isLoading, isError, refetch, isRefetching } = useWhitelist();
  const addresses = data?.addresses ?? [];
  const { mutateAsync: addAddress, isPending: isAdding } = useAddWhitelistAddress();
  const { mutateAsync: removeAddress, isPending: isRemoving } = useRemoveWhitelistAddress();

  const handleAdd = async () => {
    if (!address.trim()) return;
    try {
      await addAddress({ chain, address: address.trim(), label: label.trim() || undefined });
      setShowAddSheet(false);
      setAddress('');
      setLabel('');
      notification();
    } catch (err: any) {
      showError('Error', err?.message || 'Failed to add address.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await removeAddress(deleteTarget.id);
      notification();
    } catch (err: any) {
      showError('Error', err?.message || 'Failed to remove address.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const openAddSheet = () => {
    setChain(CHAINS[0]);
    setAddress('');
    setLabel('');
    setShowAddSheet(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-background-main">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-surface"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#070914" />
        </Pressable>
        <Text className="flex-1 font-subtitle text-headline-1">Whitelist</Text>
        <Pressable
          onPress={openAddSheet}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <HugeiconsIcon icon={PlusSignIcon} size={20} color="#070914" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
        <Text className="mb-6 mt-2 font-body text-base leading-6 text-text-secondary">
          Whitelisted addresses can receive withdrawals. New addresses require a 24-hour cooling
          period.
        </Text>

        {isLoading && (
          <View className="items-center py-12">
            <ActivityIndicator color="#6B7280" />
          </View>
        )}

        {isError && !isLoading && (
          <View className="bg-surface-secondary items-center rounded-2xl border border-surface py-10">
            <Text className="font-body text-base text-text-secondary">
              Failed to load addresses.
            </Text>
          </View>
        )}

        {!isLoading && !isError && addresses.length === 0 && (
          <View className="bg-surface-secondary items-center rounded-2xl border border-dashed border-neutral-300 py-12">
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-surface">
              <HugeiconsIcon icon={ShieldKeyIcon} size={24} color="#9CA3AF" />
            </View>
            <Text className="mb-1 font-subtitle text-base text-text-primary">
              No whitelisted addresses
            </Text>
            <Text className="mb-6 font-body text-sm text-text-secondary">
              Add an address to enable withdrawals
            </Text>
            <Button title="Add Address" variant="black" onPress={openAddSheet} />
          </View>
        )}

        {addresses.map((item) => (
          <AddressRow
            key={item.id}
            item={item}
            onDelete={() => {
              impact();
              setDeleteTarget(item);
            }}
          />
        ))}

        {addresses.length > 0 && (
          <Button title="Add Another Address" variant="ghost" onPress={openAddSheet} />
        )}
      </ScrollView>

      {/* Delete confirm sheet */}
      <BottomSheet visible={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <Text className="mb-2 font-subtitle text-xl">Remove Address</Text>
        <Text className="mb-6 font-body text-base leading-6 text-neutral-500">
          Remove &quot;{deleteTarget?.label || truncateAddress(deleteTarget?.address ?? '')}&quot;
          from your whitelist?
        </Text>
        <View className="flex-row gap-3">
          <Button title="Cancel" variant="ghost" onPress={() => setDeleteTarget(null)} flex />
          <Button
            title={isRemoving ? '' : 'Remove'}
            variant="destructive"
            onPress={handleDeleteConfirm}
            disabled={isRemoving}
            flex>
            {isRemoving && <ActivityIndicator color="#fff" />}
          </Button>
        </View>
      </BottomSheet>

      {/* Add address sheet */}
      <BottomSheet visible={showAddSheet} onClose={() => setShowAddSheet(false)}>
        <Text className="mb-2 font-subtitle text-xl">Add Address</Text>
        <Text className="mb-6 font-body text-base leading-6 text-neutral-500">
          New addresses have a 24-hour cooling period before withdrawals are enabled.
        </Text>

        {/* Chain selector */}
        <Text className="mb-2 font-caption text-sm text-text-secondary">Chain</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row gap-2">
            {CHAINS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setChain(c)}
                className={`rounded-full px-4 py-2 ${chain === c ? 'bg-black' : 'bg-surface-secondary'}`}>
                <Text
                  className={`font-body-bold text-sm ${chain === c ? 'text-white' : 'text-text-primary'}`}>
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <InputField
          value={address}
          onChangeText={setAddress}
          placeholder="Wallet address"
          containerClassName="mb-3"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <InputField
          value={label}
          onChangeText={setLabel}
          placeholder="Label (optional)"
          maxLength={40}
          containerClassName="mb-6"
        />

        <View className="flex-row gap-3">
          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => setShowAddSheet(false)}
            disabled={isAdding}
            flex
          />
          <Button
            title={isAdding ? '' : 'Add Address'}
            variant="black"
            onPress={handleAdd}
            disabled={isAdding || !address.trim()}
            flex>
            {isAdding && <ActivityIndicator color="#fff" />}
          </Button>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
