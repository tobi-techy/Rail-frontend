import { View, Text, Pressable } from 'react-native';
import React from 'react';
import { IconComponent as HugeiconsIcon, Copy01Icon, CheckmarkCircle01Icon } from '@/lib/icons';
import * as Haptics from '@/utils/platformHaptics';
import * as Clipboard from 'expo-clipboard';

/* ── Clean card with subtle stone border (DESIGN.md surface 2) ───────── */
export function DetailCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View
      className={`overflow-hidden rounded-[17px] border border-stone-surface bg-white ${className}`}>
      {children}
    </View>
  );
}

/* ── Field row: label (left) + value (right) ───────────────────────────── */
export function DetailField({
  label,
  value,
  copyable,
  mono,
  tone = 'default',
  leading,
  last,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  mono?: boolean;
  tone?: 'default' | 'success' | 'danger' | 'primary';
  leading?: React.ReactNode;
  last?: boolean;
}) {
  const onCopy = async () => {
    if (!copyable) return;
    await Clipboard.setStringAsync(value);
    void Haptics.selectionAsync();
  };

  const valueColor =
    tone === 'success'
      ? 'text-meadow-green'
      : tone === 'danger'
        ? 'text-coral-red'
        : tone === 'primary'
          ? 'text-ember-orange'
          : 'text-charcoal-primary';

  const body = (
    <View
      className={`flex-row items-center justify-between px-5 py-4 ${last ? '' : 'border-b border-stone-surface'}`}>
      <Text className="font-body text-[14px] text-text-secondary" maxFontSizeMultiplier={1.4}>
        {label}
      </Text>
      <View className="ml-4 flex-1 flex-row items-center justify-end gap-2">
        {leading}
        <Text
          className={`text-right ${mono ? 'font-mono-semibold text-[15px]' : 'font-subtitle text-[14px]'} ${valueColor}`}
          style={mono ? { fontVariant: ['tabular-nums'], letterSpacing: 0.3 } : undefined}
          numberOfLines={1}
          maxFontSizeMultiplier={1.3}>
          {value}
        </Text>
      </View>
    </View>
  );

  if (copyable) {
    return (
      <Pressable
        onPress={onCopy}
        className="active:opacity-60"
        accessibilityRole="button"
        accessibilityLabel={`Copy ${label}`}>
        <View
          className={`flex-row items-center justify-between px-5 py-4 ${last ? '' : 'border-b border-stone-surface'}`}>
          <Text className="font-body text-[14px] text-text-secondary" maxFontSizeMultiplier={1.4}>
            {label}
          </Text>
          <View className="ml-4 flex-1 flex-row items-center justify-end gap-2">
            <Text
              className={`text-right ${mono ? 'font-mono-semibold text-[15px]' : 'font-subtitle text-[14px]'} ${valueColor}`}
              style={mono ? { fontVariant: ['tabular-nums'], letterSpacing: 0.3 } : undefined}
              numberOfLines={1}
              maxFontSizeMultiplier={1.3}>
              {value.length > 24 ? `${value.slice(0, 10)}…${value.slice(-8)}` : value}
            </Text>
            <HugeiconsIcon icon={Copy01Icon} size={15} color="#848281" />
          </View>
        </View>
      </Pressable>
    );
  }

  return body;
}

/* ── Status pill badge ───────────────────────────────────────────────── */
export function StatusBadge({
  status,
  label,
}: {
  status: 'completed' | 'failed' | 'pending' | 'processing';
  label?: string;
}) {
  const config = {
    completed: { bg: '#f0fdf4', text: '#00ca48', icon: CheckmarkCircle01Icon },
    failed: { bg: '#fff1f2', text: '#ff2b3a', icon: null },
    pending: { bg: '#fff7ed', text: '#d48f00', icon: null },
    processing: { bg: '#F0F4FF', text: '#0090ff', icon: null },
  };

  const c = config[status];
  const text =
    label ?? (status === 'completed' ? 'Completed' : status === 'failed' ? 'Failed' : 'Processing');

  return (
    <View
      className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
      style={{ backgroundColor: c.bg }}>
      {c.icon && <HugeiconsIcon icon={c.icon} size={14} color={c.text} strokeWidth={2} />}
      <Text
        className="font-subtitle text-[12px]"
        style={{ color: c.text }}
        maxFontSizeMultiplier={1.3}>
        {text}
      </Text>
    </View>
  );
}

