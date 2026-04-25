import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowMoveUpRightIcon,
  Target02Icon,
  Tick02Icon,
  Wallet01Icon,
  UserIcon,
} from '@hugeicons/core-free-icons';
import { GorhomBottomSheet } from '@/components/sheets/GorhomBottomSheet';
import { usePasskeyAuthorize } from '@/hooks/usePasskeyAuthorize';
import { useAuthStore } from '@/stores/authStore';
import { useAIHaptics } from '@/hooks/useAIHaptics';
import { aiService } from '@/api/services/ai.service';
import type { PendingAction } from '@/api/types/ai';

interface Props {
  action: PendingAction | null;
  visible: boolean;
  onClose: () => void;
  onConfirmed: (action: PendingAction) => void;
  onCancelled: () => void;
}

function ActionIcon({ action }: { action: string; params: Record<string, any> }) {
  if (action === 'transfer_funds') {
    return <HugeiconsIcon icon={ArrowMoveUpRightIcon} size={28} color="#FF2E01" />;
  }
  if (action === 'set_budget') {
    return <HugeiconsIcon icon={Wallet01Icon} size={28} color="#FF2E01" />;
  }
  if (action === 'update_financial_profile') {
    return <HugeiconsIcon icon={UserIcon} size={28} color="#FF2E01" />;
  }
  return <HugeiconsIcon icon={Target02Icon} size={28} color="#FF2E01" />;
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ActionDetails({ action }: { action: PendingAction }) {
  const params = action.params;

  if (action.action === 'transfer_funds') {
    const from = params.from === 'spend' ? 'Spend' : 'Stash';
    const to = params.to === 'spend' ? 'Spend' : 'Stash';
    const impact = params.impact ?? {};
    return (
      <>
        <DetailRow label="From" value={from} />
        <DetailRow label="To" value={to} />
        <DetailRow label="Amount" value={`$${params.amount}`} bold />
        {impact.source_balance_after && (
          <DetailRow label={`${from} after`} value={`$${impact.source_balance_after}`} />
        )}
        {impact.destination_balance_after && (
          <DetailRow label={`${to} after`} value={`$${impact.destination_balance_after}`} />
        )}
      </>
    );
  }

  if (action.action === 'set_savings_goal') {
    return (
      <>
        <DetailRow label="Goal" value={params.name} />
        <DetailRow label="Target" value={`$${params.target}`} bold />
        {params.deadline && <DetailRow label="By" value={params.deadline} />}
      </>
    );
  }

  if (action.action === 'send_report') {
    return (
      <>
        <DetailRow label="Report" value={params.report_type?.replace('_', ' ') ?? 'Financial'} />
        <DetailRow label="Send to" value={params.email ?? ''} bold />
      </>
    );
  }

  if (action.action === 'set_budget') {
    return (
      <DetailRow
        label="Monthly limit"
        value={`$${Number(params.monthly_limit ?? 0).toFixed(2)}`}
        bold
      />
    );
  }

  if (action.action === 'split_receipt') {
    const participants = Array.isArray(params.participants) ? params.participants.join(', ') : '';
    return (
      <>
        <DetailRow label="Receipt" value={params.receipt_id ?? ''} />
        <DetailRow label="Split with" value={participants} bold />
        {params.message ? <DetailRow label="Message" value={params.message} /> : null}
      </>
    );
  }

  if (action.action === 'update_financial_profile') {
    const hidden = new Set(['updated_via']);
    const entries = Object.entries(params).filter(
      ([key, value]) => !hidden.has(key) && value !== undefined && value !== null && value !== ''
    );
    return (
      <>
        {entries.slice(0, 6).map(([key, value]) => (
          <DetailRow
            key={key}
            label={formatLabel(key)}
            value={String(value)}
            bold={key.includes('target') || key.includes('income')}
          />
        ))}
      </>
    );
  }

  return null;
}

function DetailRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row justify-between items-center py-3 border-b border-black/[0.04]">
      <Text className="font-body text-sm text-text-secondary">{label}</Text>
      <Text className={`${bold ? 'font-mono-semibold text-lg' : 'font-body-medium text-sm'} text-text-primary`}>
        {value}
      </Text>
    </View>
  );
}

