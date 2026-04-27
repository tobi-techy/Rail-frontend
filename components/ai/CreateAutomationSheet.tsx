import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Calendar03Icon,
  Wallet01Icon,
  FlashIcon,
  RepeatIcon,
  ArrowMoveUpRightIcon,
  Notification01Icon,
} from '@hugeicons/core-free-icons';
import { GorhomBottomSheet } from '@/components/sheets/GorhomBottomSheet';
import { aiService } from '@/api/services/ai.service';
import { useHaptics } from '@/hooks/useHaptics';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const TRIGGERS = [
  {
    type: 'schedule',
    label: 'Every week',
    icon: Calendar03Icon,
    config: { weekdays: [5], hour: 9 },
  },
  {
    type: 'schedule',
    label: 'Every month',
    icon: Calendar03Icon,
    config: { weekdays: [], hour: 9 },
  },
  {
    type: 'balance_threshold',
    label: 'Balance below $100',
    icon: Wallet01Icon,
    config: { wallet: 'spend', operator: 'below', threshold: 100 },
  },
  { type: 'payday', label: 'When I get paid', icon: RepeatIcon, config: {} },
  { type: 'spending_spike', label: 'Spending spike', icon: FlashIcon, config: {} },
] as const;

const ACTIONS = [
  { type: 'transfer_to_stash', label: 'Move to stash', icon: ArrowMoveUpRightIcon },
  { type: 'transfer_to_spend', label: 'Move to spend', icon: Wallet01Icon },
  { type: 'notify', label: 'Just notify me', icon: Notification01Icon },
] as const;

export function CreateAutomationSheet({ visible, onClose, onCreated }: Props) {
  const { impact, notification } = useHaptics();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedTrigger, setSelectedTrigger] = useState<number | null>(null);
  const [selectedAction, setSelectedAction] = useState<number | null>(null);
  const [amount, setAmount] = useState('20');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setStep(0);
    setName('');
    setSelectedTrigger(null);
    setSelectedAction(null);
    setAmount('20');
  };

  const handleCreate = async () => {
    if (selectedTrigger === null || selectedAction === null) return;
    setLoading(true);
    try {
      const trigger = TRIGGERS[selectedTrigger];
      const action = ACTIONS[selectedAction];
      await aiService.createAutomation({
        name: name || `${trigger.label} → ${action.label}`,
        trigger_type: trigger.type as any,
        trigger_config: trigger.config,
        action_type: action.type as any,
        action_config: { amount: parseFloat(amount), from_wallet: 'spend', to_wallet: 'stash' },
      });
      notification('success');
      reset();
      onCreated();
    } catch {
      notification('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GorhomBottomSheet
      visible={visible}
      onClose={() => {
        reset();
        onClose();
      }}
      snapPoints={['70%']}
      dismissible>
      <ScrollView className="px-5 pb-8 pt-2" showsVerticalScrollIndicator={false}>
        {/* Step indicator */}
        <View className="mb-5 flex-row items-center justify-center gap-2">
          {[0, 1, 2].map((s) => (
            <View
              key={s}
              className="h-1 rounded-full"
              style={{
                width: s === step ? 24 : 8,
                backgroundColor: s <= step ? '#000' : '#E5E5E5',
              }}
            />
          ))}
        </View>

        {step === 0 && (
          <>
            <Text className="font-heading-bold mb-1 text-lg text-text-primary">
              When should this trigger?
            </Text>
            <Text className="mb-5 font-body text-sm text-text-secondary">
              Pick what starts the automation
            </Text>
            {TRIGGERS.map((t, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  impact();
                  setSelectedTrigger(i);
                  setStep(1);
                }}
                className={`mb-3 flex-row items-center rounded-2xl border px-4 py-4 ${selectedTrigger === i ? 'border-primary bg-[#FFF5F3]' : 'border-black/[0.06] bg-white'}`}
                accessibilityRole="button"
                accessibilityLabel={t.label}>
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5]">
                  <HugeiconsIcon icon={t.icon} size={18} color="#000" />
                </View>
                <Text className="font-body-medium text-[15px] text-text-primary">{t.label}</Text>
              </Pressable>
            ))}
          </>
        )}

        {step === 1 && (
          <>
            <Pressable
              onPress={() => setStep(0)}
              className="mb-4"
              accessibilityRole="button"
              accessibilityLabel="Go back">
              <Text className="font-body-medium text-[14px] text-text-secondary">Back</Text>
            </Pressable>
            <Text className="font-heading-bold mb-1 text-lg text-text-primary">
              What should happen?
            </Text>
            <Text className="mb-5 font-body text-sm text-text-secondary">
              Pick the action to perform
            </Text>
            {ACTIONS.map((a, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  impact();
                  setSelectedAction(i);
                  setStep(2);
                }}
                className={`mb-3 flex-row items-center rounded-2xl border px-4 py-4 ${selectedAction === i ? 'border-primary bg-[#FFF5F3]' : 'border-black/[0.06] bg-white'}`}
                accessibilityRole="button"
                accessibilityLabel={a.label}>
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5]">
                  <HugeiconsIcon icon={a.icon} size={18} color="#000" />
                </View>
                <Text className="font-body-medium text-[15px] text-text-primary">{a.label}</Text>
              </Pressable>
            ))}
          </>
        )}

        {step === 2 && (
          <>
            <Pressable
              onPress={() => setStep(1)}
              className="mb-4"
              accessibilityRole="button"
              accessibilityLabel="Go back">
              <Text className="font-body-medium text-[14px] text-text-secondary">Back</Text>
            </Pressable>
            <Text className="font-heading-bold mb-1 text-lg text-text-primary">How much?</Text>
            <Text className="mb-5 font-body text-sm text-text-secondary">
              Set the amount and name
            </Text>

            <View className="mb-4 flex-row items-center rounded-2xl bg-[#F5F5F5] px-4 py-4">
              <Text className="mr-1 font-mono-semibold text-2xl text-text-primary">$</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                className="flex-1 font-mono-semibold text-2xl text-text-primary"
                placeholder="0"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Name this rule (optional)"
              placeholderTextColor="#9CA3AF"
              className="mb-6 rounded-2xl bg-[#F5F5F5] px-4 py-4 font-body text-[15px] text-text-primary"
            />

            <Pressable
              onPress={handleCreate}
              disabled={loading}
              className="items-center rounded-full bg-black py-5"
              style={{ opacity: loading ? 0.6 : 1 }}
              accessibilityRole="button"
              accessibilityLabel="Create automation">
              <Text className="font-heading-bold text-[16px] text-white">
                {loading ? 'Creating...' : 'Create rule'}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </GorhomBottomSheet>
  );
}
