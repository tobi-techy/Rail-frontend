import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AlertTriangle, ArrowLeft } from 'lucide-react-native';
import { Button } from '@/components/ui';
import { useKycStore } from '@/stores/kycStore';

const FIELD_LABELS: Record<string, string> = {
  first_name: 'Legal first name',
  last_name: 'Legal last name',
  date_of_birth: 'Date of birth',
  phone: 'Phone number',
  address_street: 'Street address',
  address_city: 'City',
  address_postal_code: 'Postal code',
  address_country: 'Address country',
};

export default function ProfileGapsScreen() {
  const missingProfileFields = useKycStore((s) => s.missingProfileFields);
  const fields = missingProfileFields.length > 0 ? missingProfileFields : ['Unknown fields'];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center px-5 py-2">
        <Pressable
          onPress={() => router.back()}
          className="size-11 items-center justify-center rounded-full bg-surface"
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <ArrowLeft size={20} color="#111827" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="mb-4 mt-2 items-center">
          <View className="mb-4 size-16 items-center justify-center rounded-full bg-amber-50">
            <AlertTriangle size={28} color="#F59E0B" />
          </View>
          <Text className="text-center font-display text-[26px] leading-8 text-gray-900">
            Complete your profile first
          </Text>
          <Text className="mt-3 text-center font-body text-[15px] leading-6 text-gray-500">
            We need a few more details before we can verify your identity.
          </Text>
        </View>

        <View className="my-6 rounded-2xl border border-gray-200 bg-white px-4 py-3">
          {fields.map((field) => (
            <Text key={field} className="py-1.5 font-subtitle text-[14px] text-gray-800">
              • {FIELD_LABELS[field] || field}
            </Text>
          ))}
        </View>

        <View className="gap-y-3 pt-6">
          <Button title="Update profile" onPress={() => router.push('/(tabs)/settings' as any)} />
          <Button title="Back to verification" variant="white" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
