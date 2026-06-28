import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { usePasskeyAuthorize } from '@/hooks/usePasskeyAuthorize';
import { useAuthStore } from '@/stores/authStore';
import { useAIHaptics } from '@/hooks/useAIHaptics';
import { aiService } from '@/api/services/ai.service';
import { playChatSound } from '@/lib/chatSounds';
import {
  ArrowDataTransferHorizontalIcon,
  FlashIcon,
  Target01Icon,
  Wallet01Icon,
  Invoice02Icon,
  IconComponent as HugeiconsIcon,
  type PhosphorIcon,
} from '@/lib/icons';
import type { PendingAction } from '@/api/types/ai';

interface Props {
  action: PendingAction;
  onConfirmed: (action: PendingAction) => void;
  onCancelled: () => void;
}

interface ActionInfo {
  label: string;
  title: string;
  amount?: string;
  icon: PhosphorIcon;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function money(amount: unknown, currency: unknown = 'USD'): string | undefined {
  const numeric = Number(amount ?? 0);
  const code = typeof currency === 'string' && currency ? currency : 'USD';
  if (!Number.isFinite(numeric) || numeric <= 0) return undefined;
  return code === 'USD' ? `$${numeric.toFixed(2)}` : `${code} ${numeric.toFixed(2)}`;
}

function describe(action: PendingAction): ActionInfo {
  const p = action.params ?? {};
  switch (action.action) {
    case 'transfer_funds': {
      const from = p.from === 'spend' ? 'Spend' : 'Stash';
      const to = p.to === 'spend' ? 'Spend' : 'Stash';
      return {
        label: 'Transfer',
        title: `${from} → ${to}`,
        amount: money(p.amount),
        icon: ArrowDataTransferHorizontalIcon,
      };
    }
    case 'set_budget':
      return {
        label: 'Budget',
        title: 'Set monthly budget',
        amount: money(p.monthly_limit),
        icon: Wallet01Icon,
      };
    case 'set_savings_goal':
      return {
        label: 'Goal',
        title: typeof p.name === 'string' && p.name ? p.name : 'New savings goal',
        amount: money(p.target_amount),
        icon: Target01Icon,
      };
    case 'create_automation':
      return {
        label: 'Automation',
        title: typeof p.name === 'string' && p.name ? p.name : 'New automation',
        amount: money(p.amount),
        icon: FlashIcon,
      };
    case 'create_obligation_reminder':
    case 'create_obligation_reminders':
      return {
        label: 'Obligation',
        title: `Protect ${typeof p.name === 'string' && p.name ? p.name : 'this bill'}`,
        amount: money(p.amount, p.currency),
        icon: Invoice02Icon,
      };
    default:
      return {
        label: 'Action',
        title: action.description || 'Confirm this action',
        icon: FlashIcon,
      };
  }
}

/**
 * InlineActionCard renders an approval-gated action (transfer, automation, goal,
 * budget…) as a glossy, iMessage-style card directly in the chat stream — the way
 * a payment request appears inline in Messages. Confirm/Cancel run the same
 * passkey + service flow the bottom sheet used.
 */
export const InlineActionCard = React.memo(function InlineActionCard({
  action,
  onConfirmed,
  onCancelled,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const user = useAuthStore((s) => s.user);
  const isBiometricEnabled = useAuthStore((s) => s.isBiometricEnabled);
  const { onTap } = useAIHaptics();

  const info = useMemo(() => describe(action), [action]);

  useEffect(() => {
    const expiresAt = new Date(action.expires_at).getTime();
    const tick = () => {
      const remaining = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) onCancelled();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [action, onCancelled]);

  const runConfirm = useCallback(async () => {
    setBusy(true);
    try {
      await aiService.confirmAction(action.conversation_id);
      playChatSound('confirm');
      onConfirmed(action);
    } catch {
      setBusy(false);
    }
  }, [action, onConfirmed]);

  const { isPasskeyLoading, onPasskeyAuthorize } = usePasskeyAuthorize({
    email: user?.email,
    passkeyPromptScope: `miriam-action:${action.id}`,
    autoTrigger: false,
    onAuthorized: runConfirm,
  });

  const handleConfirm = useCallback(() => {
    onTap();
    if (isBiometricEnabled) onPasskeyAuthorize();
    else void runConfirm();
  }, [onTap, isBiometricEnabled, onPasskeyAuthorize, runConfirm]);

  const handleCancel = useCallback(async () => {
    onTap();
    try {
      await aiService.cancelAction(action.conversation_id);
    } catch {
      /* noop */
    }
    onCancelled();
  }, [action, onCancelled, onTap]);

  // Subtle press feedback on the confirm button
  const scale = useSharedValue(1);
  const confirmStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const loading = busy || isPasskeyLoading;
  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(160)}
      className="mb-2 max-w-[82%] self-start">
      <LinearGradient
        colors={['#FF6A3D', '#FF3E00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, padding: 18 }}>
        <View className="flex-row items-center gap-2">
          <View className="h-7 w-7 items-center justify-center rounded-full bg-white/20">
            <HugeiconsIcon icon={info.icon} size={15} color="#ffffff" />
          </View>
          <Text className="font-body-medium text-[13px] uppercase tracking-[1px] text-white/80">
            {info.label}
          </Text>
        </View>

        <Text className="mt-3 font-heading text-[22px] leading-[28px] text-white">
          {info.title}
        </Text>

        {info.amount ? (
          <Text className="mt-1 text-right font-mono-bold text-[30px] text-white">
            {info.amount}
          </Text>
        ) : null}

        <View className="mt-4 flex-row items-center gap-2.5">
          <Pressable
            onPress={handleCancel}
            disabled={loading}
            className="flex-1 items-center justify-center rounded-full border border-white/40 py-3"
            accessibilityRole="button"
            accessibilityLabel="Cancel action">
            <Text className="font-body-medium text-[15px] text-white">Cancel</Text>
          </Pressable>
          <AnimatedPressable
            onPress={handleConfirm}
            onPressIn={() => {
              scale.value = withSpring(0.96, { damping: 18, stiffness: 320 });
            }}
            onPressOut={() => {
              scale.value = withSpring(1, { damping: 18, stiffness: 320 });
            }}
            disabled={loading}
            style={[
              confirmStyle,
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderRadius: 9999,
                backgroundColor: '#fff',
                paddingVertical: 12,
                flex: 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Confirm action">
            {loading ? (
              <ActivityIndicator size="small" color="#FF3E00" />
            ) : (
              <Text className="font-body-medium text-[15px] text-[#FF3E00]">Confirm</Text>
            )}
          </AnimatedPressable>
        </View>

        <Text className="mt-2.5 text-center font-mono-medium text-[11px] text-white/60">
          Expires in {mm}:{ss}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
});
