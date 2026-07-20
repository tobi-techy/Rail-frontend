import { View, Text } from 'react-native';

export function ReviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-3">
      <Text className="mb-2 ml-1 font-body text-[12px] uppercase tracking-wider text-text-secondary">
        {title}
      </Text>
      <View className="overflow-hidden rounded-3xl bg-surface">{children}</View>
    </View>
  );
}

export function DetailRow({
  label,
  value,
  leading,
}: {
  label: string;
  value: string;
  /** Optional accessory rendered just before the value (e.g. a bank logo). */
  leading?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between px-5 py-4">
      <Text className="font-body text-[14px] text-text-secondary">{label}</Text>
      <View className="ml-6 max-w-[60%] flex-row items-center gap-2">
        {leading}
        <Text className="text-right font-subtitle text-[14px] text-text-primary" numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export function Sep() {
  return <View className="mx-5 h-px bg-stone-surface" />;
}
