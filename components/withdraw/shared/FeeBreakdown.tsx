import { View, Text } from 'react-native';
import { formatCurrency } from '@/components/withdraw/method-screen/utils';

interface FeeRow {
  label: string;
  value: string;
}

interface FeeBreakdownProps {
  rows: FeeRow[];
  total: string;
}

export function FeeBreakdown({ rows, total }: FeeBreakdownProps) {
  return (
    <View className="gap-1.5">
      {rows.map((row) => (
        <View key={row.label} className="flex-row items-center justify-between px-1">
          <Text className="font-body text-[13px] text-text-secondary">{row.label}</Text>
          <Text className="font-body text-[13px] text-text-primary">{row.value}</Text>
        </View>
      ))}
      <View className="mx-1 my-1 h-px bg-stone-surface" />
      <View className="flex-row items-center justify-between px-1">
        <Text className="font-subtitle text-[14px] text-text-primary">Total</Text>
        <Text className="font-subtitle text-[16px] text-text-primary">{total}</Text>
      </View>
    </View>
  );
}
