import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState, useMemo } from 'react';
import Avatar from '@zamplyy/react-native-nice-avatar';
import { getAvatarConfig } from '@/utils/avatarConfig';

import { Input, Button } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useUpdateProfile } from '@/api/hooks/useUser';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

export default function ProfileEdit() {
  const insets = useSafeAreaInsets();
  const { showError, showSuccess } = useFeedbackPopup();

  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');

  const avatarName = useMemo(
    () => [firstName, lastName].filter(Boolean).join(' ') || user?.email || 'Rail User',
    [firstName, lastName, user?.email]
  );

  const avatarConfig = useMemo(() => getAvatarConfig(avatarName), [avatarName]);

  const isDirty =
    firstName.trim() !== (user?.firstName ?? '') || lastName.trim() !== (user?.lastName ?? '');

  const handleSave = async () => {
    if (!isDirty || isPending) return;
    try {
      const updated = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      updateUser({ firstName: updated.firstName, lastName: updated.lastName });
      showSuccess('Profile updated', 'Your name has been saved.');
      router.back();
    } catch (e: any) {
      showError('Update failed', e?.message ?? 'Please try again.');
    }
  };

  return (
    <View className="flex-1 bg-background-main" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-md py-3">
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="h-9 w-9 items-center justify-center rounded-full bg-surface">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#121212" strokeWidth={2} />
        </Pressable>
        <Text className="font-subtitle text-body text-text-primary">Edit Profile</Text>
        <View className="w-9" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled">
        {/* Avatar section */}
        <View className="items-center py-8">
          <Avatar size={88} {...avatarConfig} />
          <Text className="mt-4 font-subtitle text-[20px] text-text-primary">
            {[firstName, lastName].filter(Boolean).join(' ') || 'Rail User'}
          </Text>
          <Text className="mt-1 font-caption text-caption text-text-secondary">{user?.email}</Text>
        </View>

        {/* Divider */}
        <View className="mx-md mb-6 h-px bg-surface" />

        {/* Fields */}
        <View className="gap-4 px-md">
          <Input
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter first name"
            autoCapitalize="words"
            returnKeyType="next"
          />
          <Input
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter last name"
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />

          {/* Email — read only */}
          <View>
            <Text className="mb-1.5 font-caption text-caption text-text-secondary">Email</Text>
            <View className="rounded-xl border border-surface bg-surface px-4 py-4">
              <Text className="font-body text-body text-text-secondary">{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Save */}
        <View className="mt-8 px-md">
          <Button
            title={isPending ? '' : 'Save Changes'}
            variant="black"
            onPress={handleSave}
            disabled={!isDirty || isPending}>
            {isPending && <ActivityIndicator color="#fff" size="small" />}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}
