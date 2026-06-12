import React, { useCallback, useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { GorhomBottomSheet } from '@/components/sheets/GorhomBottomSheet';
import { Button } from '@/components/ui';
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

function getActionInfo(action: PendingAction): { title: string; amount?: string } {
  const params = action.params;

  const formatMoney = (amount: unknown, currency: unknown = 'USD') => {
    const numeric = Number(amount ?? 0);
    const code = typeof currency === 'string' && currency ? currency : 'USD';
    if (!Number.isFinite(numeric) || numeric <= 0) return undefined;
    return code === 'USD' ? `$${numeric.toFixed(2)}` : `${code} ${numeric.toFixed(2)}`;
  };

  if (action.action === 'transfer_funds') {
    const from = params.from === 'spend' ? 'spend' : 'stash';
    const to = params.to === 'spend' ? 'spend' : 'stash';
    return {
      title: `Move $${params.amount} from ${from} to ${to}`,
      amount: `$${params.amount}`,
    };
  }

  if (action.action === 'update_financial_profile') {
    return { title: 'Save your financial profile' };
  }

  if (action.action === 'set_budget') {
    return {
      title: `Set monthly budget to $${Number(params.monthly_limit ?? 0).toFixed(2)}`,
      amount: `$${Number(params.monthly_limit ?? 0).toFixed(2)}`,
    };
  }

  if (
    action.action === 'create_obligation_reminder' ||
    action.action === 'create_obligation_reminders'
  ) {
    const name = typeof params.name === 'string' && params.name ? params.name : 'this obligation';
    const amount = formatMoney(params.amount, params.currency);
    return {
      title: `Protect money for ${name}`,
      amount,
    };
  }

  if (action.action === 'mark_obligation_paid') {
    const name = typeof params.name === 'string' && params.name ? params.name : 'this obligation';
    return { title: `Mark ${name} as paid` };
  }

  if (action.action === 'protect_subscription') {
    const name = typeof params.name === 'string' && params.name ? params.name : 'this subscription';
    const amount = formatMoney(params.amount, params.currency);
    return {
      title: `Protect ${name} every ${params.frequency ?? 'month'}`,
      amount,
    };
  }

  if (action.action === 'mark_subscription_cancelled') {
    const name = typeof params.name === 'string' && params.name ? params.name : 'this subscription';
    return { title: `Mark ${name} as cancelled` };
  }

  if (action.action === 'ignore_subscription') {
    const name = typeof params.name === 'string' && params.name ? params.name : 'this subscription';
    return { title: `Ignore ${name}` };
  }

  return { title: action.description || 'Confirm this action' };
}

export function ActionConfirmSheet({ action, visible, onClose, onConfirmed, onCancelled }: Props) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const user = useAuthStore((s) => s.user);
  const isBiometricEnabled = useAuthStore((s) => s.isBiometricEnabled);
  const { onTap } = useAIHaptics();

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
    try {
      await aiService.confirmAction(action.conversation_id);
      onConfirmed(action);
    } catch {
      // Silent fail - let parent handle
    } finally {
      setIsConfirming(false);
    }
  }, [action, onConfirmed]);

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
  const info = getActionInfo(action);

  return (
    <GorhomBottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={['35%']}
      dismissible={!loading}>
      <View className="flex-1 px-6 pb-8">
        {/* Content */}
        <View className="flex-1 items-center justify-center">
          {info.amount && (
            <Text className="mb-4 font-mono-semibold text-balance-lg text-charcoal-primary">
              {info.amount}
            </Text>
          )}

          <Text className="mb-6 text-center font-body text-headline-3 leading-7 text-charcoal-primary">
            {info.title}
          </Text>

          <Text className="font-mono-medium text-caption text-ash">
            {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
          </Text>
        </View>

        {/* Actions */}
        <View className="flex-row gap-4">
          <Button title="Cancel" variant="white" onPress={handleCancel} disabled={loading} flex />
          <Button
            title="Confirm"
            variant="black"
            onPress={handleAccept}
            disabled={loading}
            loading={loading}
            flex
          />
        </View>
      </View>
    </GorhomBottomSheet>
  );
}
