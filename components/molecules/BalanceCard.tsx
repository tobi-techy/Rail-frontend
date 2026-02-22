import React, { useEffect, useState } from 'react';
import { View, Text, ViewProps, TouchableOpacity, Pressable } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useUIStore } from '@/stores';
import { sanitizeNumber } from '@/utils/sanitizeInput';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { UsdIcon, EurIcon, NgnIcon, GbpIcon } from '@/assets/svg';

export interface BalanceCardProps extends ViewProps {
  balance?: string;
  percentChange?: string;
  timeframe?: string;
  className?: string;
}

const CHAR_HEIGHT = 58;
const CHAR_HEIGHT_SM = 36;
const FLAG_SIZE = 28;

const FX: Record<string, { rate: number; code: string }> = {
  USD: { rate: 1,     code: 'USD' },
  GBP: { rate: 0.79,  code: 'GBP' },
  EUR: { rate: 0.92,  code: 'EUR' },
  NGN: { rate: 1620,  code: 'NGN' },
};

const CURRENCIES = [
  { code: 'USD', Icon: UsdIcon },
  { code: 'GBP', Icon: GbpIcon },
  { code: 'EUR', Icon: EurIcon },
  { code: 'NGN', Icon: NgnIcon },
] as const;

type Currency = 'USD' | 'GBP' | 'EUR' | 'NGN';

function formatBalance(usdValue: number, currency: Currency): string {
  const { rate, code } = FX[currency];
  const value = usdValue * rate;
  if (code === 'NGN') {
    return '₦' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: code,
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(value);
}

function AnimatedChar({ char, index, muted }: { char: string; index: number; muted?: boolean }) {
  const h = muted ? CHAR_HEIGHT_SM : CHAR_HEIGHT;
  const translateY = useSharedValue(h);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = h;
    opacity.value = 0;
    const timeout = setTimeout(() => {
      translateY.value = withSpring(0, { damping: 20, stiffness: 300, mass: 0.8 });
      opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });
    }, index * 30);
    return () => clearTimeout(timeout);
  }, [char]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: interpolate(opacity.value, [0, 1], [0, 1]),
  }));

  return (
    <View style={{ height: h, overflow: 'hidden', justifyContent: 'flex-end' }}>
      <Animated.Text style={animatedStyle}
        className={`font-subtitle ${muted ? 'text-[28px] text-text-secondary' : 'text-balance-lg text-text-primary'}`}>
        {char}
      </Animated.Text>
    </View>
  );
}

function AnimatedBalance({ value, isVisible }: { value: string; isVisible: boolean }) {
  const displayValue = isVisible ? value : '••••';
  // Find last dot or comma (decimal separator)
  const dotIndex = displayValue.search(/[.,](?=\d{2}$)/);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'nowrap', flexShrink: 1 }}>
      {displayValue.split('').map((char, i) => (
        <AnimatedChar key={`${i}-${char}-${value}`} char={char} index={i}
          muted={dotIndex !== -1 && i >= dotIndex} />
      ))}
    </View>
  );
}

function FlagStack({ selected, onSelect }: { selected: Currency; onSelect: (c: Currency) => void }) {
  const [open, setOpen] = useState(false);
  const selectedIndex = CURRENCIES.findIndex(c => c.code === selected);

  // Reorder so selected is first
  const ordered = [
    CURRENCIES[selectedIndex],
    ...CURRENCIES.filter((_, i) => i !== selectedIndex),
  ];

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpen(o => !o);
  };

  const pick = (code: Currency) => {
    Haptics.selectionAsync();
    onSelect(code);
    setOpen(false);
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 0 }}>
      {open ? (
        ordered.map(({ code, Icon }) => {
          if (typeof Icon !== 'function' && typeof Icon !== 'object') return null;
          return (
            <Pressable
              key={code}
              onPress={() => pick(code as Currency)}
              style={{
                width: FLAG_SIZE, height: FLAG_SIZE,
                borderRadius: FLAG_SIZE / 2,
                overflow: 'hidden',
                marginRight: 6,
                borderWidth: code === selected ? 2 : 0,
                borderColor: '#111',
              }}>
              <Icon width={FLAG_SIZE} height={FLAG_SIZE} />
            </Pressable>
          );
        })
      ) : (
        <Pressable onPress={toggle} style={{ width: FLAG_SIZE + (CURRENCIES.length - 1) * 10, height: FLAG_SIZE }}>
          {ordered.slice().reverse().map(({ code, Icon }, i) => {
            if (typeof Icon !== 'function' && typeof Icon !== 'object') return null;
            const reverseI = ordered.length - 1 - i;
            return (
              <View
                key={code}
                style={{
                  position: 'absolute',
                  left: reverseI * 10,
                  width: FLAG_SIZE, height: FLAG_SIZE,
                  borderRadius: FLAG_SIZE / 2,
                  overflow: 'hidden',
                  borderWidth: 1.5,
                  borderColor: '#fff',
                }}>
                <Icon width={FLAG_SIZE} height={FLAG_SIZE} />
              </View>
            );
          })}
        </Pressable>
      )}
    </View>
  );
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance = '$0.00', percentChange = '0.00%', timeframe = '1D', className, ...props
}) => {
  const { isBalanceVisible, toggleBalanceVisibility } = useUIStore();
  const [currency, setCurrency] = useState<Currency>('USD');
  const isNegative = percentChange.startsWith('-');
  const rawUsd = parseFloat(balance.replace(/[^0-9.-]/g, '')) || 0;
  const isLoading = rawUsd === 0 && percentChange === '0.00%';
  const displayBalance = isLoading ? '---' : formatBalance(rawUsd, currency);

  return (
    <View className={`overflow-hidden ${className || ''}`} {...props}>
      <View className="items-start pb-4 pt-6">
        <FlagStack selected={currency} onSelect={setCurrency} />

        <View className="flex-row items-center gap-x-2">
          <AnimatedBalance value={displayBalance} isVisible={isBalanceVisible} />
          <TouchableOpacity onPress={toggleBalanceVisibility}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            {isBalanceVisible
              ? <Eye size={24} color="#757575" strokeWidth={0.9} />
              : <EyeOff size={24} color="#757575" strokeWidth={0.9} />}
          </TouchableOpacity>
        </View>

        <Text className={`mt-1 font-body text-caption ${isNegative ? 'text-destructive' : 'text-success'}`}>
          {isBalanceVisible ? (isLoading ? '---' : sanitizeNumber(String(percentChange))) : '••••'}{' '}
          <Text className="text-text-secondary">{timeframe}</Text>
        </Text>
      </View>
    </View>
  );
};
