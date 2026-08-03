import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { usePasskeyAuthorize } from '@/hooks/usePasskeyAuthorize';
import { useVerifyPasscode } from '@/api/hooks';
import { useAuthStore } from '@/stores/authStore';
import { usePendingAuthorize } from '@/stores/pendingAuthorize';
import { useHaptics } from '@/hooks/useHaptics';
import { aiService } from '@/api/services/ai.service';
import { logger } from '@/lib/logger';
import { PasscodeInput } from '@/components/molecules/PasscodeInput';
import {
  ArrowDataTransferHorizontalIcon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  CreditCardIcon,
  FlashIcon,
  Invoice02Icon,
  LockIcon,
  Shield01Icon,
  Target01Icon,
  Wallet01Icon,
  IconComponent as HugeiconsIcon,
  type PhosphorIcon,
} from '@/lib/icons';
import type { PendingAction } from '@/api/types/ai';

type ScreenState = 'loading' | 'review' | 'pin' | 'success' | 'expired' | 'error';

interface ActionInfo {
  label: string;
  title: string;
  amount?: string;
  effect?: string;
  icon: PhosphorIcon;
  rows: { label: string; value: string }[];
}

function money(amount: unknown, currency: unknown = 'USD'): string | undefined {
  const numeric = Number(amount ?? 0);
  const code = typeof currency === 'string' && currency ? currency : 'USD';
  if (!Number.isFinite(numeric) || numeric <= 0) return undefined;
  return code === 'USD' ? `$${numeric.toFixed(2)}` : `${code} ${numeric.toFixed(2)}`;
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' && v ? v : fallback;
}

function describe(action: PendingAction): ActionInfo {
  const p = action.params ?? {};
  switch (action.action) {
    case 'optimize_yield':
      return {
        label: 'Move to savings',
        title: 'Move to Savings',
        amount: money(p.amount),
        effect: 'Starts earning yield · no fee',
        icon: ArrowDataTransferHorizontalIcon,
        rows: [
          { label: 'From', value: 'Spend' },
          { label: 'To', value: 'Savings' },
          { label: 'Fee', value: 'None' },
        ],
      };
    case 'transfer_funds': {
      const from = p.from === 'spend' ? 'Spend' : 'Savings';
      const to = p.to === 'spend' ? 'Spend' : 'Savings';
      return {
        label: 'Move money',
        title: 'Move money',
        amount: money(p.amount),
        effect: 'Instant · no fee',
        icon: ArrowDataTransferHorizontalIcon,
        rows: [
          { label: 'From', value: from },
          { label: 'To', value: to },
          { label: 'Fee', value: 'None' },
        ],
      };
    }
    case 'execute_investment':
      return {
        label: 'Invest',
        title: `${str(p.side, 'Buy')} order`,
        amount: money(p.amount),
        effect: 'Places a real order with your broker',
        icon: FlashIcon,
        rows: [
          { label: 'Basket', value: str(p.basket_name ?? p.basket_id, 'Selected basket') },
          { label: 'Side', value: str(p.side, 'Buy') },
        ],
      };
    case 'copy_trader':
      return {
        label: 'Copy trades',
        title: `Copy ${str(p.conductor ?? p.conductor_id ?? p.trader, 'this investor')}`,
        amount: money(p.amount),
        effect: 'Mirrors their recent disclosed buys',
        icon: Target01Icon,
        rows: [
          { label: 'Investor', value: str(p.conductor ?? p.trader, 'Public figure') },
          { label: 'Allocation', value: money(p.amount) ?? '—' },
        ],
      };
    case 'setup_bill_autopay':
      return {
        label: 'Auto-pay bill',
        title: `Pay ${str(p.payee_name ?? p.bill_name ?? p.payee, 'this bill')}`,
        amount: money(p.amount),
        effect: 'Pays automatically on each due date',
        icon: Invoice02Icon,
        rows: [
          { label: 'Payee', value: str(p.payee_name ?? p.payee, '—') },
          { label: 'When', value: 'Each due date' },
        ],
      };
    case 'cancel_subscription':
      return {
        label: 'Cancel subscription',
        title: `Cancel ${str(p.name, 'subscription')}`,
        icon: Cancel01Icon,
        effect: p.block_merchant ? 'And block the merchant on your card' : undefined,
        rows: [{ label: 'Subscription', value: str(p.name, '—') }],
      };
    case 'block_merchant':
      return {
        label: 'Block merchant',
        title: `Block ${str(p.merchant, 'merchant')}`,
        icon: Shield01Icon,
        effect: 'Future card charges will decline',
        rows: [{ label: 'Merchant', value: str(p.merchant, '—') }],
      };
    case 'unblock_merchant':
      return {
        label: 'Unblock merchant',
        title: `Unblock ${str(p.merchant, 'merchant')}`,
        icon: Shield01Icon,
        rows: [{ label: 'Merchant', value: str(p.merchant, '—') }],
      };
    case 'set_budget':
      return {
        label: 'Set budget',
        title: 'Monthly budget',
        amount: money(p.amount ?? p.monthly_limit),
        icon: Wallet01Icon,
        rows: [{ label: 'Limit', value: money(p.amount ?? p.monthly_limit) ?? '—' }],
      };
    default:
      return {
        label: 'Approve',
        title: action.description || 'Confirm this action',
        icon: CreditCardIcon,
        rows: [],
      };
  }
}

