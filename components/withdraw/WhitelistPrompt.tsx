import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ShieldKeyIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

interface WhitelistPromptProps {
  address: string;
  chain: string;
  onWhitelist: () => void;
  onDismiss: () => void;
}

export function WhitelistPrompt({ address, chain, onWhitelist, onDismiss }: WhitelistPromptProps) {
  return (
    <View className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
      <View className="mb-3 flex-row items-center">
        <HugeiconsIcon icon={ShieldKeyIcon} size={20} color="#CA8A04" />
        <Text className="ml-2 font-subtitle text-sm text-yellow-800">Address Not Whitelisted</Text>
      </View>
      <Text className="mb-4 font-body text-sm leading-5 text-yellow-700">
        This address isn&apos;t whitelisted. New addresses require a 24-hour cooling period before
        withdrawals.
      </Text>
      <View className="flex-row gap-3">
        <Pressable onPress={onDismiss} className="flex-1 items-center rounded-xl py-3">
          <Text className="font-subtitle text-sm text-text-secondary">Cancel</Text>
        </Pressable>
        <Pressable onPress={onWhitelist} className="flex-1 items-center rounded-xl bg-black py-3">
          <Text className="font-subtitle text-sm text-white">Whitelist Address</Text>
        </Pressable>
      </View>
    </View>
  );
}
