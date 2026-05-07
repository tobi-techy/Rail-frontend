import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import type { PaymentMethod } from '@/constants/depositOptions';
import { ArrowRight01Icon, LockIcon } from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';

interface PaymentMethodSelectorProps {
  methods: PaymentMethod[];
  selectedId?: string;
  onSelect: (method: PaymentMethod) => void;
  showUnavailable?: boolean;
}

/**
 * Payment Method Selector Component
 * Displays a list of payment methods in a clean, organized way
 * Supports badges, disabled states, and color-coded categories
 */
export function PaymentMethodSelector({
  methods,
  selectedId,
  onSelect,
  showUnavailable = true,
}: PaymentMethodSelectorProps) {
  const availableMethods = showUnavailable
    ? methods
    : methods.filter((method) => method.isAvailable !== false);

  if (availableMethods.length === 0) {
    return (
      <View className="items-center py-8">
        <Text className="font-subtitle text-base text-text-secondary">
          No payment methods available
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      scrollEnabled={availableMethods.length > 6}
      contentContainerStyle={{ paddingBottom: 8 }}>
      {availableMethods.map((method) => {
        const isDisabled = method.isAvailable === false;
        const isSelected = selectedId === method.id;

        return (
          <TouchableOpacity
            key={method.id}
            onPress={() => !isDisabled && onSelect(method)}
            disabled={isDisabled}
            activeOpacity={isDisabled ? 1 : 0.6}
            className={`mb-2 flex-row items-center justify-between rounded-2xl p-4 ${
              isSelected
                ? 'border-2 border-sky-blue bg-[#EFF6FF]'
                : 'border border-fog bg-stone-surface'
            } ${isDisabled ? 'opacity-50' : ''}`}>
            <View className="flex-1 flex-row items-center">
              {/* Icon Background */}
              <View
                className="mr-4 h-14 w-14 items-center justify-center rounded-2xl"
                style={{ backgroundColor: method.backgroundColor || '#f2f0ed' }}>
                {isDisabled && (
                  <View className="absolute z-10 h-full w-full items-center justify-center rounded-2xl bg-black/10" />
                )}
                <Text className="text-2xl font-bold" style={{ color: method.iconColor || '#666' }}>
                  {getIconEmoji(method.id)}
                </Text>
              </View>

              {/* Text Content */}
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="font-subtitle text-base text-text-primary">{method.name}</Text>
                  {method.badge && (
                    <View className="rounded-full bg-pink-100 px-2 py-1">
                      <Text className="font-button text-[10px] text-pink-600">{method.badge}</Text>
                    </View>
                  )}
                  {isDisabled && <HugeiconsIcon icon={LockIcon} size={14} color="#a7a7a7" />}
                </View>
                <Text className="mt-1 font-caption text-[12px] text-text-secondary">
                  {method.description}
                </Text>
              </View>
            </View>

            {/* Chevron */}
            <View className="ml-2">
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={20}
                color={isDisabled ? '#c6c6c6' : '#848281'}
              />
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

/**
 * Helper function to get icon label for payment methods
 * Maps method IDs to short text labels (icons rendered via HugeIcons in parent)
 */
function getIconEmoji(methodId: string): string {
  const labelMap: Record<string, string> = {
    // Fiat methods
    'bank-transfer': 'BK',
    'apple-pay': 'AP',
    'google-pay': 'GP',
    'debit-card': 'DC',
    'credit-card': 'CC',
    'ach-transfer': 'ACH',
    'wire-transfer': 'WR',
    paypal: 'PP',

    // Crypto methods
    'usdc-solana': 'USDC',
    'usdt-solana': 'USDT',
    sol: 'SOL',
    'usdc-ethereum': 'USDC',
    'usdt-ethereum': 'USDT',
    'usdc-polygon': 'USDC',

    // Withdrawal methods
    'crypto-wallet': 'CW',
    'apple-pay-cash': 'APC',
  };

  return labelMap[methodId] || 'PM';
}
