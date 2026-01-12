import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { BottomSheet, SettingsSheet } from '@/components/sheets';
import { SegmentedSlider } from '@/components/molecules';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui';

type SettingItem = { icon: React.ReactNode; label: string; onPress?: () => void; danger?: boolean };

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
        <Section title="Rail Allocation">
          <SettingButton
            icon={<Ionicons name="pie-chart-outline" size={24} color="#121212" />}
            label={'Base/Active Split'}
            onPress={() => setActiveSheet('allocation')}
          />
          <SettingButton
            icon={<Ionicons name="flash-outline" size={24} color="#121212" />}
            label={'Auto Invest'}
            onPress={() => setActiveSheet('autoInvest')}
          />
        </Section>

        <Section title="Spend">
          <SettingButton
            icon={<Ionicons name="arrow-up-circle-outline" size={24} color="#121212" />}
            label="Round-ups"
            onPress={() => setActiveSheet('roundups')}
          />
          <SettingButton
            icon={<Ionicons name="swap-horizontal-outline" size={24} color="#121212" />}
            label="Limits"
            onPress={() => setActiveSheet('limits')}
          />
        </Section>

        <Section title="Security">
          <SettingButton
            icon={<Ionicons name="finger-print-outline" size={24} color="#121212" />}
            label="Biometrics"
            onPress={() => setActiveSheet('biometrics')}
          />
          <SettingButton
            icon={<Ionicons name="lock-closed-outline" size={24} color="#121212" />}
            label="PIN"
          />
          <SettingButton
            icon={<Ionicons name="shield-checkmark-outline" size={24} color="#121212" />}
            label={'2-Factor Auth'}
          />
        </Section>

        <Section title="More">
          <SettingButton
            icon={<Ionicons name="notifications-outline" size={24} color="#121212" />}
            label="Notifications"
            onPress={() => setActiveSheet('notifications')}
          />
          <SettingButton
            icon={<Ionicons name="gift-outline" size={24} color="#121212" />}
            label="Referrals"
          />
          <SettingButton
            icon={<Ionicons name="document-text-outline" size={24} color="#121212" />}
            label="Legal"
          />
          <SettingButton
            icon={<Ionicons name="help-circle-outline" size={24} color="#121212" />}
            label="Support"
          />
        </Section>

        <Section title="Account">
          <SettingButton
            icon={<Ionicons name="log-out-outline" size={24} color="#F44336" />}
            label="Logout"
            danger
            onPress={() => setActiveSheet('logout')}
          />
          <SettingButton
            icon={<Ionicons name="trash-outline" size={24} color="#F44336" />}
            label={'Delete Account'}
            danger
            onPress={() => setActiveSheet('delete')}
          />
        </Section>
      </ScrollView>

      {/* Base/Active Split Sheet */}
      <BottomSheet visible={activeSheet === 'allocation'} onClose={closeSheet}>
        <Text className="mb-2 font-subtitle text-xl">Base/Active Split</Text>
        <Text className="mb-6 font-body text-sm text-text-secondary">
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
        <Text className="mb-2 font-subtitle text-xl">Spending Limits</Text>
        <Text className="mb-6 font-body text-sm text-text-secondary">
          Set your daily spending limit.
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
        <Text className="mb-2 font-subtitle text-xl">Log Out</Text>
        <Text className="mb-6 font-body text-sm text-text-secondary">
          Are you sure you want to log out of your account?
        </Text>
        <View className="flex-row gap-3">
          <Button title="Log Out" variant="black" onPress={handleLogout} flex />
          <Button title="Cancel" variant="ghost" onPress={closeSheet} flex />
        </View>
      </BottomSheet>

      {/* Delete Account Sheet */}
      <BottomSheet visible={activeSheet === 'delete'} onClose={closeSheet}>
        <Text className="mb-2 font-subtitle text-xl text-[#F44336]">Delete Account</Text>
        <Text className="mb-6 font-body text-sm text-text-secondary">
          This action is permanent and cannot be undone. All your data will be deleted.
        </Text>
        <View className="flex-row gap-3">
          <Button title="Delete Account" variant="destructive" onPress={handleDeleteAccount} flex />
          <Button title="Cancel" variant="ghost" onPress={closeSheet} flex />
        </View>
      </BottomSheet>
    </View>
  );
}
