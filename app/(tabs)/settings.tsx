import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { LogOut } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from 'expo-router';
import { useLayoutEffect, useState, useEffect, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomSheet, SettingsSheet } from '@/components/sheets';
import { SegmentedSlider } from '@/components/molecules';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input } from '@/components/ui';
import { logger } from '@/lib/logger';
import {
  useAllocationBalances,
  useCreatePasscode,
  useDisableAllocationMode,
  useEnableAllocationMode,
  usePasscodeStatus,
  useUpdatePasscode,
} from '@/api/hooks';
import {
  AllocationIcon,
  AutoInvestIcon,
  RoundupIcon,
  SwapIcon,
  BiometricsIcon,
  SecurityIcon,
  TrashIcon,
  RefferalIcon,
  LegalIcon,
  SupportIcon,
  LogOutIcon,
  TwoFactorAuthIcon,
} from '@/assets/svg/filled';

const DEFAULT_BASE_ALLOCATION = 70;
const PIN_REGEX = /^\d{4}$/;
const PIN_MAX_LENGTH = 4;
const MIN_BASE_ALLOCATION = 1;
const MAX_BASE_ALLOCATION = 99;

type SettingItem = { icon: ReactNode; label: string; onPress?: () => void; danger?: boolean };

type SheetType =
  | 'allocation'
  | 'autoInvest'
  | 'roundups'
  | 'limits'
  | 'biometrics'
  | 'pin'
  | 'logout'
  | 'delete'
  | null;

const SettingButton = ({ icon, label, onPress, danger }: SettingItem) => (
  <TouchableOpacity
    className="mb-md w-[25%] items-center"
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress?.();
    }}>
    <View className="h-12 w-12 items-center justify-center">{icon}</View>
    <Text
      className={`mt-xs text-center font-caption text-caption ${danger ? 'text-destructive' : 'text-text-primary'}`}
      numberOfLines={2}>
      {label}
    </Text>
  </TouchableOpacity>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View className="border-b border-surface py-md">
    <Text className="mb-md px-md font-subtitle text-body">{title}</Text>
    <View className="flex-row flex-wrap px-sm">{children}</View>
  </View>
);

const sanitizePin = (value: string) => value.replace(/\D/g, '').slice(0, PIN_MAX_LENGTH);
const clampBaseAllocation = (value: number) => {
  if (!Number.isFinite(value)) return DEFAULT_BASE_ALLOCATION;
  return Math.min(MAX_BASE_ALLOCATION, Math.max(MIN_BASE_ALLOCATION, Math.round(value)));
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
};

