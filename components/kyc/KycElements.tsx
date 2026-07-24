import React from 'react';
import { View, Text } from 'react-native';
import { ActivityIndicator } from 'react-native';
import { NgnIcon } from '@/assets/svg';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';
import { ShieldKeyIcon, CheckmarkCircle01Icon } from '@/lib/icons';
import { Button } from '@/components/ui';

// ── Loading States ─────────────────────────────────────────────

export function KycLoadingSpinner({ label }: { label?: string }) {
  return (
    <View className="items-center py-12">
      <ActivityIndicator size="small" color="#343433" />
      {label && (
        <Text className="mt-3 font-body text-[13px] text-ash" maxFontSizeMultiplier={1.4}>
          {label}
        </Text>
      )}
    </View>
  );
}

export function KycFullPageLoading({
  label = 'Checking your verification status...',
}: {
  label?: string;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="mb-4 size-12 items-center justify-center rounded-full bg-stone-surface">
        <HugeiconsIcon icon={ShieldKeyIcon} size={24} color="#343433" />
      </View>
      <Text
        className="text-center font-display text-[23px] text-charcoal-primary"
        maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
      <Text
        className="mt-2 text-center font-body text-[15px] leading-6 text-ash"
        maxFontSizeMultiplier={1.4}>
        This usually takes a few seconds.
      </Text>
    </View>
  );
}

// ── Success States ─────────────────────────────────────────────

export function KycSuccess({
  title = "You're all set!",
  description,
  actionLabel = 'Done',
  onAction,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction: () => void;
}) {
  return (
    <>
      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-4 size-12 items-center justify-center rounded-full bg-emerald-50">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={28} color="#00C853" />
        </View>
        <Text
          className="text-center font-display text-[23px] text-charcoal-primary"
          maxFontSizeMultiplier={1.3}>
          {title}
        </Text>
        {description && (
          <Text
            className="mt-2 text-center font-body text-[15px] leading-6 text-ash"
            maxFontSizeMultiplier={1.4}>
            {description}
          </Text>
        )}
      </View>
      <View className="px-6 pb-6">
        <Button title={actionLabel} onPress={onAction} />
      </View>
    </>
  );
}

// ── Error Banner ───────────────────────────────────────────────

export function KycErrorBanner({ message }: { message: string }) {
  return (
    <View className="mt-4 rounded-2xl bg-coral-red/10 px-4 py-3">
      <Text className="font-body text-[13px] leading-5 text-coral-red" maxFontSizeMultiplier={1.4}>
        {message}
      </Text>
    </View>
  );
}

export function KycWarningBanner({ message }: { message: string }) {
  return (
    <View className="mt-4 rounded-2xl bg-orange-50 px-4 py-3">
      <Text className="font-body text-[13px] leading-5 text-orange-700" maxFontSizeMultiplier={1.4}>
        {message}
      </Text>
    </View>
  );
}

// ── NGN-Specific States ────────────────────────────────────────

export function NgnAccountLoading() {
  return (
    <View className="items-center py-12">
      <ActivityIndicator size="small" color="#343433" />
      <Text className="mt-3 font-body text-[13px] text-ash" maxFontSizeMultiplier={1.4}>
        Loading account details...
      </Text>
    </View>
  );
}

export function NgnProvisioning() {
  return (
    <View className="items-center py-12">
      <View className="mb-4 size-12 items-center justify-center rounded-full bg-stone-surface">
        <NgnIcon width={24} height={24} />
      </View>
      <Text
        className="text-center font-display text-[23px] text-charcoal-primary"
        maxFontSizeMultiplier={1.3}>
        Setting up your Naira account
      </Text>
      <Text
        className="mt-2 text-center font-body text-[15px] leading-6 text-ash"
        maxFontSizeMultiplier={1.4}>
        This usually takes a few seconds.
      </Text>
    </View>
  );
}

export function NgnNeedsVerification({ onPress }: { onPress: () => void }) {
  return (
    <View className="items-center py-6">
      <View className="mb-4 size-16 items-center justify-center overflow-hidden rounded-full">
        <NgnIcon width={64} height={64} />
      </View>
      <Text className="mb-1 font-subtitle text-[17px] text-charcoal-primary">
        Get your Naira account
      </Text>
      <Text className="mb-6 text-center font-body text-[13px] text-ash">
        Verify your identity to receive Naira transfers into a named account.
      </Text>
      <Button title="Verify identity" onPress={onPress} variant="orange" />
    </View>
  );
}

export function NgnReadyToProvision({ onPress }: { onPress: () => void }) {
  return (
    <View className="items-center py-6">
      <View className="mb-4 size-16 items-center justify-center overflow-hidden rounded-full">
        <NgnIcon width={64} height={64} />
      </View>
      <Text className="mb-1 font-subtitle text-[17px] text-charcoal-primary">
        Set up your Naira account
      </Text>
      <Text className="mb-6 text-center font-body text-[13px] text-ash">
        Your identity is verified. Tap below to generate your account details.
      </Text>
      <Button title="Set up account" onPress={onPress} variant="orange" />
    </View>
  );
}

export function NgnLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="items-center py-6">
      <Text className="mb-1 font-subtitle text-[17px] text-charcoal-primary">
        Couldn&apos;t load account
      </Text>
      <Text className="mb-6 text-center font-body text-[13px] text-ash">
        Something went wrong fetching your Naira account details.
      </Text>
      <Button title="Try again" onPress={onRetry} variant="orange" />
    </View>
  );
}