export function ActionConfirmSheet({ action, visible, onClose, onConfirmed, onCancelled }: Props) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(120);
  const user = useAuthStore((s) => s.user);
  const isBiometricEnabled = useAuthStore((s) => s.isBiometricEnabled);
  const { onTap, onError: hapticError } = useAIHaptics();

  // Countdown timer — auto-cancel when expired
  useEffect(() => {
    if (!action) return;
    const expiresAt = new Date(action.expires_at).getTime();
    const update = () => {
      const remaining = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) onCancelled();
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [action, onCancelled]);

  const handleAuthorized = useCallback(async () => {
    if (!action) return;
    setIsConfirming(true);
    setError('');
    try {
      await aiService.confirmAction(action.conversation_id);
      onConfirmed(action);
    } catch (e: any) {
      hapticError();
      setError(e?.message || 'Failed to execute action');
    } finally {
      setIsConfirming(false);
    }
  }, [action, onConfirmed, hapticError]);

  const { isPasskeyLoading, onPasskeyAuthorize } = usePasskeyAuthorize({
    email: user?.email,
    passkeyPromptScope: `miriam-action:${action?.id ?? 'none'}`,
    autoTrigger: false,
    onAuthorized: handleAuthorized,
  });

  const handleAccept = useCallback(() => {
    onTap();
    if (isBiometricEnabled) {
      onPasskeyAuthorize();
    } else {
      // No passkey — confirm directly
      handleAuthorized();
    }
  }, [onTap, isBiometricEnabled, onPasskeyAuthorize, handleAuthorized]);

  const handleCancel = useCallback(async () => {
    onTap();
    if (action) {
      try {
        await aiService.cancelAction(action.conversation_id);
      } catch {}
    }
    onCancelled();
  }, [action, onCancelled, onTap]);

  if (!action) return null;

  const loading = isConfirming || isPasskeyLoading;
  const title =
    action.action === 'transfer_funds'
      ? 'Confirm Transfer'
      : action.action === 'send_report'
        ? 'Send Report'
        : action.action === 'set_budget'
          ? 'Set Budget'
          : action.action === 'split_receipt'
            ? 'Split Receipt'
            : action.action === 'update_financial_profile'
              ? 'Save Financial Profile'
              : 'Confirm Goal';

  return (
    <GorhomBottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={['45%']}
      dismissible={!loading}>
      <View className="px-6 pt-2 pb-8">
        {/* Header */}
        <View className="items-center mb-5">
          <View className="w-14 h-14 rounded-full bg-[#FFF0ED] items-center justify-center mb-3">
            <ActionIcon action={action.action} params={action.params} />
          </View>
          <Text className="font-heading-bold text-lg text-text-primary">{title}</Text>
          <Text className="font-body text-[13px] text-text-secondary mt-1 text-center">
            {action.description}
          </Text>
          <Text className={`font-mono-medium text-xs mt-2 ${secondsLeft <= 30 ? 'text-red-600' : 'text-text-secondary'}`}>
            Expires in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
          </Text>
        </View>

        {/* Details */}
        <View className="bg-background rounded-xl px-4 mb-5">
          <ActionDetails action={action} />
        </View>

        {/* Error */}
        {error ? (
          <Text className="font-body text-[13px] text-red-600 text-center mb-3">{error}</Text>
        ) : null}

        {/* Buttons */}
        <Pressable
          onPress={handleAccept}
          disabled={loading}
          className="bg-primary rounded-[14px] py-4 items-center justify-center flex-row gap-2"
          style={{ opacity: loading ? 0.7 : 1 }}
          accessibilityRole="button"
          accessibilityLabel="Accept action">
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <HugeiconsIcon icon={Tick02Icon} size={18} color="#FFF" />
              <Text className="font-heading-bold text-base text-white">Accept</Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={handleCancel}
          disabled={loading}
          className="py-3.5 items-center mt-2"
          accessibilityRole="button"
          accessibilityLabel="Cancel action">
          <Text className="font-body-medium text-[15px] text-text-secondary">Cancel</Text>
        </Pressable>
      </View>
    </GorhomBottomSheet>
  );
}