export default function Settings() {
  const navigation = useNavigation();

  const logout = useAuthStore((s) => s.logout);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const isBiometricEnabled = useAuthStore((s) => s.isBiometricEnabled);
  const hasPasscodeInStore = useAuthStore((s) => s.hasPasscode);
  const enableBiometric = useAuthStore((s) => s.enableBiometric);
  const disableBiometric = useAuthStore((s) => s.disableBiometric);

  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const [baseAllocation, setBaseAllocation] = useState(DEFAULT_BASE_ALLOCATION);
  const [autoInvestEnabled, setAutoInvestEnabled] = useState(false);
  const [roundupsEnabled, setRoundupsEnabled] = useState(true);
  const [spendingLimit, setSpendingLimit] = useState(500);
  const [biometricsEnabled, setBiometricsEnabled] = useState(isBiometricEnabled);
  const [isAllocationModeActive, setIsAllocationModeActive] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [allocationFeedback, setAllocationFeedback] = useState<string | null>(null);

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);

  const { data: allocationBalances, refetch: refetchAllocationBalances } = useAllocationBalances();
  const { mutateAsync: enableAllocationMode, isPending: isEnablingAllocation } =
    useEnableAllocationMode();
  const { mutateAsync: disableAllocationMode, isPending: isDisablingAllocation } =
    useDisableAllocationMode();

  const { data: passcodeStatus, refetch: refetchPasscodeStatus } = usePasscodeStatus();
  const { mutateAsync: createPasscode, isPending: isCreatingPasscode } = useCreatePasscode();
  const { mutateAsync: updatePasscode, isPending: isUpdatingPasscode } = useUpdatePasscode();

  const hasPasscodeConfigured = passcodeStatus?.enabled ?? hasPasscodeInStore;
  const isSavingAllocation = isEnablingAllocation || isDisablingAllocation;
  const isSavingPin = isCreatingPasscode || isUpdatingPasscode;

  useEffect(() => {
    AsyncStorage.multiGet([
      'baseAllocation',
      'autoInvestEnabled',
      'roundupsEnabled',
      'spendingLimit',
    ]).then((values) => {
      values.forEach(([key, value]) => {
        if (value === null) return;
        if (key === 'baseAllocation') setBaseAllocation(clampBaseAllocation(Number(value)));
        else if (key === 'autoInvestEnabled') setAutoInvestEnabled(value === 'true');
        else if (key === 'roundupsEnabled') setRoundupsEnabled(value === 'true');
        else if (key === 'spendingLimit') setSpendingLimit(Number(value));
      });
    });
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      AsyncStorage.multiSet([
        ['baseAllocation', String(baseAllocation)],
        ['autoInvestEnabled', String(autoInvestEnabled)],
        ['roundupsEnabled', String(roundupsEnabled)],
        ['spendingLimit', String(spendingLimit)],
      ]);
    }, 300);
    return () => clearTimeout(timeout);
  }, [baseAllocation, autoInvestEnabled, roundupsEnabled, spendingLimit]);

  useEffect(() => {
    setBiometricsEnabled(isBiometricEnabled);
  }, [isBiometricEnabled]);

  useEffect(() => {
    if (biometricsEnabled === isBiometricEnabled) return;
    if (biometricsEnabled) {
      enableBiometric();
      return;
    }
    disableBiometric();
  }, [biometricsEnabled, isBiometricEnabled, enableBiometric, disableBiometric]);

  useEffect(() => {
    if (allocationBalances?.mode_active === undefined) return;
    setIsAllocationModeActive(allocationBalances.mode_active);
  }, [allocationBalances?.mode_active]);

  useEffect(() => {
    if (activeSheet !== 'pin') return;
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setPinError(null);
    setPinSuccess(null);
    void refetchPasscodeStatus();
  }, [activeSheet, refetchPasscodeStatus]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <View className="flex-row items-center gap-x-3 pl-[14px]">
          <Text className="font-subtitle text-headline-1">Settings</Text>
        </View>
      ),
      headerShown: true,
      title: '',
      headerStyle: { backgroundColor: 'transparent' },
    });
  }, [navigation]);

  const closeSheet = () => setActiveSheet(null);

  const openAllocationSheet = () => {
    setAllocationFeedback(null);
    setActiveSheet('allocation');
    void refetchAllocationBalances();
  };

  const openPinSheet = () => {
    setActiveSheet('pin');
  };

  const handleBiometricToggle = (value: boolean) => {
    if (value && !hasPasscodeConfigured) {
      Alert.alert(
        'PIN Required',
        'Create a 4-digit PIN first. Biometrics are only available after PIN setup.'
      );
      return;
    }
    setBiometricsEnabled(value);
  };

  const handleSaveAllocation = async () => {
    if (isSavingAllocation) return;

    const spendingRatio = Math.min(0.99, Math.max(0.01, baseAllocation / 100));
    const stashRatio = Number((1 - spendingRatio).toFixed(2));

    try {
      const response = await enableAllocationMode({
        spending_ratio: Number(spendingRatio.toFixed(2)),
        stash_ratio: stashRatio,
      });
      setIsAllocationModeActive(true);
      setAllocationFeedback(response.message || 'Base/Active split updated.');
      await refetchAllocationBalances();
      closeSheet();
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to update Base/Active split.');
      setAllocationFeedback(errorMessage);
      Alert.alert('Split Update Failed', errorMessage);
    }
  };

  const handleDisableAllocation = async () => {
    if (isSavingAllocation) return;
    try {
      const response = await disableAllocationMode();
      setIsAllocationModeActive(false);
      setAllocationFeedback(response.message || 'Base/Active split disabled.');
      await refetchAllocationBalances();
      closeSheet();
    } catch (error) {
      const errorMessage = getErrorMessage(error, 'Failed to disable Base/Active split.');
      setAllocationFeedback(errorMessage);
      Alert.alert('Disable Failed', errorMessage);
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
        await createPasscode({
          passcode: newPin,
          confirmPasscode: confirmPin,
        });
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
      const fallback = hasPasscodeConfigured ? 'Failed to update PIN.' : 'Failed to create PIN.';
      setPinError(getErrorMessage(error, fallback));
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      Alert.alert('Success', 'You have been logged out successfully.');
      closeSheet();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to log out';
      logger.error('[Settings] Logout error', {
        component: 'Settings',
        action: 'logout-error',
        error: errorMessage,
      });
      Alert.alert(
        'Logout Issue',
        'We had trouble logging you out from the server. Your local session has been cleared for security. You may need to log back in.',
        [
          {
            text: 'OK',
            onPress: () => closeSheet(),
          },
        ]
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

  return (
    <View className="flex-1 bg-background-main">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <Section title="Spend">
          <SettingButton
            icon={<AllocationIcon width={34} height={34} color="#121212" />}
            label="Base/Active Split"
            onPress={openAllocationSheet}
          />
          <SettingButton
            icon={<AutoInvestIcon width={34} height={34} />}
            label="Auto Invest"
            onPress={() => setActiveSheet('autoInvest')}
          />
          <SettingButton
            icon={<RoundupIcon width={34} height={34} />}
            label="Round-ups"
            onPress={() => setActiveSheet('roundups')}
          />
          <SettingButton
            icon={<SwapIcon width={34} height={34} color="#121212" />}
            label="Limits"
            onPress={() => setActiveSheet('limits')}
          />
        </Section>

        <Section title="Security">
          <SettingButton
            icon={<BiometricsIcon width={34} height={34} color="#121212" />}
            label="Biometrics"
            onPress={() => setActiveSheet('biometrics')}
          />
          <SettingButton
            icon={<SecurityIcon width={34} height={34} color="#121212" />}
            label="PIN"
            onPress={openPinSheet}
          />
          <SettingButton
            icon={<TwoFactorAuthIcon width={34} height={34} color="#121212" />}
            label={'2-Factor Auth'}
          />
        </Section>

        <Section title="More">
          <SettingButton
            icon={<RefferalIcon width={34} height={34} color="#121212" />}
            label="Referrals"
          />
          <SettingButton
            icon={<LegalIcon width={34} height={34} color="#121212" />}
            label="Legal"
          />
          <SettingButton
            icon={<SupportIcon width={34} height={34} color="#121212" />}
            label="Support"
          />
        </Section>

        <Section title="Account">
          <SettingButton
            icon={<LogOutIcon width={34} height={34} color="#F44336" />}
            label="Logout"
            danger
            onPress={() => setActiveSheet('logout')}
          />
          <SettingButton
            icon={<TrashIcon width={34} height={34} color="#F44336" />}
            label={'Delete Account'}
            danger
            onPress={() => setActiveSheet('delete')}
          />
        </Section>
      </ScrollView>

      <BottomSheet visible={activeSheet === 'allocation'} onClose={closeSheet}>
        <Text className="mb-6 font-subtitle text-xl">Base/Active Split</Text>
        <Text className="mb-6 font-body text-base leading-6 text-neutral-500">
          Set how new deposits are split between Base and Active allocations.
        </Text>

        {allocationFeedback ? (
          <View className="mb-4 rounded-xl border border-neutral-200 bg-neutral-100 p-3">
            <Text className="font-caption text-caption text-text-secondary">
              {allocationFeedback}
            </Text>
          </View>
        ) : null}

        <SegmentedSlider
          value={baseAllocation}
          onValueChange={(value) => setBaseAllocation(clampBaseAllocation(value))}
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

        <View className="flex-row gap-3">
          <Button
            title={isSavingAllocation ? '' : 'Save Changes'}
            variant="black"
            onPress={handleSaveAllocation}
            disabled={isSavingAllocation}
            flex>
            {isSavingAllocation && <ActivityIndicator color="#fff" />}
          </Button>
        </View>
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
          Set your daily spending limit to help manage your expenses and stay on budget.
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

      <SettingsSheet
        visible={activeSheet === 'biometrics'}
        onClose={closeSheet}
        title="Biometrics"
        subtitle="Use Face ID or fingerprint to unlock the app and authorize transactions."
        toggleLabel="Enable Biometrics"
        toggleValue={biometricsEnabled}
        onToggleChange={handleBiometricToggle}
      />

      <BottomSheet visible={activeSheet === 'pin'} onClose={closeSheet}>
        <Text className="mb-2 font-subtitle text-xl">
          {hasPasscodeConfigured ? 'Update PIN' : 'Create PIN'}
        </Text>
        <Text className="mb-6 font-body text-base leading-6 text-neutral-500">
          Enter a 4-digit PIN used to unlock sensitive actions on your account.
        </Text>

        <View className="gap-3">
          {hasPasscodeConfigured ? (
            <Input
              label="Current PIN"
              value={currentPin}
              onChangeText={(value) => setCurrentPin(sanitizePin(value))}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={PIN_MAX_LENGTH}
              placeholder="••••"
            />
          ) : null}
          <Input
            label={hasPasscodeConfigured ? 'New PIN' : 'PIN'}
            value={newPin}
            onChangeText={(value) => setNewPin(sanitizePin(value))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={PIN_MAX_LENGTH}
            placeholder="••••"
          />
          <Input
            label="Confirm PIN"
            value={confirmPin}
            onChangeText={(value) => setConfirmPin(sanitizePin(value))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={PIN_MAX_LENGTH}
            placeholder="••••"
          />
        </View>

        {pinError ? (
          <Text className="mt-3 font-caption text-caption text-destructive">{pinError}</Text>
        ) : null}
        {pinSuccess ? (
          <Text className="mt-3 font-caption text-caption text-success">{pinSuccess}</Text>
        ) : null}

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
            <TrashIcon width={34} height={34} color="#EF4444" />
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
