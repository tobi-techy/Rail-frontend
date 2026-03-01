import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Switch,
  Pressable,
} from 'react-native';
import { Passkey } from 'react-native-passkey';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import {
  LogOut,
  KeyRound,
  Shield,
  Users,
  Scale,
  HeadphonesIcon,
  Trash2,
  ShieldCheck,
  TrendingUp,
  Repeat2,
  ArrowLeftRight,
  Eye,
  EyeOff,
  Vibrate,
  Lock,
  Bell,
  Sun,
  Globe,
  RefreshCw,
} from 'lucide-react-native';
import { useNavigation, router } from 'expo-router';
import { useLayoutEffect, useState, useEffect, type ReactNode } from 'react';

import { BottomSheet, SettingsSheet } from '@/components/sheets';
import { SegmentedSlider } from '@/components/molecules';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores';
import type { Currency } from '@/stores/uiStore';
import { logger } from '@/lib/logger';
import { useAllocationBalances, useEnableAllocationMode } from '@/api/hooks';
import gleap from '@/utils/gleap';
import { formatFxUpdatedAt, migrateLegacyCurrency } from '@/utils/currency';
import { usePinChange, sanitizePin } from '@/hooks/usePinChange';
import { useSpendSettings, clampAlloc } from '@/hooks/useSpendSettings';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';

// ── Constants ─────────────────────────────────────────────────────────────────

const CURRENCIES: Currency[] = ['USD', 'EUR'];
const CURRENCY_LABELS: Record<Currency, string> = { USD: 'US Dollar (USD)', EUR: 'Euro (EUR)' };

// ── Types ─────────────────────────────────────────────────────────────────────

type SheetType =
  | 'allocation'
  | 'autoInvest'
  | 'roundups'
  | 'limits'
  | 'pin'
  | 'logout'
  | 'delete'
  | 'privacy'
  | 'haptics'
  | 'lockOnResume'
  | 'currency'
  | null;

// ── Helpers ───────────────────────────────────────────────────────────────────

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const m = (error as { message?: unknown }).message;
    if (typeof m === 'string' && m.trim()) return m;
  }
  return fallback;
};

// ── UI Primitives ─────────────────────────────────────────────────────────────

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SettingButton({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      style={animStyle}
      className="mb-md w-[25%] items-center"
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.9, { damping: 20, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 20, stiffness: 300 }); }}>
      <View className="h-12 w-12 items-center justify-center">{icon}</View>
      <Text
        className={`mt-xs text-center font-caption text-caption ${danger ? 'text-destructive' : 'text-text-primary'}`}
        numberOfLines={2}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <View className="border-b border-surface py-md">
    <Text className="mb-md px-md font-subtitle text-body">{title}</Text>
    <View className="flex-row flex-wrap px-sm">{children}</View>
  </View>
);

const SheetRow = ({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
}) => (
  <Pressable
    className="flex-row items-center justify-between border-b border-surface py-4"
    onPress={onPress}>
    <Text className="font-body text-base text-text-primary">{label}</Text>
    {value && <Text className="font-body text-base text-text-secondary">{value}</Text>}
  </Pressable>
);

