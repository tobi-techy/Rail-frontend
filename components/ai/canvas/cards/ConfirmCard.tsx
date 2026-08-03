import React, { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Button } from '@/components/ui';
import { usePasskeyAuthorize } from '@/hooks/usePasskeyAuthorize';
import { useAuthStore } from '@/stores/authStore';
import { useAIHaptics } from '@/hooks/useAIHaptics';
import { aiService } from '@/api/services/ai.service';
import type { PendingAction, UIDirective } from '@/api/types/ai';

interface Props {
  directive: UIDirective;
  onClose: () => void;
}

function money(amount: unknown, currency: unknown = 'USD'): string | undefined {
  const n = Number(amount ?? 0);
  const code = typeof currency === 'string' && currency ? currency : 'USD';
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return code === 'USD' ? `$${n.toFixed(2)}` : `${code} ${n.toFixed(2)}`;
}

function describe(action: PendingAction): { title: string; amount?: string } {
  const p = action.params ?? {};
  switch (action.action) {
    case 'transfer_funds':
      return {
        title: `Move money from ${p.from === 'spend' ? 'Spend' : 'Stash'} to ${p.to === 'spend' ? 'Spend' : 'Stash'}`,
        amount: money(p.amount),
      };
    case 'set_budget':
      return { title: 'Set monthly budget', amount: money(p.monthly_limit) };
    case 'set_savings_goal':
      return { title: `Save for ${p.name ?? 'your goal'}`, amount: money(p.target) };
    case 'create_obligation_reminder':
    case 'create_obligation_reminders':
      return {
        title: `Protect money for ${p.name ?? 'this'}`,
        amount: money(p.amount, p.currency),
      };
    case 'protect_subscription':
      return { title: `Protect ${p.name ?? 'subscription'}`, amount: money(p.amount, p.currency) };
    case 'create_automation': {
      const cfg = (p.action_config as Record<string, unknown>) ?? {};
      return {
        title: action.description || `Automate ${p.name ?? 'a transfer'}`,
        amount: money(p.amount ?? cfg.amount),
      };
    }
    case 'mark_obligation_paid':
      return { title: `Mark ${p.name ?? 'this bill'} as paid` };
    case 'mark_subscription_cancelled':
      return { title: `Mark ${p.name ?? 'this subscription'} as cancelled` };
    case 'ignore_subscription':
      return { title: `Ignore ${p.name ?? 'this subscription'}` };
    case 'update_financial_profile':
      return { title: 'Save your financial profile' };
    default:
      return { title: action.description || 'Confirm this action' };
  }
}

/** Confirm card — derived from the existing pending action (no new backend
 *  shape). Money stays on a solid surface; biometric + countdown preserved. */
export function ConfirmCard({ directive, onClose }: Props) {
  const action = directive.data?.pending_action;
  const [isConfirming, setIsConfirming] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const user = useAuthStore((s) => s.user);
  const isBiometricEnabled = useAuthStore((s) => s.isBiometricEnabled);
  const { onTap } = useAIHaptics();

  useEffect(() => {
    if (!action) return;
    const expiresAt = new Date(action.expires_at).getTime();
    const tick = () => {
      const remaining = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) onClose();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [action, onClose]);

  const handleAuthorized = useCallback(async () => {
    if (!action) return;
    setIsConfirming(true);
    try {
      await aiService.confirmAction(action.conversation_id);
    } catch {
      // surfaced by parent flow
    } finally {
      setIsConfirming(false);
      onClose();
    }
  }, [action, onClose]);

  const { isPasskeyLoading, onPasskeyAuthorize } = usePasskeyAuthorize({
    email: user?.email,
    passkeyPromptScope: `miriam-action:${action?.id ?? 'none'}`,
    autoTrigger: false,
    onAuthorized: handleAuthorized,
  });

  const handleAccept = useCallback(() => {
    onTap();
    if (isBiometricEnabled) onPasskeyAuthorize();
    else handleAuthorized();
  }, [onTap, isBiometricEnabled, onPasskeyAuthorize, handleAuthorized]);

  const handleCancel = useCallback(async () => {
    onTap();
    if (action) {
      try {
        await aiService.cancelAction(action.conversation_id);
      } catch {}
    }
    onClose();
  }, [action, onClose, onTap]);

  if (!action) return null;

  const loading = isConfirming || isPasskeyLoading;
  const info = describe(action);

  return (
    <View className="px-6 pb-2 pt-4">
      <View className="items-center justify-center py-4">
        {!!info.amount && (
          <Text className="mb-3 font-mono-semibold text-balance-lg text-charcoal-primary">
            {info.amount}
          </Text>
        )}
        <Text className="mb-5 text-center font-body text-headline-3 leading-7 text-charcoal-primary">
          {info.title}
        </Text>
        <Text className="font-mono-medium text-caption text-ash">
          {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
        </Text>
      </View>

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
  );
}
