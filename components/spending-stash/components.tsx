import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { Icon } from '@/components/atoms/Icon';
import { IconComponent as HugeiconsIcon, ScanEyeIcon } from '@/lib/icons';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import { useButtonFeedback } from '@/hooks/useButtonFeedback';

export const C = {
  text: '#343433',
  textSub: '#848281',
  surfaceEl: '#f7f2e8',
  accent: '#ff3e00',
  success: '#00ca48',
  warning: '#d48f00',
  danger: '#ff2b3a',
} as const;

export const CATEGORY_PALETTE = ['#ff3e00', '#00ca48', '#0090ff', '#ffbb26', '#00c978'];

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
  const { selection } = useHaptics();
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
              onPress={() => {
                playUISound('buttonClick');
                selection();
                onSelect(p);
              }}
              style={{ width: tabW }}
              className="items-center py-2"
              accessibilityRole="button"
              accessibilityLabel={`${p} period`}>
              <Text
                className={`text-caption ${selected === p ? 'font-button text-text-primary' : 'font-caption text-ash'}`}>
                {p}
              </Text>
            </Pressable>
          ))}
        </View>
        <View className="mt-1 h-0.5 overflow-hidden rounded-full bg-stone-surface">
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
    <View className="flex-1 rounded-2xl bg-stone-surface px-4 py-4">
      <Text className="font-caption text-small text-ash">{label}</Text>
      <Text className="mt-1 font-headline text-[22px] text-text-primary">{value}</Text>
      {sub && <Text className="mt-0.5 font-caption text-[11px] text-ash">{sub}</Text>}
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
  const triggerFeedback = useButtonFeedback();
  return (
    <View className="mx-4 mb-3 flex-row items-center justify-between">
      <Text className="font-button text-[17px] text-text-primary">{title}</Text>
      {action && (
        <Pressable
          onPress={() => {
            triggerFeedback();
            onAction?.();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={action}>
          <Text className="font-caption text-caption text-sky-blue">{action}</Text>
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
      <View className="flex-row items-center px-4 py-3.5">
        <View
          className="mr-3 h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}22` }}>
          <Icon name={iconName} size={20} color={color} strokeWidth={1.5} />
        </View>
        <View className="flex-1">
          <Text className="font-button text-[15px] text-text-primary" numberOfLines={1}>
            {title}
          </Text>
          <Text className="mt-0.5 font-caption text-small text-ash">
            {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <View className="items-end">
          <Text className="font-button text-[15px] text-text-primary">{`-$${Math.abs(amount).toFixed(2)}`}</Text>
          <Text className="mt-0.5 font-caption text-small text-ash">{percentage}%</Text>
        </View>
      </View>
      {showSep && <View className="ml-[72px] h-px bg-stone-surface" />}
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
      <View className="flex-row items-center px-4 py-3.5">
        <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-stone-surface">
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
          <Text className="mt-0.5 font-caption text-small text-ash" numberOfLines={1}>
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
      {showSep && <View className="ml-[72px] h-px bg-stone-surface" />}
    </View>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

export function EmptyPeriod() {
  return (
    <View className="items-center px-4 py-10">
      <HugeiconsIcon icon={ScanEyeIcon} size={44} color={C.textSub} strokeWidth={1} />
      <Text className="mt-4 text-center font-button text-[17px] text-text-primary">
        Nothing spent during this time
      </Text>
      <Text className="mt-2 text-center font-caption text-caption text-ash">
        Make your first payment
      </Text>
    </View>
  );
}
