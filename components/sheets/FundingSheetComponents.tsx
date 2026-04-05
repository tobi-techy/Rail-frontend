import React, { useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { HugeiconsIcon } from '@hugeicons/react-native';
import type { IconComponentType } from '@hugeicons/react-native';
import { ArrowDown01Icon, ArrowUp01Icon } from '@hugeicons/core-free-icons';
import { GorhomBottomSheet } from './GorhomBottomSheet';
import { useUIStore } from '@/stores';
import type { Currency } from '@/stores/uiStore';
import { UsdcIcon, UsdtIcon, EurcIcon, PyusdIcon, UsdIcon, EurIcon, NgnIcon } from '@/assets/svg';

export type FundingOption = {
  id: string;
  icon: IconComponentType | React.ReactNode;
  iconColor?: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  badge?: string;
};

export function OptionCard({ option, index }: { option: FundingOption; index: number }) {
  const isHugeIcon = option.icon && typeof option.icon === 'function';

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 60)}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          option.onPress();
        }}
        className="mb-3 flex-row items-center gap-4 rounded-2xl border border-[#F3F4F6] bg-white px-4 py-5 active:bg-[#F9FAFB]"
        accessibilityRole="button"
        accessibilityLabel={option.title}>
        <View className="w-8 items-center justify-center">
          {isHugeIcon ? (
            <HugeiconsIcon
              icon={option.icon as IconComponentType}
              size={20}
              color={option.iconColor || '#070914'}
              strokeWidth={1.8}
            />
          ) : (
            option.icon
          )}
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-subtitle text-[15px] text-[#070914]">{option.title}</Text>
            {option.badge && (
              <View className="rounded-md bg-[#F3F4F6] px-1.5 py-0.5">
                <Text className="font-caption text-[10px] text-[#9CA3AF]">{option.badge}</Text>
              </View>
            )}
          </View>
          <Text className="mt-0.5 font-body text-[13px] leading-[18px] text-[#9CA3AF]">
            {option.subtitle}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

type ExpandableAction = {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  onPress: () => void;
};

export function ExpandableOptionList({
  main,
  more,
}: {
  main: ExpandableAction[];
  more: ExpandableAction[];
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? [...main, ...more] : main;

  return (
    <>
      {visible.map((action, i) => (
        <OptionCard
          key={action.id}
          index={i}
          option={{
            id: action.id,
            icon: action.icon,
            title: action.label,
            subtitle: action.sublabel ?? '',
            onPress: action.onPress,
          }}
        />
      ))}
      {more.length > 0 && (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setExpanded((v) => !v);
          }}
          className="mb-2 items-center py-3">
          <Text className="font-body text-[14px] text-[#9CA3AF]">
            {expanded ? 'See less ↑' : 'See more ↓'}
          </Text>
        </Pressable>
      )}
    </>
  );
}

export function SheetHeader({
  title,
  rightElement,
  showCurrencySelector = false,
}: {
  title: string;
  rightElement?: React.ReactNode;
  showCurrencySelector?: boolean;
}) {
  return (
    <View className="mb-4 flex-row items-center justify-between pt-2">
      <Text className="font-subtitle text-[20px] text-[#070914]">{title}</Text>
      {showCurrencySelector ? <CurrencySelectorPill /> : rightElement}
    </View>
  );
}

type CurrencyOption = {
  code: Currency;
  label: string;
  symbol: string;
  type: 'fiat' | 'stablecoin';
  Icon?: React.ComponentType<any>;
  disabled?: boolean;
};

const CURRENCIES: CurrencyOption[] = [
  { code: 'USD', label: 'US Dollar', symbol: '$', type: 'fiat', Icon: UsdIcon },
  { code: 'EUR', label: 'Euro', symbol: '\u20ac', type: 'fiat', Icon: EurIcon },
  { code: 'NGN', label: 'Nigerian Naira', symbol: '\u20a6', type: 'fiat', Icon: NgnIcon, disabled: true },
  { code: 'USDC', label: 'USD Coin', symbol: 'USDC', type: 'stablecoin', Icon: UsdcIcon },
  { code: 'USDT', label: 'Tether', symbol: 'USDT', type: 'stablecoin', Icon: UsdtIcon },
  { code: 'EURC', label: 'Euro Coin', symbol: 'EURC', type: 'stablecoin', Icon: EurcIcon },
  { code: 'PYUSD', label: 'PayPal USD', symbol: 'PYUSD', type: 'stablecoin', Icon: PyusdIcon },
];