/** Grouped detail row, matching the transaction-detail / review pattern. */
function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View
      className={`flex-row items-center justify-between px-4 py-3.5 ${last ? '' : 'border-b border-stone-surface'}`}>
      <Text className="font-body text-[14px] text-text-muted" maxFontSizeMultiplier={1.4}>
        {label}
      </Text>
      <Text
        className="ml-4 flex-1 text-right font-subtitle text-[14px] text-text-primary"
        numberOfLines={1}
        maxFontSizeMultiplier={1.3}>
        {value}
      </Text>
    </View>
  );
}

/**
 * AuthorizeScreen is the landing target for Miriam's messaging deep link
 * (rail://authorize?conv=..&action=..). Miriam stages a money move over
 * iMessage/WhatsApp, then hands off here so the user can see exactly what will
 * happen and approve it with Face ID / passcode. The backend re-verifies
 * ownership and requires a passcode session, so the deep link alone can't move
 * money — this screen just makes the approval clear and quick.
 */
export default function AuthorizeScreen() {
  const params = useLocalSearchParams();
  const conversationId = str(params.conv);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isBiometricEnabled = useAuthStore((s) => s.isBiometricEnabled);
  const user = useAuthStore((s) => s.user);
  const setIntent = usePendingAuthorize((s) => s.setIntent);
  const { notification, impact, selection } = useHaptics();

  // Wait for persisted auth to hydrate before deciding anything — a cold start
  // from a deep link would otherwise briefly read isAuthenticated=false.
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());
  useEffect(() => {
    if (hydrated) return;
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, [hydrated]);

  const authed = hydrated && isAuthenticated && Boolean(accessToken);

  const [screen, setScreen] = useState<ScreenState>('loading');
  const [action, setAction] = useState<PendingAction | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [pin, setPin] = useState('');
  const loadAttempt = useRef(0);

  // Once hydration settles: if signed out, remember the intent and send them to
  // sign in — the tabs layout reopens this screen after login.
  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated || !accessToken) {
      if (conversationId) setIntent(conversationId);
      router.replace('/');
    }
  }, [hydrated, isAuthenticated, accessToken, conversationId, setIntent]);

  // Missing/blank deep link.
  useEffect(() => {
    if (authed && !conversationId) {
      setScreen('error');
      setErrorMsg('This approval link is missing its details. Ask Miriam again.');
    }
  }, [authed, conversationId]);

  const loadPending = useCallback(async () => {
    if (!conversationId) return;
    setScreen('loading');
    const attempt = ++loadAttempt.current;
    try {
      const { pending_action } = await aiService.getPendingAction(conversationId);
      if (attempt !== loadAttempt.current) return;
      if (!pending_action) {
        setScreen('expired');
        return;
      }
      setAction(pending_action);
      setScreen('review');
    } catch (err) {
      if (attempt !== loadAttempt.current) return;
      logger.warn('[Authorize] failed to load pending action', { err: String(err) });
      setScreen('error');
      setErrorMsg("I couldn't load this request. Check your connection and try again.");
    }
  }, [conversationId]);

  useEffect(() => {
    if (authed && conversationId) void loadPending();
  }, [authed, conversationId, loadPending]);

  // Countdown to expiry.
  useEffect(() => {
    if (!action?.expires_at) return;
    const expiresAt = new Date(action.expires_at).getTime();
    const tick = () => {
      const remaining = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) setScreen((s) => (s === 'review' || s === 'pin' ? 'expired' : s));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [action?.expires_at]);

  const info = useMemo(() => (action ? describe(action) : null), [action]);

  const runConfirm = useCallback(async () => {
    if (!conversationId || confirming) return;
    setConfirming(true);
    try {
      await aiService.confirmAction(conversationId);
      notification();
      setScreen('success');
      setTimeout(() => {
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)');
      }, 1700);
    } catch (err: any) {
      impact();
      setConfirming(false);
      setPin('');
      const msg = String(err?.message ?? '');
      if (/expired|not found|no pending/i.test(msg)) {
        setScreen('expired');
      } else {
        setScreen('error');
        setErrorMsg('That didn’t go through. Please try again.');
      }
    }
  }, [conversationId, confirming, notification, impact]);

  const passkeyPromptScope = `miriam-authorize:${user?.id ?? user?.email ?? 'unknown'}:${conversationId}`;
  const { isPasskeyLoading, onPasskeyAuthorize } = usePasskeyAuthorize({
    email: user?.email,
    passkeyPromptScope,
    autoTrigger: false,
    onAuthorized: runConfirm,
  });

  const { mutate: verifyPasscode, isPending: verifying } = useVerifyPasscode();

  const submitPin = useCallback(
    (code: string) => {
      verifyPasscode(
        { passcode: code },
        {
          onSuccess: (result: any) => {
            if (result?.verified) void runConfirm();
            else {
              impact();
              setPin('');
              setErrorMsg('Wrong PIN. Try again.');
            }
          },
          onError: () => {
            impact();
            setPin('');
            setErrorMsg('Could not verify your PIN. Try again.');
          },
        }
      );
    },
    [verifyPasscode, runConfirm, impact]
  );

  const handleApprove = useCallback(() => {
    selection();
    setErrorMsg('');
    if (isBiometricEnabled) onPasskeyAuthorize();
    else setScreen('pin');
  }, [selection, isBiometricEnabled, onPasskeyAuthorize]);

  const handleDecline = useCallback(async () => {
    selection();
    try {
      if (conversationId && action) await aiService.cancelAction(conversationId);
    } catch {
      /* noop */
    }
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [conversationId, action, selection]);

  const busy = confirming || isPasskeyLoading || verifying;

  // PIN entry uses the shared PasscodeInput (same as withdrawals).
  if (screen === 'pin' && info) {
    return (
      <SafeAreaView className="flex-1 bg-warm-canvas">
        <StatusBar barStyle="dark-content" />
        <View className="px-4 pt-2">
          <Pressable
            onPress={() => {
              setErrorMsg('');
              setPin('');
              setScreen('review');
            }}
            className="size-11 items-center justify-center rounded-full bg-stone-surface active:scale-[0.95]"
            accessibilityRole="button"
            accessibilityLabel="Back">
            <HugeiconsIcon icon={Cancel01Icon} size={18} color="#343433" strokeWidth={2} />
          </Pressable>
        </View>
        <PasscodeInput
          title="Approve"
          titleClassName="text-[28px]"
          subtitle={
            info.amount
              ? `Enter your PIN to approve ${info.amount} · ${info.label.toLowerCase()}.`
              : `Enter your PIN to ${info.label.toLowerCase()}.`
          }
          length={4}
          value={pin}
          onValueChange={(next) => {
            setErrorMsg('');
            setPin(next);
          }}
          onComplete={busy ? undefined : submitPin}
          errorText={errorMsg}
          showPasskey={isBiometricEnabled}
          onPasskey={onPasskeyAuthorize}
          autoSubmit
          variant="light"
          className="mt-4 flex-1"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-warm-canvas">
      <StatusBar barStyle="dark-content" />
      <View className="flex-1 px-5">
        {/* Close */}
        <Animated.View entering={FadeIn.duration(200)} className="mt-2 flex-row justify-end">
          <Pressable
            onPress={handleDecline}
            hitSlop={10}
            className="size-10 items-center justify-center rounded-full bg-stone-surface active:scale-[0.95]"
            accessibilityRole="button"
            accessibilityLabel="Close">
            <HugeiconsIcon icon={Cancel01Icon} size={18} color="#343433" strokeWidth={2} />
          </Pressable>
        </Animated.View>

        {screen === 'loading' && (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="small" color="#ff3e00" />
            <Text className="mt-3 font-body text-[14px] text-text-muted">
              Loading your request…
            </Text>
          </View>
        )}

        {screen === 'expired' && (
          <StatusView
            icon={Cancel01Icon}
            tint="#848281"
            title="Nothing to approve"
            body="This request expired or was already handled. Ask Miriam again and she'll set it up fresh."
            primaryLabel="Close"
            onPrimary={handleDecline}
          />
        )}

        {screen === 'error' && (
          <StatusView
            icon={Cancel01Icon}
            tint="#ff2b3a"
            title="Something went wrong"
            body={errorMsg || 'Please try again.'}
            primaryLabel={conversationId ? 'Try again' : 'Close'}
            onPrimary={conversationId ? loadPending : handleDecline}
            secondaryLabel={conversationId ? 'Close' : undefined}
            onSecondary={conversationId ? handleDecline : undefined}
          />
        )}

        {screen === 'success' && (
          <View className="flex-1 items-center justify-center">
            <Animated.View entering={ZoomIn.springify().damping(14)}>
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                size={72}
                color="#00ca48"
                strokeWidth={2}
              />
            </Animated.View>
            <Animated.Text
              entering={FadeInUp.delay(120).duration(260)}
              className="mt-5 font-heading text-[24px] text-text-primary">
              Done
            </Animated.Text>
            {info?.amount ? (
              <Animated.Text
                entering={FadeInUp.delay(180).duration(260)}
                className="mt-1 font-body text-[15px] text-text-muted">
                {info.amount} · {info.label.toLowerCase()}
              </Animated.Text>
            ) : null}
          </View>
        )}

        {screen === 'review' && info && action && (
          <View className="flex-1">
            {/* Eyebrow */}
            <Animated.View
              entering={FadeInUp.duration(240)}
              className="mt-4 flex-row items-center gap-2">
              <HugeiconsIcon icon={Shield01Icon} size={16} color="#ff3e00" strokeWidth={2} />
              <Text className="font-body-medium text-[13px] uppercase tracking-[1.5px] text-ember-orange">
                Approve
              </Text>
            </Animated.View>

            {/* Heading */}
            <Animated.Text
              entering={FadeInUp.delay(60).duration(260)}
              className="mt-3 font-heading text-[30px] leading-[36px] text-text-primary">
              {info.title}
            </Animated.Text>

            {/* Amount */}
            {info.amount ? (
              <Animated.Text
                entering={FadeInUp.delay(110).duration(260)}
                className="mt-2 font-mono-bold text-[44px] text-text-primary"
                style={{ fontVariant: ['tabular-nums'] }}>
                {info.amount}
              </Animated.Text>
            ) : null}

            {info.effect ? (
              <Animated.Text
                entering={FadeInUp.delay(150).duration(260)}
                className="mt-1 font-body text-[14px] text-text-muted">
                {info.effect}
              </Animated.Text>
            ) : null}

            {/* Detail card */}
            {info.rows.length > 0 ? (
              <Animated.View
                entering={FadeInDown.delay(190).duration(280)}
                className="mt-6 overflow-hidden rounded-3xl border border-stone-surface bg-parchment-card">
                {info.rows.map((r, i) => (
                  <Row
                    key={r.label}
                    label={r.label}
                    value={r.value}
                    last={i === info.rows.length - 1}
                  />
                ))}
              </Animated.View>
            ) : null}

            {/* Trust line */}
            <Animated.View
              entering={FadeInUp.delay(240).duration(260)}
              className="mt-4 flex-row items-center gap-2 px-1">
              <HugeiconsIcon icon={LockIcon} size={13} color="#a7a7a7" strokeWidth={2} />
              <Text className="flex-1 font-body text-[12.5px] text-text-muted">
                Miriam staged this from your chat. Only you can approve it here.
              </Text>
            </Animated.View>

            <View className="flex-1" />

            <View className="pb-2">
              {secondsLeft !== null && secondsLeft > 0 ? (
                <Text className="mb-3 text-center font-mono-medium text-[12px] text-text-muted">
                  Expires in {Math.floor(secondsLeft / 60)}:
                  {String(secondsLeft % 60).padStart(2, '0')}
                </Text>
              ) : null}

              <Pressable
                onPress={handleApprove}
                disabled={busy}
                className="h-[56px] flex-row items-center justify-center gap-2 rounded-full bg-obsidian active:scale-[0.98]"
                style={{ opacity: busy ? 0.6 : 1 }}
                accessibilityRole="button"
                accessibilityLabel="Approve">
                {busy ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <HugeiconsIcon icon={LockIcon} size={18} color="#ffffff" strokeWidth={2} />
                    <Text className="font-body-medium text-[16px] text-white">
                      {isBiometricEnabled ? 'Approve with Face ID' : 'Approve with PIN'}
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={handleDecline}
                disabled={busy}
                className="mt-3 h-[52px] items-center justify-center rounded-full active:opacity-70"
                accessibilityRole="button"
                accessibilityLabel="Not now">
                <Text className="font-body-medium text-[15px] text-text-muted">Not now</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function StatusView({
  icon,
  tint,
  title,
  body,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  icon: PhosphorIcon;
  tint: string;
  title: string;
  body: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center px-2">
      <Animated.View entering={ZoomIn.springify().damping(14)}>
        <HugeiconsIcon icon={icon} size={56} color={tint} strokeWidth={2} />
      </Animated.View>
      <Animated.Text
        entering={FadeInUp.delay(100).duration(260)}
        className="mt-5 text-center font-heading text-[22px] text-text-primary">
        {title}
      </Animated.Text>
      <Animated.Text
        entering={FadeInUp.delay(160).duration(260)}
        className="mt-2 text-center font-body text-[14px] leading-[20px] text-text-muted">
        {body}
      </Animated.Text>
      <Pressable
        onPress={onPrimary}
        className="mt-8 h-[52px] w-full items-center justify-center rounded-full bg-obsidian active:scale-[0.98]"
        accessibilityRole="button">
        <Text className="font-body-medium text-[15px] text-white">{primaryLabel}</Text>
      </Pressable>
      {secondaryLabel && onSecondary ? (
        <Pressable
          onPress={onSecondary}
          className="mt-3 h-[48px] w-full items-center justify-center rounded-full active:opacity-70"
          accessibilityRole="button">
          <Text className="font-body-medium text-[15px] text-text-muted">{secondaryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
