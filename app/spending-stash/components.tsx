import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { ScanSearch } from 'lucide-react-native';
import { Icon } from '@/components/atoms/Icon';
import { useHaptics } from '@/hooks/useHaptics';

export const C = {
  text: '#000000',
  textSub: '#8E8E93',
  surfaceEl: '#E5E5EA',
  accent: '#FF2E01',
  success: '#00C853',
  warning: '#FF9F0A',
  danger: '#FF453A',
} as const;

export const CATEGORY_PALETTE = ['#FF6B35', '#FFD166', '#06D6A0', '#118AB2', '#9B5DE5', '#EF476F'];

export const PERIODS = ['1W', '1M', '6M', '1Y'] as const;
export type Period = (typeof PERIODS)[number];

export function splitAmt(n: number): { dollars: string; cents: string } {
  const [d, c] = Math.abs(n).toFixed(2).split('.');
  return { dollars: `$${d}`, cents: `.${c}` };
}

// ── Period selector ───────────────────────────────────────────────────────────

const PAD = 16;

export function PeriodSelector({
  selected,
  onSelect,
}: {
  selected: Period;
  onSelect: (p: Period) => void;
}) {
  const { width: sw } = useWindowDimensions();
  const tabsAreaW = sw - PAD * 2;
  const tabW = tabsAreaW / PERIODS.length;
  const selectedIdx = PERIODS.indexOf(selected);

  const offset = useSharedValue(selectedIdx * tabW);
  React.useEffect(() => {
    offset.value = withSpring(selectedIdx * tabW, { damping: 18, stiffness: 220 });
  }, [selectedIdx, tabW, offset]);

  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));

  return (
    <View className="mb-2 mt-4 px-4">
      <View style={{ width: tabsAreaW }}>
        <View className="flex-row">
          {PERIODS.map((p) => (
            <Pressable
              key={p}
              onPress={() => onSelect(p)}
              style={{ width: tabW }}
              className="items-center py-2"
              accessibilityRole="button"
              accessibilityLabel={`${p} period`}>
              <Text
                className={`text-caption ${selected === p ? 'font-button text-text-primary' : 'font-caption text-[#8E8E93]'}`}>
                {p}
              </Text>
            </Pressable>
          ))}
        </View>
        <View className="mt-1 h-0.5 overflow-hidden rounded-full bg-[#E5E5EA]">
          <Animated.View
            className="h-0.5 rounded-full bg-primary"
            style={[{ width: tabW }, indicatorStyle]}
          />
        </View>
      </View>
    </View>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

export function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View className="flex-1 rounded-2xl bg-[#F2F2F7] px-4 py-4">
      <Text className="font-caption text-small text-[#8E8E93]">{label}</Text>
      <Text className="mt-1 font-headline text-[22px] text-text-primary">{value}</Text>
      {sub && <Text className="mt-0.5 font-caption text-[11px] text-[#8E8E93]">{sub}</Text>}
    </View>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View className="mx-4 mb-3 flex-row items-center justify-between">
      <Text className="font-button text-[17px] text-text-primary">{title}</Text>
      {action && (
        <Pressable
          onPress={onAction}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={action}>
          <Text className="font-caption text-caption text-[#007AFF]">{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ── Category row ──────────────────────────────────────────────────────────────

export function CategoryRow({
  title,
  transactionCount,
  amount,
  percentage,
  iconName,
  color,
  showSep,
}: {
  title: string;
  transactionCount: number;
  amount: number;
  percentage: number;
  iconName: string;
  color: string;
  showSep: boolean;
}) {
  return (
    <View>
      <View className="flex-row items-center px-4 py-[14px]">
        <View
          className="mr-3 h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}22` }}>
          <Icon name={iconName} size={20} color={color} strokeWidth={1.5} />
        </View>
        <View className="flex-1">
          <Text className="font-button text-[15px] text-text-primary" numberOfLines={1}>
            {title}
          </Text>
          <Text className="mt-0.5 font-caption text-small text-[#8E8E93]">
            {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <View className="items-end">
          <Text className="font-button text-[15px] text-text-primary">{`-$${Math.abs(amount).toFixed(2)}`}</Text>
          <Text className="mt-0.5 font-caption text-small text-[#8E8E93]">{percentage}%</Text>
        </View>
      </View>
      {showSep && <View className="ml-[72px] h-px bg-gray-100" />}
    </View>
  );
}

// ── Transaction row ───────────────────────────────────────────────────────────

export function TxRow({
  transaction,
  showSep,
}: {
  transaction: {
    id: string;
    type: string;
    title: string;
    subtitle: string;
    amount: number;
    status: string;
  };
  showSep: boolean;
}) {
  const isCredit = transaction.type === 'receive' || transaction.type === 'deposit';
  const abs = Math.abs(transaction.amount);
  const amountText = `${isCredit ? '+' : '-'}$${abs.toFixed(2)}`;
  const amountColor = transaction.status === 'failed' ? C.danger : isCredit ? C.success : C.text;

  return (
    <View>
      <View className="flex-row items-center px-4 py-[14px]">
        <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-[#E5E5EA]">
          <Icon
            name={isCredit ? 'arrow-down-left' : 'arrow-up-right'}
            size={20}
            color={isCredit ? C.success : C.textSub}
            strokeWidth={1.5}
          />
        </View>
        <View className="flex-1">
          <Text className="font-button text-[15px] text-text-primary" numberOfLines={1}>
            {transaction.title}
          </Text>
          <Text className="mt-0.5 font-caption text-small text-[#8E8E93]" numberOfLines={1}>
            {transaction.subtitle}
          </Text>
        </View>
        <View className="items-end">
          <Text className="font-button text-[15px]" style={{ color: amountColor }}>
            {amountText}
          </Text>
          {transaction.status === 'pending' && (
            <Text className="mt-0.5 font-caption text-small" style={{ color: C.warning }}>
              Pending
            </Text>
          )}
        </View>
      </View>
      {showSep && <View className="ml-[72px] h-px bg-gray-100" />}
    </View>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

export function EmptyPeriod() {
  return (
    <View className="items-center px-4 py-10">
      <ScanSearch size={44} color={C.textSub} strokeWidth={1} />
      <Text className="mt-4 text-center font-button text-[17px] text-text-primary">
        Nothing spent during this time
      </Text>
      <Text className="mt-2 text-center font-caption text-caption text-[#8E8E93]">
        Make your first payment
      </Text>
    </View>
  );
}
