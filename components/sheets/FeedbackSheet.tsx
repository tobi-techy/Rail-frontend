import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet } from './BottomSheet';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/api/client';
import { useHaptics } from '@/hooks/useHaptics';
import { InputField } from '@/components/atoms/InputField';

const CATEGORIES = ['Bug', 'Idea', 'Question', 'Other'] as const;
type Category = (typeof CATEGORIES)[number];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function FeedbackSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { impact, notification } = useHaptics();
  const [category, setCategory] = useState<Category>('Idea');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => {
    setMessage('');
    setCategory('Idea');
    setDone(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    if (!message.trim()) return;
    impact();
    setLoading(true);
    try {
      await apiClient.post('/feedback', {
        category,
        message: message.trim(),
        userId: user?.id,
        email: user?.email,
      });
    } catch {
      // Fallback: open mailto
      const subject = encodeURIComponent(`[${category}] App Feedback`);
      const body = encodeURIComponent(message.trim());
      Linking.openURL(`mailto:support@rail.money?subject=${subject}&body=${body}`);
    } finally {
      setLoading(false);
      setDone(true);
      notification();
      setTimeout(handleClose, 1400);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={handleClose} showCloseButton>
      <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 16 }}>
        {done ? (
          <View className="items-center py-8">
            <Text className="mb-2 text-2xl">🎉</Text>
            <Text className="text-[17px] font-semibold text-black">Thanks for the feedback!</Text>
            <Text className="mt-1 text-[14px] text-black/50">We&apos;ll look into it.</Text>
          </View>
        ) : (
          <>
            <Text className="mb-1 text-[18px] font-semibold text-black">Send feedback</Text>
            <Text className="mb-5 text-[13px] text-black/50">Help us improve Rail.</Text>

            {/* Category pills */}
            <View className="mb-4 flex-row gap-x-2">
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  className={`rounded-full border px-3 py-1.5 ${
                    category === c ? 'border-black bg-black' : 'border-gray-200 bg-white'
                  }`}>
                  <Text
                    className={`text-[13px] font-medium ${
                      category === c ? 'text-white' : 'text-black/60'
                    }`}>
                    {c}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Message input */}
            <InputField
              value={message}
              onChangeText={setMessage}
              placeholder="What's on your mind?"
              multiline
              numberOfLines={4}
              inputWrapperClassName="min-h-[110px] border-gray-100 bg-gray-50"
              inputClassName="text-[15px] text-black"
            />

            {/* Submit */}
            <Pressable
              onPress={submit}
              disabled={!message.trim() || loading}
              className={`mt-4 items-center rounded-2xl py-4 ${
                message.trim() ? 'bg-black' : 'bg-gray-100'
              }`}>
              {loading ? (
                <ActivityIndicator color={message.trim() ? '#fff' : '#999'} />
              ) : (
                <Text
                  className={`text-[15px] font-semibold ${
                    message.trim() ? 'text-white' : 'text-black/30'
                  }`}>
                  Send
                </Text>
              )}
            </Pressable>
          </>
        )}
      </View>
    </BottomSheet>
  );
}
