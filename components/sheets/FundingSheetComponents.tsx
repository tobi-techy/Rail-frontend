import React, { useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from '@/utils/platformHaptics';
import { IconComponent as HugeiconsIcon, type PhosphorIcon } from '@/lib/icons';
import { ArrowDown01Icon, ArrowUp01Icon, Tick02Icon } from '@/lib/icons';
import { GorhomBottomSheet } from './GorhomBottomSheet';
import { useUIStore } from '@/stores';
import type { Currency } from '@/stores/uiStore';
import {
  UsdcIcon,
  UsdtIcon,
  EurcIcon,
  PyusdIcon,
  UsdIcon,
  EurIcon,
  NgnIcon,
  GhsIcon,
  KesIcon,
  GbpIcon,
} from '@/assets/svg';

export type FundingOption = {
  id: string;
  icon: PhosphorIcon | React.ReactNode;
  iconColor?: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  badge?: string;
  disabled?: boolean;
};

export function OptionCard({ option, index }: { option: FundingOption; index: number }) {
  const isHugeIcon = option.icon && typeof option.icon === 'function';

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 60)}>
      <Pressable
        onPress={() => {
          if (option.disabled) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          option.onPress();
        }}
        disabled={option.disabled}
        className="mb-3 flex-row items-center gap-4 rounded-2xl border border-[#f2f0ed] bg-parchment-card px-4 py-5 active:bg-[#f8f7f4]"
        style={option.disabled ? { opacity: 0.45 } : undefined}
        accessibilityRole="button"
        accessibilityState={{ disabled: option.disabled }}
        accessibilityLabel={option.title}>
        <View className="w-8 items-center justify-center">
          {isHugeIcon ? (
            <HugeiconsIcon
              icon={option.icon as PhosphorIcon}
              size={20}
              color={option.iconColor || '#343433'}
              strokeWidth={1.8}
            />
          ) : (
            (option.icon as React.ReactNode)
          )}
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-subtitle text-[15px] text-[#343433]">{option.title}</Text>
            {option.badge && (
              <View className="rounded-md bg-[#f2f0ed] px-1.5 py-0.5">
                <Text className="font-caption text-[10px] text-[#848281]">{option.badge}</Text>
              </View>
            )}
          </View>
          <Text className="mt-0.5 font-body text-[13px] leading-[18px] text-[#848281]">
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
  badge?: string;
  disabled?: boolean;
};

