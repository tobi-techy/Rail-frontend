import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomSheet, SettingsSheet } from '@/components/sheets';
import { SegmentedSlider } from '@/components/molecules';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores';
import type { Currency } from '@/stores/uiStore';
import { Button, Input } from '@/components/ui';
import { logger } from '@/lib/logger';
import {
  useAllocationBalances,
  useCreatePasscode,
  useEnableAllocationMode,
  usePasscodeStatus,
  useUpdatePasscode,
} from '@/api/hooks';
import gleap from '@/utils/gleap';
import { formatFxUpdatedAt, migrateLegacyCurrency } from '@/utils/currency';

// ── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_BASE_ALLOCATION = 70;
const PIN_REGEX = /^\d{4}$/;
const PIN_MAX_LENGTH = 4;
const MIN_BASE_ALLOCATION = 1;
const MAX_BASE_ALLOCATION = 99;

// ── Types ────────────────────────────────────────────────────────────────────

type SettingItem = { icon: ReactNode; label: string; onPress?: () => void; danger?: boolean };

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

// ── Pure helpers ─────────────────────────────────────────────────────────────

const sanitizePin = (v: string) => v.replace(/\D/g, '').slice(0, PIN_MAX_LENGTH);
const clampAlloc = (v: number) =>
  Number.isFinite(v)
    ? Math.min(MAX_BASE_ALLOCATION, Math.max(MIN_BASE_ALLOCATION, Math.round(v)))
    : DEFAULT_BASE_ALLOCATION;
const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const m = (error as { message?: unknown }).message;
    if (typeof m === 'string' && m.trim()) return m;
  }
  return fallback;
};

// ── UI primitives ─────────────────────────────────────────────────────────────

const SettingButton = ({ icon, label, onPress, danger }: SettingItem) => (
  <TouchableOpacity className="mb-md w-[25%] items-center" onPress={onPress}>
    <View className="h-12 w-12 items-center justify-center">{icon}</View>
    <Text
      className={`mt-xs text-center font-caption text-caption ${danger ? 'text-destructive' : 'text-text-primary'}`}
      numberOfLines={2}>
      {label}
    </Text>
  </TouchableOpacity>
);

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
  <TouchableOpacity
    className="flex-row items-center justify-between border-b border-surface py-4"
    onPress={onPress}>
    <Text className="font-body text-base text-text-primary">{label}</Text>
    {value && <Text className="font-body text-base text-text-secondary">{value}</Text>}
  </TouchableOpacity>
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

// ── Main component ────────────────────────────────────────────────────────────

