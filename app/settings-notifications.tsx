import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUIStore } from '@/stores';
import { ArrowLeft01Icon, BellDotIcon, Mail01Icon } from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';
import { useHaptics } from '@/hooks/useHaptics';
import { SettingsSection, ListItem } from '@/components/molecules';

export default function SettingsNotificationsScreen() {
  const { impact } = useHaptics();
  const pushNotificationsEnabled = useUIStore((s) => s.pushNotificationsEnabled);
  const setPushNotificationsEnabled = useUIStore((s) => s.setPushNotificationsEnabled);
  const emailNotificationsEnabled = useUIStore((s) => s.emailNotificationsEnabled);
  const setEmailNotificationsEnabled = useUIStore((s) => s.setEmailNotificationsEnabled);

  return (
    <SafeAreaView className="flex-1 bg-background-main">
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity
          onPress={() => {
            router.back();
          }}
          className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-surface"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#343433" />
        </TouchableOpacity>
        <Text className="font-subtitle text-headline-1" maxFontSizeMultiplier={1.3}>
          Notifications
        </Text>
      </View>

      <View className="px-4">
        <Text
          className="mb-4 mt-1 font-body text-body text-text-secondary"
          maxFontSizeMultiplier={1.4}>
          Choose how you want to receive updates from Rail.
        </Text>

        <SettingsSection title="Channels">
          <ListItem
            icon={BellDotIcon}
            iconTile
            label="Push Notifications"
            subtitle="Alerts for account activity and transaction updates."
            toggle
            toggleValue={pushNotificationsEnabled}
            onToggle={setPushNotificationsEnabled}
          />
          <ListItem
            icon={Mail01Icon}
            iconTile
            label="Email Notifications"
            subtitle="Product and account updates sent to your inbox."
            toggle
            toggleValue={emailNotificationsEnabled}
            onToggle={setEmailNotificationsEnabled}
            showDivider={false}
          />
        </SettingsSection>
      </View>
    </SafeAreaView>
  );
}
