import React, { useState } from 'react';
import { ActivityIndicator, View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import * as Haptics from '@/utils/platformHaptics';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';
import {
  Calendar03Icon,
  Wallet01Icon,
  FlashIcon,
  RepeatIcon,
  ArrowMoveUpRightIcon,
  Notification03Icon,
} from '@/lib/icons';
import { GorhomBottomSheet } from '@/components/sheets/GorhomBottomSheet';
import { PasscodeInput } from '@/components/molecules/PasscodeInput';
import { aiService } from '@/api/services/ai.service';
import { useVerifyPasscode } from '@/api/hooks';
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
  { type: 'notify', label: 'Just notify me', icon: Notification03Icon },
] as const;

export function CreateAutomationSheet({ visible, onClose, onCreated }: Props) {
  const { impact, notification } = useHaptics();
  const verifyPasscode = useVerifyPasscode();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedTrigger, setSelectedTrigger] = useState<number | null>(null);
  const [selectedAction, setSelectedAction] = useState<number | null>(null);
  const [amount, setAmount] = useState('20');
  const [loading, setLoading] = useState(false);
  const [passcodeOpen, setPasscodeOpen] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  const reset = () => {
    setStep(0);
    setName('');
    setSelectedTrigger(null);
    setSelectedAction(null);
    setAmount('20');
    setPasscodeOpen(false);
    setPasscode('');
    setPasscodeError('');
  };

  const createRule = async (acknowledgedFutureTransfer = false) => {
    if (selectedTrigger === null || selectedAction === null) return;
    setLoading(true);
    try {
      const trigger = TRIGGERS[selectedTrigger];
      const action = ACTIONS[selectedAction];
      const isTransfer = action.type === 'transfer_to_stash' || action.type === 'transfer_to_spend';
      await aiService.createAutomation({
        name: name || `${trigger.label} → ${action.label}`,
        trigger_type: trigger.type as any,
        trigger_config: trigger.config,
        action_type: action.type as any,
        action_config: isTransfer
          ? {
              amount: parseFloat(amount),
              from_wallet: action.type === 'transfer_to_stash' ? 'spend' : 'stash',
              to_wallet: action.type === 'transfer_to_stash' ? 'stash' : 'spend',
              acknowledged_future_transfer: acknowledgedFutureTransfer,
            }
          : { message: name || `${trigger.label} reminder` },
        acknowledged_future_transfer: acknowledgedFutureTransfer,
      });
      notification(Haptics.NotificationFeedbackType.Success);
      reset();
      onCreated();
    } catch {
      notification(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (selectedAction === null) return;
    const action = ACTIONS[selectedAction];
    const isTransfer = action.type === 'transfer_to_stash' || action.type === 'transfer_to_spend';
    if (isTransfer) {
      setPasscode('');
      setPasscodeError('');
      setPasscodeOpen(true);
      return;
    }
    await createRule(false);
  };

  const handlePasscodeComplete = async (code: string) => {
    if (verifyPasscode.isPending || loading) return;
    setPasscode(code);
    setPasscodeError('');
    try {
      const verified = await verifyPasscode.mutateAsync({ passcode: code });
      if (!verified.verified) {
        setPasscodeError('Incorrect PIN');
        setPasscode('');
        return;
      }
      setPasscodeOpen(false);
      await createRule(true);
    } catch (error: any) {
      setPasscodeError(error?.message ?? 'PIN verification failed');
      setPasscode('');
    }
  };

  return (
    <>
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
              <Text className="mb-1 font-heading-bold text-lg text-text-primary">
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
                  <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-[#f2f0ed]">
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
              <Text className="mb-1 font-heading-bold text-lg text-text-primary">
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
                  <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-[#f2f0ed]">
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
              <Text className="mb-1 font-heading-bold text-lg text-text-primary">How much?</Text>
              <Text className="mb-5 font-body text-sm text-text-secondary">
                Set the amount and name
              </Text>

              <View className="mb-4 flex-row items-center rounded-2xl bg-[#f2f0ed] px-4 py-4">
                <Text className="mr-1 font-mono-semibold text-2xl text-text-primary">$</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  className="flex-1 font-mono-semibold text-2xl text-text-primary"
                  placeholder="0"
                  placeholderTextColor="#848281"
                />
              </View>

              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Name this rule (optional)"
                placeholderTextColor="#848281"
                className="mb-6 rounded-2xl bg-[#f2f0ed] px-4 py-4 font-body text-[15px] text-text-primary"
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

      <GorhomBottomSheet
        visible={passcodeOpen}
        onClose={() => {
          setPasscodeOpen(false);
          setPasscode('');
          setPasscodeError('');
        }}
        snapPoints={['78%']}
        dismissible={!verifyPasscode.isPending && !loading}>
        <PasscodeInput
          title="Authorize automation"
          subtitle="This PIN verifies scheduled transfer consent. Miriam will request it again after the reauthorization window."
          value={passcode}
          onValueChange={setPasscode}
          onComplete={handlePasscodeComplete}
          errorText={passcodeError}
          showToggle
          autoSubmit
          variant="light"
        />
        {(verifyPasscode.isPending || loading) && (
          <View className="absolute bottom-10 left-0 right-0 items-center">
            <ActivityIndicator color="#24383C" />
          </View>
        )}
      </GorhomBottomSheet>
    </>
  );
}
