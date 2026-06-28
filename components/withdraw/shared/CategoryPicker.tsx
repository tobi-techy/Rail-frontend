import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import {
  IconComponent as HugeiconsIcon,
  ArrowDown01Icon,
  MoneyReceiveSquareIcon,
  CreditCardIcon,
  Coffee01Icon,
  ShoppingBag01Icon,
  Airplane01Icon,
  Wallet01Icon,
  InternetIcon,
  GiftIcon,
  UserMultiple02Icon,
  MoreIcon,
  CheckmarkCircle02Icon,
} from '@/lib/icons';
import { GorhomBottomSheet } from '@/components/sheets/GorhomBottomSheet';
import { useHaptics } from '@/hooks/useHaptics';

const CATEGORIES = [
  { label: 'Transfer', icon: MoneyReceiveSquareIcon, color: '#0090ff' },
  { label: 'Bills', icon: CreditCardIcon, color: '#ff2b3a' },
  { label: 'Food', icon: Coffee01Icon, color: '#F97316' },
  { label: 'Shopping', icon: ShoppingBag01Icon, color: '#9f4fff' },
  { label: 'Travel', icon: Airplane01Icon, color: '#06B6D4' },
  { label: 'Savings', icon: Wallet01Icon, color: '#00ca48' },
  { label: 'Crypto', icon: InternetIcon, color: '#6366F1' },
  { label: 'Friends', icon: UserMultiple02Icon, color: '#EC4899' },
  { label: 'Gifts', icon: GiftIcon, color: '#F59E0B' },
  { label: 'Other', icon: MoreIcon, color: '#848281' },
] as const;

interface CategoryPickerProps {
  value: string;
  onChange: (category: string) => void;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { selection } = useHaptics();
  const selected = CATEGORIES.find((c) => c.label === value) ?? CATEGORIES[0];

  return (
    <>
      <View>
        <Text className="mb-2 font-subtitle text-[13px] text-text-secondary">Category</Text>
        <Pressable
          onPress={() => {
            selection();
            setIsOpen(true);
          }}
          className="flex-row items-center justify-between rounded-lg border border-[#f7f2e8] px-4 py-3.5">
          <View className="flex-row items-center gap-3">
            <View
              className="size-8 items-center justify-center rounded-full"
              style={{ backgroundColor: selected.color + '18' }}>
              <HugeiconsIcon icon={selected.icon} size={16} color={selected.color} />
            </View>
            <Text className="font-body text-[15px] text-text-primary">{selected.label}</Text>
          </View>
          <HugeiconsIcon icon={ArrowDown01Icon} size={18} color="#848281" />
        </Pressable>
      </View>

      <GorhomBottomSheet visible={isOpen} onClose={() => setIsOpen(false)} showCloseButton={false}>
        <Text className="font-subtitle text-[20px] text-text-primary">Select Category</Text>
        <Text className="mb-5 mt-1 font-body text-[13px] text-text-secondary">
          Categorize this transaction for your records
        </Text>
        <View className="gap-1">
          {CATEGORIES.map((cat) => {
            const active = value === cat.label;
            return (
              <Pressable
                key={cat.label}
                onPress={() => {
                  selection();
                  onChange(cat.label);
                  setIsOpen(false);
                }}
                className="flex-row items-center gap-4 rounded-2xl px-4 py-3.5 active:bg-surface"
                style={active ? { backgroundColor: '#f8f7f4' } : undefined}>
                <View
                  className="size-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: cat.color + '18' }}>
                  <HugeiconsIcon icon={cat.icon} size={20} color={cat.color} />
                </View>
                <Text
                  className={`flex-1 text-[15px] ${active ? 'font-subtitle text-text-primary' : 'font-body text-text-secondary'}`}>
                  {cat.label}
                </Text>
                {active && <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} color="#343433" />}
              </Pressable>
            );
          })}
        </View>
      </GorhomBottomSheet>
    </>
  );
}
