import React from 'react';
import { View, Text, Linking } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { Button } from '@/components/ui';
import { Shield, AlertTriangle, Clock } from 'lucide-react-native';
import type { KYCStatusResponse } from '@/api/types';

interface KYCVerificationSheetProps {
  visible: boolean;
  onClose: () => void;
  kycStatus: KYCStatusResponse | undefined;
  kycLink?: string;
}

const STATUS_CONFIG = {
  not_started: {
    Icon: Shield,
    iconBg: '#F0F0FF',
    iconColor: '#6366F1',
    title: 'Verify Your Identity',
    description:
      'Complete identity verification to deposit funds via bank transfer. It only takes a few minutes.',
    buttonTitle: 'Start Verification',
  },
  pending: {
    Icon: Clock,
    iconBg: '#FFF7ED',
    iconColor: '#F97316',
    title: 'Verification In Progress',
    description: 'Your identity verification is being reviewed. This usually takes a few minutes.',
    buttonTitle: 'Check Status',
  },
  rejected: {
    Icon: AlertTriangle,
    iconBg: '#FEF2F2',
    iconColor: '#EF4444',
    title: 'Verification Failed',
    description:
      'Your identity verification was unsuccessful. Please try again with valid documents.',
    buttonTitle: 'Retry Verification',
  },
} as const;

export function KYCVerificationSheet({
  visible,
  onClose,
  kycStatus,
  kycLink,
}: KYCVerificationSheetProps) {
  const overallStatus = kycStatus?.overall_status ?? 'not_started';
  const config =
    STATUS_CONFIG[overallStatus as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.not_started;
  const { Icon, iconBg, iconColor, title, description, buttonTitle } = config;
  const isPending = overallStatus === 'pending';

  const handleVerify = () => {
    if (kycLink) {
      Linking.openURL(kycLink);
    }
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="items-center pb-4 pt-2">
        <View
          className="mb-5 h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: iconBg }}>
          <Icon size={28} color={iconColor} />
        </View>

        <Text className="mb-2 text-center font-subtitle text-xl text-gray-900">{title}</Text>
        <Text className="mb-6 text-center font-body text-[15px] leading-[22px] text-gray-500">
          {description}
        </Text>

        {kycStatus?.rejection_reason && (
          <View className="mb-4 w-full rounded-2xl bg-red-50 px-4 py-3">
            <Text className="font-body text-[13px] text-red-600">{kycStatus.rejection_reason}</Text>
          </View>
        )}

        <View className="w-full gap-y-3">
          <Button
            title={buttonTitle}
            variant="black"
            size="large"
            onPress={handleVerify}
            disabled={isPending && !kycLink}
          />
        </View>
      </View>
    </BottomSheet>
  );
}