export default function Settings() {
  const navigation = useNavigation();

  // Auth store
  const logout = useAuthStore((s) => s.logout);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const hasPasscodeInStore = useAuthStore((s) => s.hasPasscode);

  // UI store
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

  // Sheet state
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const closeSheet = () => setActiveSheet(null);

  // Spend settings
  const [baseAllocation, setBaseAllocation] = useState(DEFAULT_BASE_ALLOCATION);
  const [autoInvestEnabled, setAutoInvestEnabled] = useState(false);
  const [roundupsEnabled, setRoundupsEnabled] = useState(true);
  const [spendingLimit, setSpendingLimit] = useState(500);
  const [allocationFeedback, setAllocationFeedback] = useState<string | null>(null);

  // PIN state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);

  // Account state
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // API hooks
  const { data: allocationBalances, refetch: refetchAllocationBalances } = useAllocationBalances();
  const { mutateAsync: enableAllocationMode, isPending: isEnablingAllocation } =
    useEnableAllocationMode();
  const { data: passcodeStatus, refetch: refetchPasscodeStatus } = usePasscodeStatus();
  const { mutateAsync: createPasscode, isPending: isCreatingPasscode } = useCreatePasscode();
  const { mutateAsync: updatePasscode, isPending: isUpdatingPasscode } = useUpdatePasscode();

  const hasPasscodeConfigured = passcodeStatus?.enabled ?? hasPasscodeInStore;
  const isSavingAllocation = isEnablingAllocation;
  const isSavingPin = isCreatingPasscode || isUpdatingPasscode;

  // Persist spend settings
  useEffect(() => {
    AsyncStorage.multiGet([
      'baseAllocation',
      'autoInvestEnabled',
      'roundupsEnabled',
      'spendingLimit',
    ]).then((values) => {
      values.forEach(([key, value]) => {
        if (value === null) return;
        if (key === 'baseAllocation') setBaseAllocation(clampAlloc(Number(value)));
        else if (key === 'autoInvestEnabled') setAutoInvestEnabled(value === 'true');
        else if (key === 'roundupsEnabled') setRoundupsEnabled(value === 'true');
        else if (key === 'spendingLimit') setSpendingLimit(Number(value));
      });
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      AsyncStorage.multiSet([
        ['baseAllocation', String(baseAllocation)],
        ['autoInvestEnabled', String(autoInvestEnabled)],
        ['roundupsEnabled', String(roundupsEnabled)],
        ['spendingLimit', String(spendingLimit)],
      ]);
    }, 300);
    return () => clearTimeout(t);
  }, [baseAllocation, autoInvestEnabled, roundupsEnabled, spendingLimit]);

  useEffect(() => {
    if (activeSheet !== 'pin') return;
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setPinError(null);
    setPinSuccess(null);
    void refetchPasscodeStatus();
  }, [activeSheet, refetchPasscodeStatus]);

  useEffect(() => {
    if (activeSheet !== 'currency') return;
    if (currencyRatesUpdatedAt) return;
    void refreshCurrencyRates();
  }, [activeSheet, currencyRatesUpdatedAt, refreshCurrencyRates]);

  useEffect(() => {
    if (currency === selectedCurrency) return;
    setCurrency(selectedCurrency);
  }, [currency, selectedCurrency, setCurrency]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <View className="flex-row items-center gap-x-3 pl-[14px]">
          <Text className="font-subtitle text-headline-1">Settings</Text>
        </View>
      ),
      headerShown: true,
      title: '',
      headerStyle: { backgroundColor: '#FFFFFF' },
      headerShadowVisible: false,
    });
  }, [navigation]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSaveAllocation = async () => {
    if (isSavingAllocation) return;
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
      Alert.alert('Split Update Failed', msg);
    }
  };

  const handleSubmitPin = async () => {
    if (isSavingPin) return;
    setPinError(null);
    setPinSuccess(null);
    if (hasPasscodeConfigured && !PIN_REGEX.test(currentPin)) {
      setPinError('Current PIN must be exactly 4 digits.');
      return;
    }
    if (!PIN_REGEX.test(newPin)) {
      setPinError('New PIN must be exactly 4 digits.');
      return;
    }
    if (!PIN_REGEX.test(confirmPin)) {
      setPinError('Confirm PIN must be exactly 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('New PIN and confirmation do not match.');
      return;
    }
    try {
      if (hasPasscodeConfigured) {
        await updatePasscode({
          currentPasscode: currentPin,
          newPasscode: newPin,
          confirmPasscode: confirmPin,
        });
      } else {
        await createPasscode({ passcode: newPin, confirmPasscode: confirmPin });
      }
      setPinSuccess(
        hasPasscodeConfigured ? 'PIN updated successfully.' : 'PIN created successfully.'
      );
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      await refetchPasscodeStatus();
      setTimeout(() => closeSheet(), 500);
    } catch (error) {
      setPinError(
        getErrorMessage(
          error,
          hasPasscodeConfigured ? 'Failed to update PIN.' : 'Failed to create PIN.'
        )
      );
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      Alert.alert('Success', 'You have been logged out successfully.');
      closeSheet();
    } catch (error) {
      logger.error('[Settings] Logout error', {
        component: 'Settings',
        action: 'logout-error',
        error: error instanceof Error ? error.message : 'unknown',
      });
      Alert.alert(
        'Logout Issue',
        'We had trouble logging you out from the server. Your local session has been cleared for security. You may need to log back in.',
        [{ text: 'OK', onPress: closeSheet }]
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAccount('User requested account deletion');
      closeSheet();
      const fundsMessage =
        parseFloat(result.funds_swept) > 0
          ? `\n\n$${result.funds_swept} was transferred to our treasury wallet.`
          : '';
      Alert.alert('Account Deleted', `Your account has been permanently deleted.${fundsMessage}`);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const CURRENCIES: Currency[] = ['USD', 'EUR'];
  const CURRENCY_LABELS: Record<Currency, string> = {
    USD: 'US Dollar (USD)',
    EUR: 'Euro (EUR)',
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View className="flex-1 bg-background-main">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <Section title="Spend">
          <SettingButton
            icon={<ArrowLeftRight size={26} color="#121212" />}
            label="Base/Active Split"
            onPress={() => {
              setAllocationFeedback(null);
              setActiveSheet('allocation');
              void refetchAllocationBalances();
            }}
          />
          <SettingButton
            icon={<TrendingUp size={26} color="#121212" />}
            label="Auto Invest"
            onPress={() => setActiveSheet('autoInvest')}
          />
          <SettingButton
            icon={<Repeat2 size={26} color="#121212" />}
            label="Round-ups"
            onPress={() => setActiveSheet('roundups')}
          />
          <SettingButton
            icon={<Scale size={26} color="#121212" />}
            label="Limits"
            onPress={() => setActiveSheet('limits')}
          />
        </Section>

        <Section title="Preferences">
          <SettingButton
            icon={
              isBalanceVisible ? (
                <Eye size={26} color="#121212" />
              ) : (
                <EyeOff size={26} color="#121212" />
              )
            }
            label="Privacy"
            onPress={() => setActiveSheet('privacy')}
          />
          <SettingButton
            icon={<Vibrate size={26} color="#121212" />}
            label="Haptics"
            onPress={() => setActiveSheet('haptics')}
          />
          <SettingButton
            icon={<Lock size={26} color="#121212" />}
            label="App Lock"
            onPress={() => setActiveSheet('lockOnResume')}
          />
          <SettingButton
            icon={<Bell size={26} color="#121212" />}
            label="Notifications"
            onPress={() => router.push('/settings-notifications')}
          />
          <SettingButton
            icon={<Sun size={26} color="#121212" />}
            label="Theme"
            onPress={() =>
              Alert.alert(
                'Coming Soon',
                'Theme switching will be available once dark and light mode are fully implemented.'
              )
            }
          />
          <SettingButton
            icon={<Globe size={26} color="#121212" />}
            label="Language"
            onPress={() =>
              Alert.alert('Coming Soon', 'Language selection will be available in a future update.')
            }
          />
          <SettingButton
            icon={<Globe size={26} color="#121212" />}
            label="Currency"
            onPress={() => setActiveSheet('currency')}
          />
        </Section>

        <Section title="Security">
          <SettingButton
            icon={<Shield size={26} color="#121212" />}
            label="PIN"
            onPress={() => setActiveSheet('pin')}
          />
          <SettingButton
            icon={<KeyRound size={26} color="#121212" />}
            label="Passkeys"
            onPress={() => router.push('/passkey-settings')}
          />
          <SettingButton icon={<ShieldCheck size={26} color="#121212" />} label="2-Factor Auth" />
        </Section>

        <Section title="More">
          <SettingButton icon={<Users size={26} color="#121212" />} label="Referrals" />
          <SettingButton icon={<Scale size={26} color="#121212" />} label="Legal" />
          <SettingButton
            icon={<HeadphonesIcon size={26} color="#121212" />}
            label="Support"
            onPress={() => gleap.open()}
          />
        </Section>

        <Section title="Account">
          <SettingButton
            icon={<LogOut size={26} color="#F44336" />}
            label="Logout"
            danger
            onPress={() => setActiveSheet('logout')}
          />
          <SettingButton
            icon={<Trash2 size={26} color="#F44336" />}
            label="Delete Account"
            danger
            onPress={() => setActiveSheet('delete')}
          />
        </Section>
      </ScrollView>

      {/* ── Spend sheets ── */}
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
          title={isSavingAllocation ? '' : 'Save Changes'}
          variant="black"
          onPress={handleSaveAllocation}
          disabled={isSavingAllocation}
          flex>
          {isSavingAllocation && <ActivityIndicator color="#fff" />}
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

      {/* ── Preference sheets ── */}
      <BottomSheet visible={activeSheet === 'privacy'} onClose={closeSheet}>
        <Text className="mb-4 font-subtitle text-xl">Privacy</Text>
        <SheetToggleRow
          label="Hide Balances"
          subtitle="Mask all monetary values in the app"
          value={!isBalanceVisible}
          onChange={(v) => toggleBalanceVisibility()}
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
          <TouchableOpacity
            className="h-9 w-9 items-center justify-center rounded-full bg-surface"
            disabled={isCurrencyRatesRefreshing}
            onPress={() => void refreshCurrencyRates({ forceRefresh: true })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            {isCurrencyRatesRefreshing ? (
              <ActivityIndicator size="small" color="#111827" />
            ) : (
              <RefreshCw size={16} color="#111827" />
            )}
          </TouchableOpacity>
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

      {/* ── Security sheets ── */}
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

      {/* ── Account sheets ── */}
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
