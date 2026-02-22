import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { BottomSheet } from './BottomSheet';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/api/client';

const CATEGORIES = ['Bug', 'Idea', 'Question', 'Other'] as const;
type Category = (typeof CATEGORIES)[number];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function FeedbackSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(handleClose, 1400);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={handleClose} showCloseButton>
      <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 16 }}>
        {done ? (
          <View className="items-center py-8">
            <Text className="text-2xl mb-2">🎉</Text>
            <Text className="text-[17px] font-semibold text-black">Thanks for the feedback!</Text>
            <Text className="text-[14px] text-black/50 mt-1">We&apos;ll look into it.</Text>
          </View>
        ) : (
          <>
            <Text className="text-[18px] font-semibold text-black mb-1">Send feedback</Text>
            <Text className="text-[13px] text-black/50 mb-5">Help us improve Rail.</Text>

            {/* Category pills */}
            <View className="flex-row gap-x-2 mb-4">
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-full border ${
                    category === c
                      ? 'bg-black border-black'
                      : 'bg-white border-gray-200'
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
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="What's on your mind?"
              placeholderTextColor="#00000040"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="bg-gray-50 rounded-2xl p-4 text-[15px] text-black min-h-[110px] border border-gray-100"
              style={{ fontFamily: 'SF-Pro-Rounded-Regular' }}
            />

            {/* Submit */}
            <Pressable
              onPress={submit}
              disabled={!message.trim() || loading}
              className={`mt-4 rounded-2xl py-4 items-center ${
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
