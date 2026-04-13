import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StatusBar, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '@/components/ui';
import { AuthGradient, StaggeredChild } from '@/components';
import { useSetRailTag, useCheckRailTag } from '@/api/hooks';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { railTagSchema } from '@/utils/schemas';

export default function CreateRailTagScreen() {
  const [tag, setTag] = useState('');
  const [availability, setAvailability] = useState<'idle' | 'checking' | 'available' | 'taken'>(
    'idle'
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { mutate: setRailTag, isPending } = useSetRailTag();
  const { mutate: checkRailTag } = useCheckRailTag();
  const { showError } = useFeedbackPopup();

  const handleChange = (value: string) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
    setTag(normalized);
    setAvailability('idle');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (normalized.length < 3) return;

    setAvailability('checking');
    debounceRef.current = setTimeout(() => {
      checkRailTag(normalized, {
        onSuccess: (res: { available: boolean }) =>
          setAvailability(res.available ? 'available' : 'taken'),
        onError: () => setAvailability('idle'),
      });
    }, 500);
  };

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  const handleSubmit = () => {
    if (!railTagSchema.safeParse(tag).success) return;
    setRailTag(tag, {
      onSuccess: () => router.replace('/kyc?autoLaunch=true'),
      onError: (err: any) =>
        showError('Could not set RailTag', err?.message || 'Please try again.'),
    });
  };

  const statusColor =
    availability === 'available' ? '#00C853' : availability === 'taken' ? '#FF2E01' : 'transparent';

  const statusText =
    availability === 'available'
      ? '@' + tag + ' is available'
      : availability === 'taken'
        ? '@' + tag + ' is already taken'
        : availability === 'checking'
          ? 'Checking...'
          : '';

  const canSubmit = tag.length >= 3 && availability === 'available' && !isPending;

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent={Platform.OS === 'android'}
        />
        <View className="flex-1 px-6 pt-4">
          <StaggeredChild index={0}>
            <View className="mb-8 mt-4">
              <Text className="font-display text-[32px] leading-[36px] text-black">
                Create your RailTag
              </Text>
              <Text className="mt-2 font-body text-[14px] text-black/60">
                Your unique handle for sending and receiving money
              </Text>
            </View>
          </StaggeredChild>

          <StaggeredChild index={1}>
            <Text className="mb-2 font-subtitle text-[14px] text-black">RailTag</Text>
            <View className="flex-row items-center rounded-xl border border-black/10 bg-white/80 px-4 py-3.5">
              <Text className="font-body text-[16px] text-black/40">@</Text>
              <TextInput
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="yourname"
                placeholderTextColor="rgba(0,0,0,0.25)"
                value={tag}
                onChangeText={handleChange}
                className="flex-1 font-body text-[16px] text-black"
                maxLength={30}
              />
            </View>
            <Text
              className="mt-2 font-body text-[13px]"
              style={{ color: statusColor, minHeight: 18 }}>
              {statusText}
            </Text>
            <Text className="mt-1 font-body text-[12px] text-black/40">
              Lowercase letters and numbers only · 3–30 characters
            </Text>
          </StaggeredChild>

          <StaggeredChild index={2} delay={80} style={{ marginTop: 'auto' }}>
            <View className="pb-4">
              <Button
                title="Continue"
                onPress={handleSubmit}
                loading={isPending}
                disabled={!canSubmit}
                variant="orange"
              />
            </View>
          </StaggeredChild>
        </View>
      </SafeAreaView>
    </AuthGradient>
  );
}
