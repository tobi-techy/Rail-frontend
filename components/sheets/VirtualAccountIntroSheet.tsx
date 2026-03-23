import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BottomSheet } from './BottomSheet';
import { Button } from '@/components/ui';
import { useCreateVirtualAccount } from '@/api/hooks/useVirtualAccount';
import { virtualAccountService } from '@/api/services/virtualAccount.service';
import { BankIcon } from '@/assets/svg/filled';
import { UsdIcon } from '@/assets/svg';
import { Building04Icon, ShieldKeyIcon, ZapIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

interface VirtualAccountIntroSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currency?: 'USD' | 'EUR' | 'GBP';
}

const FEATURES = [
  {
    icon: <HugeiconsIcon icon={Building04Icon} size={20} color="#3B82F6" />,
    bg: '#EFF6FF',
    title: 'Your own bank account',
    desc: 'A dedicated USD account in your name, ready for ACH and wire transfers.',
  },
  {
    icon: <HugeiconsIcon icon={ZapIcon} size={20} color="#F59E0B" />,
    bg: '#FFFBEB',
    title: 'Instant conversion',
    desc: 'Deposits auto-convert to USDC and split 70/30 into spend and invest.',
  },
  {
    icon: <HugeiconsIcon icon={ShieldKeyIcon} size={20} color="#10B981" />,
    bg: '#ECFDF5',
    title: 'Secured by Bridge',
    desc: 'Bank-grade infrastructure with FDIC-eligible custody partners.',
  },
] as const;

export function VirtualAccountIntroSheet({
  visible,
  onClose,
  onSuccess,
  currency = 'USD',
}: VirtualAccountIntroSheetProps) {
  const [awaitingTos, setAwaitingTos] = useState(false);
  const { mutate: create, isPending, error, reset } = useCreateVirtualAccount();

  const isTosError = (err: unknown) => {
    const e = err as any;
    return (
      e?.code === 'has_not_accepted_tos' ||
      String(e?.message ?? '').includes('has_not_accepted_tos')
    );
  };

  const handleCreate = () => {
    create(currency, {
      onSuccess,
      onError: async (err) => {
        if (isTosError(err)) {
          try {
            const res = await virtualAccountService.getTOSLink();
            const url = res?.tos_link;
            if (!url) throw new Error('No ToS link returned');
            setAwaitingTos(true);
            await WebBrowser.openAuthSessionAsync(url);
            setAwaitingTos(false);
            reset();
            create(currency, { onSuccess });
          } catch {
            setAwaitingTos(false);
          }
        }
      },
    });
  };

  const loading = isPending || awaitingTos;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {/* Header icons */}
      <View className="mb-5 mt-2 items-center">
        <View className="flex-row items-center">
          <View className="z-10 h-14 w-14 items-center justify-center rounded-full bg-gray-900">
            <BankIcon width={26} height={26} color="#fff" />
          </View>
          <View className="-ml-3 h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-gray-100 bg-white">
            <UsdIcon width={56} height={56} />
          </View>
        </View>
      </View>

      {/* Title */}
      <Text className="mb-2 text-center font-subtitle text-[22px] leading-7 text-gray-900">
        Get a virtual {currency} account
      </Text>
      <Text className="mb-8 text-center font-body text-[15px] leading-[22px] text-gray-400">
        Receive bank transfers directly into Rail.{'\n'}Your money starts working immediately.
      </Text>

      {/* Features */}
      <View className="mb-8">
        {FEATURES.map((f, i) => (
          <Animated.View
            key={f.title}
            entering={FadeInDown.delay(i * 60 + 100).springify()}
            className="flex-row items-start gap-4"
            style={i < FEATURES.length - 1 ? { marginBottom: 20 } : undefined}>
            <View
              className="h-11 w-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: f.bg }}>
              {f.icon}
            </View>
            <View className="flex-1">
              <Text className="font-subtitle text-[15px] text-gray-900">{f.title}</Text>
              <Text className="mt-0.5 font-body text-[13px] leading-[19px] text-gray-400">
                {f.desc}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>

      {/* Error */}
      {error && !isTosError(error) && (
        <View className="mb-4 rounded-2xl bg-red-50 px-4 py-3">
          <Text className="font-body text-[13px] text-red-600">
            {(error as any)?.message ?? 'Something went wrong. Please try again.'}
          </Text>
        </View>
      )}

      {awaitingTos && (
        <View className="mb-4 rounded-2xl bg-amber-50 px-4 py-3">
          <Text className="font-body text-[13px] text-amber-700">
            Accept the Terms of Service in your browser, then return here.
          </Text>
        </View>
      )}

      {/* Disclaimer */}
      <Text className="mb-4 text-center font-body text-[12px] text-gray-300">
        *Available to US residents. Not available in NY and AK.
      </Text>

      {/* CTA */}
      <Button
        title={loading ? 'Setting up…' : `Create ${currency} Account`}
        onPress={handleCreate}
        disabled={loading}
        variant="black"
      />

      {/* Cancel */}
      <TouchableOpacity onPress={onClose} className="mt-3 items-center py-2">
        <Text className="font-body text-[15px] text-gray-400">Cancel</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}
