import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';

type SettingItem = { icon: React.ReactNode; label: string; onPress?: () => void; danger?: boolean };

const SettingButton = ({ icon, label, onPress, danger }: SettingItem) => (
  <TouchableOpacity
    className="items-center w-[25%] mb-md"
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress?.();
    }}>
    <View className="w-12 h-12 items-center justify-center">{icon}</View>
    <Text className={`text-caption font-caption text-center mt-xs ${danger ? 'text-destructive' : 'text-text-primary'}`} numberOfLines={2}>
      {label}
    </Text>
  </TouchableOpacity>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View className="py-md border-b border-surface">
    <Text className="text-body font-subtitle mb-md px-md">{title}</Text>
    <View className="flex-row flex-wrap px-sm">{children}</View>
  </View>
);

export default function Settings() {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <View className="flex-row items-center gap-x-3 pl-[14px]">
          <Text className="text-headline-1 font-subtitle">Settings</Text>
        </View>
      ),
      headerShown: true,
      title: '',
      headerStyle: { backgroundColor: 'transparent' },
    });
  }, [navigation]);

  return (
    <View className="flex-1 bg-background-main">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <Section title="Rail Allocation">
          <SettingButton icon={<Ionicons name="pie-chart-outline" size={24} color="#121212" />} label={'Base/Active\nSplit'} />
          <SettingButton icon={<MaterialCommunityIcons name="train" size={24} color="#121212" />} label="Conductors" />
          <SettingButton icon={<Ionicons name="flash-outline" size={24} color="#121212" />} label={'Auto\nInvest'} />
        </Section>

        <Section title="Spend">
          <SettingButton icon={<Ionicons name="card-outline" size={24} color="#121212" />} label={'Card\nSettings'} />
          <SettingButton icon={<Ionicons name="arrow-up-circle-outline" size={24} color="#121212" />} label="Round-ups" />
          <SettingButton icon={<Ionicons name="cash-outline" size={24} color="#121212" />} label="Cashback" />
          <SettingButton icon={<Ionicons name="swap-horizontal-outline" size={24} color="#121212" />} label="Limits" />
        </Section>

        <Section title="Security">
          <SettingButton icon={<Ionicons name="finger-print-outline" size={24} color="#121212" />} label="Biometrics" />
          <SettingButton icon={<Ionicons name="lock-closed-outline" size={24} color="#121212" />} label="PIN" />
          <SettingButton icon={<Ionicons name="shield-checkmark-outline" size={24} color="#121212" />} label={'2-Factor\nAuth'} />
        </Section>

        <Section title="More">
          <SettingButton icon={<Ionicons name="notifications-outline" size={24} color="#121212" />} label="Notifications" />
          <SettingButton icon={<Ionicons name="gift-outline" size={24} color="#121212" />} label="Referrals" />
          <SettingButton icon={<Ionicons name="document-text-outline" size={24} color="#121212" />} label="Legal" />
          <SettingButton icon={<Ionicons name="help-circle-outline" size={24} color="#121212" />} label="Support" />
        </Section>

        <Section title="Account">
          <SettingButton icon={<Ionicons name="log-out-outline" size={24} color="#F44336" />} label="Logout" danger />
          <SettingButton icon={<Ionicons name="trash-outline" size={24} color="#F44336" />} label={'Delete\nAccount'} danger />
        </Section>
      </ScrollView>
    </View>
  );
}
