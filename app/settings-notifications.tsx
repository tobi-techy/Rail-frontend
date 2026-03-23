import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUIStore } from '@/stores';
import { ArrowLeft01Icon, BellDotIcon, Mail01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

function NotificationRow({
  icon,
  title,
  subtitle,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View className="bg-surface-secondary mb-3 flex-row items-center rounded-2xl border border-surface px-4 py-4">
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-surface">
        {icon}
      </View>
      <View className="flex-1 pr-3">
        <Text className="font-subtitle text-body text-text-primary">{title}</Text>
        <Text className="mt-0.5 font-caption text-caption text-text-secondary">{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

export default function SettingsNotificationsScreen() {
  const pushNotificationsEnabled = useUIStore((s) => s.pushNotificationsEnabled);
  const setPushNotificationsEnabled = useUIStore((s) => s.setPushNotificationsEnabled);
  const emailNotificationsEnabled = useUIStore((s) => s.emailNotificationsEnabled);
  const setEmailNotificationsEnabled = useUIStore((s) => s.setEmailNotificationsEnabled);

  return (
    <SafeAreaView className="flex-1 bg-background-main">
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-surface"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#070914" />
        </TouchableOpacity>
        <Text className="font-subtitle text-headline-1">Notifications</Text>
      </View>

      <View className="px-4">
        <Text className="mb-4 mt-1 font-body text-body text-text-secondary">
          Choose how you want to receive updates from Rail.
        </Text>

        <NotificationRow
          icon={<HugeiconsIcon icon={BellDotIcon} size={18} color="#111827" />}
          title="Push Notifications"
          subtitle="Alerts for account activity and transaction updates."
          value={pushNotificationsEnabled}
          onChange={setPushNotificationsEnabled}
        />
        <NotificationRow
          icon={<HugeiconsIcon icon={Mail01Icon} size={18} color="#111827" />}
          title="Email Notifications"
          subtitle="Product and account updates sent to your inbox."
          value={emailNotificationsEnabled}
          onChange={setEmailNotificationsEnabled}
        />
      </View>
    </SafeAreaView>
  );
}
