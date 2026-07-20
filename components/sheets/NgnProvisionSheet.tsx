import React, { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GorhomBottomSheet } from './GorhomBottomSheet';
import { InputField } from '@/components/atoms/InputField';
import { Button } from '@/components/ui';
import { useProvisionNgnVirtualAccount } from '@/api/hooks/useVirtualAccount';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import { NgnIcon } from '@/assets/svg';
import { ShieldKeyIcon, ZapIcon, Building04Icon } from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';

interface NgnProvisionSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const FEATURES = [
  {
    icon: <HugeiconsIcon icon={Building04Icon} size={20} color="#0090ff" />,
    bg: '#EFF6FF',
    title: 'Your own Naira account',
    desc: 'A named account number anyone can transfer Naira into.',
  },
  {
    icon: <HugeiconsIcon icon={ZapIcon} size={20} color="#d48f00" />,
    bg: '#FFFBEB',
    title: 'Instant conversion',
    desc: 'Deposits auto-convert to USDC and split into spend and stash.',
  },
  {
    icon: <HugeiconsIcon icon={ShieldKeyIcon} size={20} color="#00ca48" />,
    bg: '#f0fdf4',
    title: 'Bank-grade security',
    desc: 'Your BVN and NIN are verified once and never stored on your device.',
  },
] as const;

const digitsOnly = (v: string) => v.replace(/\D/g, '');

export function NgnProvisionSheet({ visible, onClose, onSuccess }: NgnProvisionSheetProps) {
  const [bvn, setBvn] = useState('');
  const [nin, setNin] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const { notification, impact } = useHaptics();
  const { mutateAsync: provision, isPending } = useProvisionNgnVirtualAccount();

  const bvnValid = useMemo(() => /^\d{11}$/.test(bvn), [bvn]);
  const ninValid = useMemo(() => /^\d{11}$/.test(nin), [nin]);
  const canSubmit = bvnValid && ninValid && !isPending;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) {
      setFormError('Enter your 11-digit BVN and NIN to continue.');
      return;
    }
    setFormError(null);
    impact();
    playUISound('buttonClick');
    try {
      await provision({ bvn, id_number: nin, id_type: 'nin' });
      notification('success');
      playUISound('transactionSuccess');
      // Never keep raw identifiers around after a successful one-shot submit.
      setBvn('');
      setNin('');
      onSuccess();
    } catch (error) {
      const err = error as { error?: string; message?: string };
      notification('error');
      if (err?.error === 'bvn_nin_required') {
        setFormError('We could not verify your BVN and NIN. Double-check both numbers.');
      } else {
        setFormError(err?.message || 'Something went wrong. Please try again.');
      }
    }
  }, [canSubmit, bvn, nin, provision, notification, impact, onSuccess]);

  return (
    <GorhomBottomSheet visible={visible} onClose={onClose} stackBehavior="push">
      <View className="mb-5 mt-2 items-center">
        <View className="size-14 items-center justify-center overflow-hidden rounded-full">
          <NgnIcon width={56} height={56} />
        </View>
      </View>

      <Text className="mb-2 text-center font-subtitle text-[22px] leading-7 text-charcoal-primary">
        Get your Naira account
      </Text>
      <Text className="mb-7 text-center font-body text-[15px] leading-[22px] text-smoke">
        Verify your BVN and NIN once to unlock a named Naira account. Takes under a minute.
      </Text>

      <View className="mb-6">
        {FEATURES.map((f, i) => (
          <Animated.View
            key={f.title}
            entering={FadeInDown.delay(i * 60 + 80).springify()}
            className="flex-row items-start gap-4"
            style={i < FEATURES.length - 1 ? { marginBottom: 16 } : undefined}>
            <View
              className="h-11 w-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: f.bg }}>
              {f.icon}
            </View>
            <View className="flex-1">
              <Text className="font-subtitle text-[15px] text-charcoal-primary">{f.title}</Text>
              <Text className="mt-0.5 font-body text-[13px] leading-[19px] text-smoke">
                {f.desc}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <View className="gap-4">
        <InputField
          label="Bank Verification Number (BVN)"
          value={bvn}
          onChangeText={(v) => {
            setBvn(digitsOnly(v).slice(0, 11));
            if (formError) setFormError(null);
          }}
          keyboardType="number-pad"
          maxLength={11}
          placeholder="11 digits"
          secureTextEntry
          textContentType="none"
          helperText="Dial *565*0# on your registered line to retrieve it."
        />
        <InputField
          label="National Identification Number (NIN)"
          value={nin}
          onChangeText={(v) => {
            setNin(digitsOnly(v).slice(0, 11));
            if (formError) setFormError(null);
          }}
          keyboardType="number-pad"
          maxLength={11}
          placeholder="11 digits"
          secureTextEntry
          textContentType="none"
        />
      </View>

      {formError ? (
        <View className="mt-4 rounded-2xl bg-coral-red/10 px-4 py-3">
          <Text className="font-body text-[13px] text-coral-red">{formError}</Text>
        </View>
      ) : null}

      <View className="mt-6">
        <Button
          title={isPending ? 'Verifying…' : 'Create Naira account'}
          onPress={handleSubmit}
          disabled={!canSubmit}
          loading={isPending}
          variant="black"
        />
      </View>

      <Text className="mb-2 mt-4 text-center font-body text-[12px] text-smoke">
        Your BVN and NIN are sent securely once and never stored on this device.
      </Text>
    </GorhomBottomSheet>
  );
}