export function ExpandableOptionList({
  main,
  more,
}: {
  main: ExpandableAction[];
  more: ExpandableAction[];
}) {
  const [expanded, setExpanded] = useState(false);

  // Show first 2 active (non-disabled) options; push disabled + remaining into expandable
  const active = main.filter((a) => !a.disabled);
  const paused = main.filter((a) => a.disabled);
  const initialVisible = active.slice(0, 2);
  const hiddenActions = [...active.slice(2), ...paused, ...more];

  const visible = expanded ? [...initialVisible, ...hiddenActions] : initialVisible;

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
            badge: action.badge,
            disabled: action.disabled,
          }}
        />
      ))}
      {hiddenActions.length > 0 && (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setExpanded((v) => !v);
          }}
          className="mb-2 items-center py-3">
          <Text className="font-body text-[14px] text-[#848281]">
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
  selectedCurrency,
  onCurrencyChange,
}: {
  title: string;
  rightElement?: React.ReactNode;
  showCurrencySelector?: boolean;
  selectedCurrency?: Currency;
  onCurrencyChange?: (currency: Currency) => void;
}) {
  return (
    <View className="mb-4 flex-row items-center justify-between pt-2">
      <Text className="font-subtitle text-[20px] text-[#343433]">{title}</Text>
      {showCurrencySelector ? (
        <CurrencySelectorPill
          selectedCurrency={selectedCurrency}
          onCurrencyChange={onCurrencyChange}
        />
      ) : (
        rightElement
      )}
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
  { code: 'GBP', label: 'British Pound', symbol: '\u00a3', type: 'fiat', Icon: GbpIcon },
  {
    code: 'NGN',
    label: 'Nigerian Naira',
    symbol: '\u20a6',
    type: 'fiat',
    Icon: NgnIcon,
  },
  {
    code: 'GHS',
    label: 'Ghanaian Cedi',
    symbol: 'GH\u20b5',
    type: 'fiat',
    Icon: GhsIcon,
    disabled: true,
  },
  {
    code: 'KES',
    label: 'Kenyan Shilling',
    symbol: 'KSh',
    type: 'fiat',
    Icon: KesIcon,
    disabled: true,
  },
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

function CurrencySelectorPill({
  selectedCurrency: externalCurrency,
  onCurrencyChange,
}: {
  selectedCurrency?: Currency;
  onCurrencyChange?: (currency: Currency) => void;
}) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const storeCurrency = useUIStore((s) => s.currency);
  const setCurrency = useUIStore((s) => s.setCurrency);
  const currency = externalCurrency ?? storeCurrency;
  const handleSelect = onCurrencyChange ?? setCurrency;
  const current = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

  return (
    <>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setPickerVisible(true);
        }}
        className="flex-row items-center gap-1.5 rounded-full border border-[#f2f0ed] bg-[#f8f7f4] px-3 py-1.5"
        accessibilityRole="button"
        accessibilityLabel="Select currency">
        <CurrencyIcon currency={current} size={20} />
        <Text className="font-subtitle text-[13px] text-[#343433]">{current.code}</Text>
        <HugeiconsIcon icon={ArrowDown01Icon} size={12} color="#848281" strokeWidth={2} />
      </Pressable>

      <GorhomBottomSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        showCloseButton={false}>
        <Text className="mb-2 font-subtitle text-[20px] text-[#343433]">Asset</Text>
        <Text className="mb-5 font-body text-[13px] text-[#848281]">
          Choose what to send or receive
        </Text>

        {/* Fiat currencies */}
        <Text className="mb-2 font-caption text-[11px] uppercase tracking-wider text-[#848281]">
          Fiat
        </Text>
        {CURRENCIES.filter((c) => c.type === 'fiat').map((c) => (
          <Pressable
            key={c.code}
            disabled={c.disabled}
            onPress={() => {
              if (c.disabled) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleSelect(c.code);
              setPickerVisible(false);
            }}
            className="mb-2 flex-row items-center gap-4 rounded-2xl border border-[#f2f0ed] bg-parchment-card px-4 py-3.5 active:bg-[#f8f7f4]"
            style={c.disabled ? { opacity: 0.4 } : undefined}>
            <CurrencyIcon currency={c} size={36} />
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="font-subtitle text-[15px] text-[#343433]">{c.code}</Text>
                {c.disabled && (
                  <View className="rounded-md bg-[#f2f0ed] px-1.5 py-0.5">
                    <Text className="font-caption text-[10px] text-[#848281]">Soon</Text>
                  </View>
                )}
              </View>
              <Text className="font-body text-[13px] text-[#848281]">{c.label}</Text>
            </View>
            {currency === c.code && !c.disabled && (
              <View className="h-5 w-5 items-center justify-center rounded-full bg-[#343433]">
                <HugeiconsIcon icon={Tick02Icon} size={10} color="#FFF" />
              </View>
            )}
          </Pressable>
        ))}

        {/* Crypto stablecoins */}
        <Text className="mb-2 mt-3 font-caption text-[11px] uppercase tracking-wider text-[#848281]">
          Stablecoins
        </Text>
        {CURRENCIES.filter((c) => c.type === 'stablecoin').map((c) => (
          <Pressable
            key={c.code}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleSelect(c.code);
              setPickerVisible(false);
            }}
            className="mb-2 flex-row items-center gap-4 rounded-2xl border border-[#f2f0ed] bg-parchment-card px-4 py-3.5 active:bg-[#f8f7f4]">
            <CurrencyIcon currency={c} size={36} />
            <View className="flex-1">
              <Text className="font-subtitle text-[15px] text-[#343433]">{c.code}</Text>
              <Text className="font-body text-[13px] text-[#848281]">{c.label}</Text>
            </View>
            {currency === c.code && (
              <View className="h-5 w-5 items-center justify-center rounded-full bg-[#343433]">
                <HugeiconsIcon icon={Tick02Icon} size={10} color="#FFF" />
              </View>
            )}
          </Pressable>
        ))}
      </GorhomBottomSheet>
    </>
  );
}
