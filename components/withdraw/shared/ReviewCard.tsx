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

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between px-5 py-4">
      <Text className="font-body text-[14px] text-text-secondary">{label}</Text>
      <Text
        className="ml-6 max-w-[60%] text-right font-subtitle text-[14px] text-text-primary"
        numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function Sep() {
  return <View className="mx-5 h-px bg-stone-surface" />;
}