const SheetToggleRow = ({
  label,
  subtitle,
  value,
  onChange,
}: {
  label: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) => (
  <View className="flex-row items-center justify-between border-b border-surface py-4">
    <View className="flex-1 pr-4">
      <Text className="font-body text-base text-text-primary">{label}</Text>
      {subtitle && (
        <Text className="mt-0.5 font-caption text-caption text-text-secondary">{subtitle}</Text>
      )}
    </View>
    <Switch value={value} onValueChange={onChange} />
  </View>
);

// ── Settings ──────────────────────────────────────────────────────────────────

export default function Settings() {
  const navigation = useNavigation();
  const { showError, showSuccess, showWarning, showInfo } = useFeedbackPopup();

  const logout = useAuthStore((s) => s.logout);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);

  const {
    isBalanceVisible,
    toggleBalanceVisibility,
    hapticsEnabled,
    setHapticsEnabled,
    requireBiometricOnResume,
    setRequireBiometricOnResume,
    currency,
    setCurrency,
    currencyRatesUpdatedAt,
    isCurrencyRatesRefreshing,
    refreshCurrencyRates,
  } = useUIStore();
  const selectedCurrency = migrateLegacyCurrency(currency);

  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const closeSheet = () => setActiveSheet(null);

  const {
    baseAllocation,
    setBaseAllocation,
    autoInvestEnabled,
    setAutoInvestEnabled,
    roundupsEnabled,
    setRoundupsEnabled,
    spendingLimit,
    setSpendingLimit,
    MIN_BASE_ALLOCATION,
    MAX_BASE_ALLOCATION,
  } = useSpendSettings();

  const [allocationFeedback, setAllocationFeedback] = useState<string | null>(null);

  const {
    currentPin,
    setCurrentPin,
    newPin,
    setNewPin,
    confirmPin,
    setConfirmPin,
    pinError,
    pinSuccess,
    hasPasscodeConfigured,
    isSavingPin,
    handleSubmitPin,
    PIN_MAX_LENGTH,
  } = usePinChange({ isSheetOpen: activeSheet === 'pin', onSuccess: closeSheet });

  // Account state
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // API hooks
  const { data: allocationBalances, refetch: refetchAllocationBalances } = useAllocationBalances();
  const { mutateAsync: enableAllocationMode, isPending: isEnablingAllocation } =
    useEnableAllocationMode();

  useEffect(() => {
    if (activeSheet !== 'currency' || currencyRatesUpdatedAt) return;
    void refreshCurrencyRates();
  }, [activeSheet, currencyRatesUpdatedAt, refreshCurrencyRates]);

  useEffect(() => {
    if (currency !== selectedCurrency) setCurrency(selectedCurrency);
  }, [currency, selectedCurrency, setCurrency]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: '',
      headerStyle: { backgroundColor: '#FFFFFF' },
      headerShadowVisible: false,
      headerLeft: () => (
        <View className="flex-row items-center gap-x-3 pl-[14px]">
          <Text className="font-subtitle text-headline-1">Settings</Text>
        </View>
      ),
    });
  }, [navigation]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveAllocation = async () => {
    if (isEnablingAllocation) return;
    const spendingRatio = Math.min(0.99, Math.max(0.01, baseAllocation / 100));
    const stashRatio = Number((1 - spendingRatio).toFixed(2));
    try {
      const response = await enableAllocationMode({
        spending_ratio: Number(spendingRatio.toFixed(2)),
        stash_ratio: stashRatio,
      });
      setAllocationFeedback(response.message || 'Base/Active split updated.');
      await refetchAllocationBalances();
      closeSheet();
    } catch (error) {
      const msg = getErrorMessage(error, 'Failed to update Base/Active split.');
      setAllocationFeedback(msg);
      showError('Split Update Failed', msg);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      showSuccess('Logged Out', 'You have been logged out successfully.');
      closeSheet();
    } catch (error) {
      logger.error('[Settings] Logout error', {
        component: 'Settings',
        action: 'logout-error',
        error: error instanceof Error ? error.message : 'unknown',
      });
      showWarning(
        'Logout Issue',
        'We had trouble logging you out from the server. Your local session has been cleared for security.'
      );
      closeSheet();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAccount('User requested account deletion');
      closeSheet();
      const fundsMsg = parseFloat(result.funds_swept) > 0
        ? `$${result.funds_swept} was transferred to our treasury wallet.`
        : undefined;
      showSuccess('Account Deleted', fundsMsg ?? 'Your account has been permanently deleted.');
    } catch (error: any) {
      showError('Error', error?.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View className="flex-1 bg-background-main">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <Section title="Spend">
          <SettingButton
            icon={<ArrowLeftRight size={22} color="#121212" />}
            label="Base/Active Split"
            onPress={() => {
              setAllocationFeedback(null);
              setActiveSheet('allocation');
              void refetchAllocationBalances();
            }}
          />
          <SettingButton
            icon={<TrendingUp size={22} color="#121212" />}
            label="Auto Invest"
            onPress={() => setActiveSheet('autoInvest')}
          />
          <SettingButton
            icon={<Repeat2 size={22} color="#121212" />}
            label="Round-ups"
            onPress={() => setActiveSheet('roundups')}
          />
          <SettingButton
            icon={<Scale size={22} color="#121212" />}
            label="Limits"
            onPress={() => setActiveSheet('limits')}
          />
        </Section>

        <Section title="Preferences">
          <SettingButton
            icon={
              isBalanceVisible ? (
                <Eye size={22} color="#121212" />
              ) : (
                <EyeOff size={22} color="#121212" />
              )
            }
            label="Privacy"
            onPress={() => setActiveSheet('privacy')}
          />
          <SettingButton
            icon={<Vibrate size={22} color="#121212" />}
            label="Haptics"
            onPress={() => setActiveSheet('haptics')}
          />
          <SettingButton
            icon={<Lock size={22} color="#121212" />}
            label="App Lock"
            onPress={() => setActiveSheet('lockOnResume')}
          />
          <SettingButton
            icon={<Bell size={22} color="#121212" />}
            label="Notifications"
            onPress={() => router.push('/settings-notifications')}
          />
          <SettingButton
            icon={<Sun size={22} color="#121212" />}
            label="Theme"
            onPress={() => showInfo('Coming Soon', 'Theme switching will be available once dark and light mode are fully implemented.')}
          />
          <SettingButton
            icon={<Globe size={22} color="#121212" />}
            label="Language"
            onPress={() => showInfo('Coming Soon', 'Language selection will be available in a future update.')}
          />
          <SettingButton
            icon={<Globe size={22} color="#121212" />}
            label="Currency"
            onPress={() => setActiveSheet('currency')}
          />
        </Section>

        <Section title="Security">
          <SettingButton
            icon={<Shield size={22} color="#121212" />}
            label="PIN"
            onPress={() => setActiveSheet('pin')}
          />
          {Passkey.isSupported() && (
            <SettingButton
              icon={<KeyRound size={22} color="#121212" />}
              label="Passkeys"
              onPress={() => router.push('/passkey-settings')}
            />
          )}
          <SettingButton icon={<ShieldCheck size={22} color="#121212" />} label="2-Factor Auth" />
        </Section>

        <Section title="More">
          <SettingButton icon={<Users size={22} color="#121212" />} label="Referrals" />
          <SettingButton icon={<Scale size={22} color="#121212" />} label="Legal" />
          <SettingButton
            icon={<HeadphonesIcon size={22} color="#121212" />}
            label="Support"
            onPress={() => gleap.open()}
          />
        </Section>

        <Section title="Account">
          <SettingButton
            icon={<LogOut size={22} color="#F44336" />}
            label="Logout"
            danger
            onPress={() => setActiveSheet('logout')}
          />
          <SettingButton
            icon={<Trash2 size={22} color="#F44336" />}
            label="Delete Account"
            danger
            onPress={() => setActiveSheet('delete')}
          />
        </Section>
      </ScrollView>

      {/* Spend */}
      <BottomSheet visible={activeSheet === 'allocation'} onClose={closeSheet}>
        <Text className="mb-6 font-subtitle text-xl">Base/Active Split</Text>
        <Text className="mb-6 font-body text-base leading-6 text-neutral-500">
          Set how new deposits are split between Base and Active allocations.
        </Text>
        {allocationFeedback && (
          <View className="mb-4 rounded-xl border border-neutral-200 bg-neutral-100 p-3">
            <Text className="font-caption text-caption text-text-secondary">
              {allocationFeedback}
            </Text>
          </View>
        )}
        <SegmentedSlider
          value={baseAllocation}
          onValueChange={(v) => setBaseAllocation(clampAlloc(v))}
          min={MIN_BASE_ALLOCATION}
          max={MAX_BASE_ALLOCATION}
          step={1}
          label="Base Allocation"
          segments={49}
          activeColor="#8B5CF6"
        />
        <View className="my-4 flex-row justify-between">
          <View className="items-center">
            <Text className="font-subtitle text-2xl">{baseAllocation}%</Text>
            <Text className="font-caption text-sm text-text-secondary">Base</Text>
          </View>
          <View className="items-center">
            <Text className="font-subtitle text-2xl">{100 - baseAllocation}%</Text>
            <Text className="font-caption text-sm text-text-secondary">Active</Text>
          </View>
        </View>
        <Button
          title={isEnablingAllocation ? '' : 'Save Changes'}
          variant="black"
          onPress={handleSaveAllocation}
          disabled={isEnablingAllocation}
          flex>
          {isEnablingAllocation && <ActivityIndicator color="#fff" />}
        </Button>
      </BottomSheet>

      <SettingsSheet
        visible={activeSheet === 'autoInvest'}
        onClose={closeSheet}
        title="Auto Invest"
        subtitle="Automatically invest spare change and scheduled deposits."
        toggleLabel="Enable Auto Invest"
        toggleValue={autoInvestEnabled}
        onToggleChange={setAutoInvestEnabled}
      />
      <SettingsSheet
        visible={activeSheet === 'roundups'}
        onClose={closeSheet}
        title="Round-ups"
        subtitle="Round up purchases to the nearest dollar and invest the difference."
        toggleLabel="Enable Round-ups"
        toggleValue={roundupsEnabled}
        onToggleChange={setRoundupsEnabled}
      />

      <BottomSheet visible={activeSheet === 'limits'} onClose={closeSheet}>
        <Text className="mb-6 font-subtitle text-xl">Spending Limits</Text>
        <Text className="mb-6 font-body text-base leading-6 text-neutral-500">
          Set your daily spending limit to help manage your expenses.
        </Text>
        <SegmentedSlider
          value={spendingLimit}
          onValueChange={setSpendingLimit}
          min={100}
          max={2000}
          step={50}
          label="Daily Limit"
          segments={40}
          activeColor="#FF5A00"
          showPercentage={false}
        />
        <Text className="my-4 text-center font-subtitle text-2xl">${spendingLimit}</Text>
        <Button title="Save Limit" variant="black" onPress={closeSheet} />
      </BottomSheet>

      {/* Preferences */}
      <BottomSheet visible={activeSheet === 'privacy'} onClose={closeSheet}>
        <Text className="mb-4 font-subtitle text-xl">Privacy</Text>
        <SheetToggleRow
          label="Hide Balances"
          subtitle="Mask all monetary values in the app"
          value={!isBalanceVisible}
          onChange={() => toggleBalanceVisibility()}
        />
      </BottomSheet>

      <BottomSheet visible={activeSheet === 'haptics'} onClose={closeSheet}>
        <Text className="mb-4 font-subtitle text-xl">Haptics</Text>
        <SheetToggleRow
          label="Enable Haptic Feedback"
          subtitle="Vibration feedback on interactions"
          value={hapticsEnabled}
          onChange={setHapticsEnabled}
        />
      </BottomSheet>

      <BottomSheet visible={activeSheet === 'lockOnResume'} onClose={closeSheet}>
        <Text className="mb-4 font-subtitle text-xl">App Lock</Text>
        <SheetToggleRow
          label="Require Authentication on Resume"
          subtitle="Require device authentication when returning to the app"
          value={requireBiometricOnResume}
          onChange={setRequireBiometricOnResume}
        />
      </BottomSheet>

      <BottomSheet visible={activeSheet === 'currency'} onClose={closeSheet}>
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="font-subtitle text-xl">Display Currency</Text>
          <Pressable
            className="h-9 w-9 items-center justify-center rounded-full bg-surface"
            disabled={isCurrencyRatesRefreshing}
            onPress={() => void refreshCurrencyRates({ forceRefresh: true })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            {isCurrencyRatesRefreshing ? (
              <ActivityIndicator size="small" color="#111827" />
            ) : (
              <RefreshCw size={16} color="#111827" />
            )}
          </Pressable>
        </View>
        <Text className="mb-1 font-body text-sm text-text-secondary">
          Balances are converted instantly using cached FX rates.
        </Text>
        <Text className="mb-4 font-caption text-caption text-text-tertiary">
          Last updated: {formatFxUpdatedAt(currencyRatesUpdatedAt)}
        </Text>
        {CURRENCIES.map((c) => (
          <SheetRow
            key={c}
            label={CURRENCY_LABELS[c]}
            value={selectedCurrency === c ? '✓' : undefined}
            onPress={() => {
              setCurrency(c);
              closeSheet();
            }}
          />
        ))}
      </BottomSheet>

      {/* Security */}
      <BottomSheet visible={activeSheet === 'pin'} onClose={closeSheet}>
        <Text className="mb-2 font-subtitle text-xl">
          {hasPasscodeConfigured ? 'Update PIN' : 'Create PIN'}
        </Text>
        <Text className="mb-6 font-body text-base leading-6 text-neutral-500">
          Enter a 4-digit PIN used to unlock sensitive actions on your account.
        </Text>
        <View className="gap-3">
          {hasPasscodeConfigured && (
            <Input
              label="Current PIN"
              value={currentPin}
              onChangeText={(v) => setCurrentPin(sanitizePin(v))}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={PIN_MAX_LENGTH}
              placeholder="••••"
            />
          )}
          <Input
            label={hasPasscodeConfigured ? 'New PIN' : 'PIN'}
            value={newPin}
            onChangeText={(v) => setNewPin(sanitizePin(v))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={PIN_MAX_LENGTH}
            placeholder="••••"
          />
          <Input
            label="Confirm PIN"
            value={confirmPin}
            onChangeText={(v) => setConfirmPin(sanitizePin(v))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={PIN_MAX_LENGTH}
            placeholder="••••"
          />
        </View>
        {pinError && (
          <Text className="mt-3 font-caption text-caption text-destructive">{pinError}</Text>
        )}
        {pinSuccess && (
          <Text className="mt-3 font-caption text-caption text-success">{pinSuccess}</Text>
        )}
        <View className="mt-6 flex-row gap-3">
          <Button title="Cancel" variant="ghost" onPress={closeSheet} disabled={isSavingPin} flex />
          <Button
            title={isSavingPin ? '' : hasPasscodeConfigured ? 'Update PIN' : 'Create PIN'}
            variant="black"
            onPress={handleSubmitPin}
            disabled={isSavingPin}
            flex>
            {isSavingPin && <ActivityIndicator color="#fff" />}
          </Button>
        </View>
      </BottomSheet>

      {/* Account */}
      <BottomSheet visible={activeSheet === 'logout'} onClose={closeSheet}>
        <Text className="mb-6 font-subtitle text-xl">Log Out</Text>
        <View className="mb-6 items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-100 py-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <LogOut size={32} color="#F59E0B" />
          </View>
        </View>
        <Text className="mb-6 font-body text-base leading-6 text-neutral-500">
          Are you sure you want to log out? You&apos;ll need to sign in again to access your
          account.
        </Text>
        <View className="flex-row gap-3">
          <Button
            title="Cancel"
            variant="ghost"
            onPress={closeSheet}
            disabled={isLoggingOut}
            flex
          />
          <Button
            title={isLoggingOut ? '' : 'Log Out'}
            variant="black"
            onPress={handleLogout}
            disabled={isLoggingOut}
            flex>
            {isLoggingOut && <ActivityIndicator color="#fff" />}
          </Button>
        </View>
      </BottomSheet>

      <BottomSheet visible={activeSheet === 'delete'} onClose={closeSheet}>
        <Text className="mb-6 font-subtitle text-xl text-text-primary">Delete Account</Text>
        <View className="mb-6 items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-100 py-10">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Trash2 size={32} color="#EF4444" />
          </View>
        </View>
        <Text className="mb-4 font-body text-base leading-6 text-neutral-500">
          Deleting your account will permanently remove it from the device. If you continue, you
          will not be able to recover, access or perform any other action with this account in Rail.
        </Text>
        <Text className="mb-6 font-body text-base leading-6 text-neutral-500">
          Any remaining funds in your account will be transferred to our company treasury before
          deletion.
        </Text>
        <View className="flex-row gap-3">
          <Button title="Cancel" variant="ghost" onPress={closeSheet} disabled={isDeleting} flex />
          <Button
            title={isDeleting ? '' : 'Delete Account'}
            variant="orange"
            onPress={handleDeleteAccount}
            disabled={isDeleting}
            flex>
            {isDeleting && <ActivityIndicator color="#fff" />}
          </Button>
        </View>
      </BottomSheet>
    </View>
  );
}
