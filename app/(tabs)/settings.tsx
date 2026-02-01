import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LogOut } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from 'expo-router';
import { useLayoutEffect, useState, useEffect, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomSheet, SettingsSheet } from '@/components/sheets';
import { SegmentedSlider } from '@/components/molecules';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui';
import {
  AllocationIcon,
  AutoInvestIcon,
  RoundupIcon,
  SwapIcon,
  BiometricsIcon,
  SecurityIcon,
  NotificationIcon,
  TrashIcon,
  RefferalIcon,
  LegalIcon,
  SupportIcon,
  LogOutIcon,
  TwoFactorAuthIcon,
} from '@/assets/svg/filled';

type SettingItem = { icon: ReactNode; label: string; onPress?: () => void; danger?: boolean };

type SheetType =
  | 'allocation'
  | 'autoInvest'
  | 'roundups'
  | 'limits'
  | 'biometrics'
  | 'notifications'
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

export default function Settings() {
  const navigation = useNavigation();
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const [baseAllocation, setBaseAllocation] = useState(60);
  const [autoInvestEnabled, setAutoInvestEnabled] = useState(false);
  const [roundupsEnabled, setRoundupsEnabled] = useState(true);
  const [spendingLimit, setSpendingLimit] = useState(500);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    AsyncStorage.multiGet([
      'baseAllocation',
      'autoInvestEnabled',
      'roundupsEnabled',
      'spendingLimit',
      'biometricsEnabled',
      'notificationsEnabled',
    ]).then((values) => {
      values.forEach(([key, value]) => {
        if (value !== null) {
          if (key === 'baseAllocation') setBaseAllocation(Number(value));
          else if (key === 'autoInvestEnabled') setAutoInvestEnabled(value === 'true');
          else if (key === 'roundupsEnabled') setRoundupsEnabled(value === 'true');
          else if (key === 'spendingLimit') setSpendingLimit(Number(value));
          else if (key === 'biometricsEnabled') setBiometricsEnabled(value === 'true');
          else if (key === 'notificationsEnabled') setNotificationsEnabled(value === 'true');
        }
      });
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('baseAllocation', String(baseAllocation));
  }, [baseAllocation]);

  useEffect(() => {
    AsyncStorage.setItem('autoInvestEnabled', String(autoInvestEnabled));
  }, [autoInvestEnabled]);

  useEffect(() => {
    AsyncStorage.setItem('roundupsEnabled', String(roundupsEnabled));
  }, [roundupsEnabled]);

  useEffect(() => {
    AsyncStorage.setItem('spendingLimit', String(spendingLimit));
  }, [spendingLimit]);

  useEffect(() => {
    AsyncStorage.setItem('biometricsEnabled', String(biometricsEnabled));
  }, [biometricsEnabled]);

  useEffect(() => {
    AsyncStorage.setItem('notificationsEnabled', String(notificationsEnabled));
  }, [notificationsEnabled]);

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

  const handleLogout = () => {
    closeSheet();
    logout();
  };

  const handleDeleteAccount = () => {
    closeSheet();
    Alert.alert('Account Deleted', 'Your account deletion request has been submitted.');
  };

  return (
    <View className="flex-1 bg-background-main">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <Section title="Spend">
          <SettingButton
            icon={<AllocationIcon width={34} height={34} color="#121212" />}
            label="Base/Active Split"
            onPress={() => setActiveSheet('allocation')}
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
          />
          <SettingButton
            icon={<TwoFactorAuthIcon width={34} height={34} color="#121212" />}
            label={'2-Factor Auth'}
          />
        </Section>

        <Section title="More">
          <SettingButton
            icon={<NotificationIcon width={34} height={34} color="#121212" />}
            label="Notifications"
            onPress={() => setActiveSheet('notifications')}
          />
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

      {/* Base/Active Split Sheet */}
      <BottomSheet visible={activeSheet === 'allocation'} onClose={closeSheet}>
        <Text className="mb-6 font-subtitle text-xl">Base/Active Split</Text>
        <Text className="mb-6 font-body text-base leading-6 text-neutral-500">
          Set how your deposits are split between Base (savings) and Active (investments).
        </Text>
        <SegmentedSlider
          value={baseAllocation}
          onValueChange={setBaseAllocation}
          label="Base Allocation"
          segments={50}
          activeColor="#8B5CF6"
        />
        <View className="my-4 flex-row justify-between">
          <View className="items-center">
            <Text className="font-subtitle text-2xl">{baseAllocation}%</Text>
            <Text className="font-caption text-sm text-text-secondary">Base (Savings)</Text>
          </View>
          <View className="items-center">
            <Text className="font-subtitle text-2xl">{100 - baseAllocation}%</Text>
            <Text className="font-caption text-sm text-text-secondary">Active (Invest)</Text>
          </View>
        </View>
        <Button title="Save Changes" variant="black" onPress={closeSheet} />
      </BottomSheet>

      {/* Auto Invest Sheet */}
      <SettingsSheet
        visible={activeSheet === 'autoInvest'}
        onClose={closeSheet}
        title="Auto Invest"
        subtitle="Automatically invest spare change and scheduled deposits."
        toggleLabel="Enable Auto Invest"
        toggleValue={autoInvestEnabled}
        onToggleChange={setAutoInvestEnabled}
      />

      {/* Round-ups Sheet */}
      <SettingsSheet
        visible={activeSheet === 'roundups'}
        onClose={closeSheet}
        title="Round-ups"
        subtitle="Round up purchases to the nearest dollar and invest the difference."
        toggleLabel="Enable Round-ups"
        toggleValue={roundupsEnabled}
        onToggleChange={setRoundupsEnabled}
      />

      {/* Spending Limits Sheet */}
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

      {/* Biometrics Sheet */}
      <SettingsSheet
        visible={activeSheet === 'biometrics'}
        onClose={closeSheet}
        title="Biometrics"
        subtitle="Use Face ID or fingerprint to unlock the app and authorize transactions."
        toggleLabel="Enable Biometrics"
        toggleValue={biometricsEnabled}
        onToggleChange={setBiometricsEnabled}
      />

      {/* Notifications Sheet */}
      <SettingsSheet
        visible={activeSheet === 'notifications'}
        onClose={closeSheet}
        title="Notifications"
        subtitle="Receive alerts for transactions, deposits, and account activity."
        toggleLabel="Push Notifications"
        toggleValue={notificationsEnabled}
        onToggleChange={setNotificationsEnabled}
      />

      {/* Logout Sheet */}
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
          <Button title="Cancel" variant="ghost" onPress={closeSheet} flex />
          <Button title="Log Out" variant="black" onPress={handleLogout} flex />
        </View>
      </BottomSheet>

      {/* Delete Account Sheet */}
      <BottomSheet visible={activeSheet === 'delete'} onClose={closeSheet}>
        <Text className="mb-6 font-subtitle text-xl text-text-primary">Delete Account</Text>

        {/* Wallet Card Illustration */}
        <View className="mb-6 items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-100 py-10">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <TrashIcon width={34} height={34} color="#EF4444" />
          </View>
        </View>

        <Text className="mb-4 font-body text-base leading-6 text-neutral-500">
          Deleting your account will permanently remove it from the device. If you continue, you
          will not be able to recover, access or perform any other action with this account in Rail.
          Any assets left in this account will be lost.
        </Text>

        <Text className="mb-6 font-body text-base leading-6 text-neutral-500">
          By continuing, you confirm that you have sent out all assets before deleting the account
          and any assets left in the account after deletion will be inaccessible.
        </Text>

        <View className="flex-row gap-3">
          <Button title="Cancel" variant="ghost" onPress={closeSheet} flex />
          <Button title="Continue" variant="orange" onPress={handleDeleteAccount} flex />
        </View>
      </BottomSheet>
    </View>
  );
}