function CurrencyIcon({ currency, size = 20 }: { currency: CurrencyOption; size?: number }) {
  if (currency.Icon) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
        <currency.Icon width={size} height={size} />
      </View>
    );
  }
  return null;
}

function CurrencySelectorPill() {
  const [pickerVisible, setPickerVisible] = useState(false);
  const currency = useUIStore((s) => s.currency);
  const setCurrency = useUIStore((s) => s.setCurrency);
  const current = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

  return (
    <>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setPickerVisible(true);
        }}
        className="flex-row items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1.5"
        accessibilityRole="button"
        accessibilityLabel="Select currency">
        <CurrencyIcon currency={current} size={20} />
        <Text className="font-subtitle text-[13px] text-[#070914]">{current.code}</Text>
        <HugeiconsIcon icon={ArrowDown01Icon} size={12} color="#9CA3AF" strokeWidth={2} />
      </Pressable>

      <GorhomBottomSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        showCloseButton={false}>
        <Text className="mb-2 font-subtitle text-[20px] text-[#070914]">
          Asset
        </Text>
        <Text className="mb-5 font-body text-[13px] text-[#9CA3AF]">
          Choose what to send or receive
        </Text>

        {/* Fiat currencies */}
        <Text className="mb-2 font-caption text-[11px] uppercase tracking-wider text-[#9CA3AF]">
          Fiat
        </Text>
        {CURRENCIES.filter((c) => c.type === 'fiat').map((c) => (
          <Pressable
            key={c.code}
            disabled={c.disabled}
            onPress={() => {
              if (c.disabled) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCurrency(c.code);
              setPickerVisible(false);
            }}
            className="mb-2 flex-row items-center gap-4 rounded-2xl border border-[#F3F4F6] bg-white px-4 py-3.5 active:bg-[#F9FAFB]"
            style={c.disabled ? { opacity: 0.4 } : undefined}>
            <CurrencyIcon currency={c} size={36} />
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="font-subtitle text-[15px] text-[#070914]">{c.code}</Text>
                {c.disabled && (
                  <View className="rounded-md bg-[#F3F4F6] px-1.5 py-0.5">
                    <Text className="font-caption text-[10px] text-[#9CA3AF]">Soon</Text>
                  </View>
                )}
              </View>
              <Text className="font-body text-[13px] text-[#9CA3AF]">{c.label}</Text>
            </View>
            {currency === c.code && !c.disabled && (
              <View className="h-5 w-5 items-center justify-center rounded-full bg-[#070914]">
                <Text className="font-subtitle text-[10px] text-white">✓</Text>
              </View>
            )}
          </Pressable>
        ))}

        {/* Crypto stablecoins */}
        <Text className="mb-2 mt-3 font-caption text-[11px] uppercase tracking-wider text-[#9CA3AF]">
          Stablecoins
        </Text>
        {CURRENCIES.filter((c) => c.type === 'stablecoin').map((c) => (
          <Pressable
            key={c.code}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCurrency(c.code);
              setPickerVisible(false);
            }}
            className="mb-2 flex-row items-center gap-4 rounded-2xl border border-[#F3F4F6] bg-white px-4 py-3.5 active:bg-[#F9FAFB]">
            <CurrencyIcon currency={c} size={36} />
            <View className="flex-1">
              <Text className="font-subtitle text-[15px] text-[#070914]">{c.code}</Text>
              <Text className="font-body text-[13px] text-[#9CA3AF]">{c.label}</Text>
            </View>
            {currency === c.code && (
              <View className="h-5 w-5 items-center justify-center rounded-full bg-[#070914]">
                <Text className="font-subtitle text-[10px] text-white">✓</Text>
              </View>
            )}
          </Pressable>
        ))}
      </GorhomBottomSheet>
    </>
  );
}
