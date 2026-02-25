import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Plus, Trash2, KeyRound } from 'lucide-react-native';
import { BottomSheet } from '@/components/sheets';
import { Button } from '@/components/ui';
import { usePasskeys, useRegisterPasskey, useDeletePasskey } from '@/api/hooks';
import type { PasskeyCredential } from '@/api/types';
import { useHaptics } from '@/hooks/useHaptics';

const formatDate = (iso: string | null) => {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

function PasskeyRow({
  credential,
  onDelete,
  onPressDelete,
}: {
  credential: PasskeyCredential;
  onDelete: (id: string, name: string) => void;
  onPressDelete: () => void;
}) {
  return (
    <View className="bg-surface-secondary mb-3 flex-row items-center rounded-2xl border border-surface p-4">
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-surface">
        <KeyRound size={18} color="#6B7280" />
      </View>
      <View className="flex-1">
        <Text className="font-subtitle text-body text-text-primary" numberOfLines={1}>
          {credential.name || 'Passkey'}
        </Text>
        <Text className="mt-0.5 font-caption text-caption text-text-secondary">
          Last used {formatDate(credential.lastUsedAt)}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => {
          onPressDelete();
          onDelete(credential.id, credential.name || 'Passkey');
        }}
        className="ml-2 h-9 w-9 items-center justify-center rounded-full bg-red-50"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Trash2 size={16} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
}

export default function PasskeySettingsScreen() {
  const [showRegisterSheet, setShowRegisterSheet] = useState(false);
  const [passkeyName, setPasskeyName] = useState('');
  const { impact, notification } = useHaptics();

  const { data, isLoading, isError } = usePasskeys();
  const credentials = data ?? [];
  const { mutateAsync: registerPasskey, isPending: isRegistering } = useRegisterPasskey();
  const { mutateAsync: deletePasskey, isPending: isDeleting } = useDeletePasskey();

  const getRegistrationErrorMessage = (err: any) => {
    const code = String(err?.code || err?.error || '').toUpperCase();
    const message = String(err?.message || '').toLowerCase();
    const codeSuffix = code ? ` (code: ${code})` : '';

    if (code === 'NOCREDENTIALS' || message.includes('no credentials')) {
      return `iOS did not return a passkey credential. Make sure iCloud Keychain is enabled, then reinstall the app and try again.${codeSuffix}`;
    }

    if (code === 'WEBAUTHN_UNAVAILABLE' || code === 'WEBAUTHN_SESSION_UNAVAILABLE') {
      return `Passkey service is unavailable on server. Check backend WebAuthn/Redis configuration.${codeSuffix}`;
    }

    if (code === 'INVALID_SESSION') {
      return `Passkey session expired. Please try registration again.${codeSuffix}`;
    }

    return `${err?.message || 'Could not register passkey. Try again.'}${codeSuffix}`;
  };

  const handleRegister = async () => {
    try {
      await registerPasskey(passkeyName.trim() || undefined);
      setShowRegisterSheet(false);
      setPasskeyName('');
      notification();
    } catch (err: any) {
      // User cancelled — no alert needed
      if (err?.name === 'NotAllowedError' || err?.message?.includes('cancel')) return;
      Alert.alert('Registration Failed', getRegistrationErrorMessage(err));
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Remove Passkey', `Remove "${name}"? You won't be able to use it to sign in.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePasskey(id);
            notification();
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to remove passkey.');
          }
        },
      },
    ]);
  };

  const openRegisterSheet = () => {
    setPasskeyName('');
    setShowRegisterSheet(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-background-main">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-surface"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeft size={20} color="#070914" />
        </TouchableOpacity>
        <Text className="flex-1 font-subtitle text-headline-1">Passkeys</Text>
        <TouchableOpacity
          onPress={openRegisterSheet}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Plus size={20} color="#070914" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Description */}
        <Text className="mb-6 mt-2 font-body text-base leading-6 text-text-secondary">
          Passkeys let you sign in with Face ID or Touch ID — no password needed. Add one for each
          device you use.
        </Text>

        {/* Loading */}
        {isLoading && (
          <View className="items-center py-12">
            <ActivityIndicator color="#6B7280" />
          </View>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <View className="bg-surface-secondary items-center rounded-2xl border border-surface py-10">
            <Text className="font-body text-base text-text-secondary">
              Failed to load passkeys.
            </Text>
          </View>
        )}

        {/* Empty state */}
        {!isLoading && !isError && credentials.length === 0 && (
          <View className="bg-surface-secondary items-center rounded-2xl border border-dashed border-neutral-300 py-12">
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-surface">
              <KeyRound size={24} color="#9CA3AF" />
            </View>
            <Text className="mb-1 font-subtitle text-base text-text-primary">No passkeys yet</Text>
            <Text className="mb-6 font-body text-sm text-text-secondary">
              Add a passkey to sign in faster
            </Text>
            <Button title="Add Passkey" variant="black" onPress={openRegisterSheet} />
          </View>
        )}

        {/* Credential list */}
        {credentials.map((cred) => (
          <PasskeyRow
            key={cred.id}
            credential={cred}
            onDelete={handleDelete}
            onPressDelete={() => impact()}
          />
        ))}

        {/* Add button when list is non-empty */}
        {credentials.length > 0 && (
          <Button
            title="Add Another Passkey"
            variant="ghost"
            onPress={openRegisterSheet}
            disabled={isRegistering || isDeleting}
          />
        )}
      </ScrollView>

      {/* Register sheet */}
      <BottomSheet visible={showRegisterSheet} onClose={() => setShowRegisterSheet(false)}>
        <Text className="mb-2 font-subtitle text-xl">Add Passkey</Text>
        <Text className="mb-6 font-body text-base leading-6 text-neutral-500">
          Give this passkey a name so you can identify it later (e.g. &quot;iPhone 15&quot;).
        </Text>

        <View className="bg-surface-secondary mb-6 rounded-xl border border-surface px-4 py-3">
          <TextInput
            value={passkeyName}
            onChangeText={setPasskeyName}
            placeholder="Passkey name (optional)"
            placeholderTextColor="#9CA3AF"
            className="font-body text-base text-text-primary"
            maxLength={40}
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />
        </View>

        <View className="flex-row gap-3">
          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => setShowRegisterSheet(false)}
            disabled={isRegistering}
            flex
          />
          <Button
            title={isRegistering ? '' : 'Continue'}
            variant="black"
            onPress={handleRegister}
            disabled={isRegistering}
            flex>
            {isRegistering && <ActivityIndicator color="#fff" />}
          </Button>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