/* ── Sender / Receiver row with avatar/icon ───────────────────────────── */
export function SenderReceiver({
  fromLabel,
  fromValue,
  fromIcon,
  toLabel,
  toValue,
  toIcon,
}: {
  fromLabel: string;
  fromValue: string;
  fromIcon?: React.ReactNode;
  toLabel: string;
  toValue: string;
  toIcon?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-4 px-5 py-5">
      {/* From */}
      <View className="flex-1">
        <Text
          className="font-caption text-[11px] uppercase tracking-wider text-text-secondary"
          maxFontSizeMultiplier={1.3}>
          {fromLabel}
        </Text>
        <View className="mt-2 flex-row items-center gap-2.5">
          {fromIcon && (
            <View className="size-9 items-center justify-center overflow-hidden rounded-full bg-stone-surface">
              {fromIcon}
            </View>
          )}
          <Text
            className="font-subtitle text-[15px] text-charcoal-primary"
            numberOfLines={1}
            maxFontSizeMultiplier={1.3}>
            {fromValue}
          </Text>
        </View>
      </View>

      {/* Arrow */}
      <View className="size-8 items-center justify-center rounded-full bg-stone-surface">
        <Text className="font-mono-semibold text-[12px] text-text-secondary">→</Text>
      </View>

      {/* To */}
      <View className="flex-1">
        <Text
          className="font-caption text-[11px] uppercase tracking-wider text-text-secondary"
          maxFontSizeMultiplier={1.3}>
          {toLabel}
        </Text>
        <View className="mt-2 flex-row items-center gap-2.5">
          {toIcon && (
            <View className="size-9 items-center justify-center overflow-hidden rounded-full bg-stone-surface">
              {toIcon}
            </View>
          )}
          <Text
            className="font-subtitle text-[15px] text-charcoal-primary"
            numberOfLines={1}
            maxFontSizeMultiplier={1.3}>
            {toValue}
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ── Large amount hero with metadata ──────────────────────────────────── */
export function AmountHero({
  amount,
  subtitle,
  status,
  currency,
}: {
  amount: string;
  subtitle?: string;
  status?: 'completed' | 'failed' | 'pending' | 'processing';
  currency?: string;
}) {
  return (
    <View className="items-center py-8">
      {status && (
        <View className="mb-4">
          <StatusBadge status={status} />
        </View>
      )}
      <Text
        className="font-mono-bold text-[40px] leading-[44px] text-charcoal-primary"
        style={{ letterSpacing: -1.5, fontVariant: ['tabular-nums'] }}
        maxFontSizeMultiplier={1.2}>
        {amount}
      </Text>
      {currency && (
        <Text
          className="mt-1 font-body text-[14px] text-text-secondary"
          maxFontSizeMultiplier={1.4}>
          {currency}
        </Text>
      )}
      {subtitle && (
        <Text
          className="mt-1 font-body text-[13px] text-text-secondary"
          maxFontSizeMultiplier={1.4}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

/* ── Section label ─────────────────────────────────────────────────────── */
export function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      className="mb-2 ml-1 font-body text-[11px] uppercase tracking-wider text-text-secondary"
      maxFontSizeMultiplier={1.3}>
      {children}
    </Text>
  );
}

/* ── Separator inside cards ────────────────────────────────────────────── */
export function Hairline() {
  return <View className="mx-5 h-px bg-stone-surface" />;
}
