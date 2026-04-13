import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, Pressable, Text, Keyboard } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useAIHaptics } from '@/hooks/useAIHaptics';

const ACCENT = '#FF2E01';

interface Props {
  onSend: (msg: string) => void;
  isStreaming: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export function InputBar({ onSend, isStreaming, placeholder, autoFocus }: Props) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const sendScale = useSharedValue(1);
  const { onSend: hapticSend } = useAIHaptics();
  const hasText = text.trim().length > 0;

  const sendStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    hapticSend();
    onSend(trimmed);
    setText('');
    // Keep keyboard open for follow-ups
  };

  // Dismiss keyboard on streaming start
  useEffect(() => {
    if (isStreaming) Keyboard.dismiss();
  }, [isStreaming]);

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        marginHorizontal: 16,
        paddingHorizontal: 16,
        paddingVertical: 6,
      }}>
      <TextInput
        ref={inputRef}
        value={text}
        onChangeText={setText}
        placeholder={placeholder ?? 'Ask Ada anything...'}
        placeholderTextColor="#B5B5B5"
        multiline
        maxLength={4000}
        autoFocus={autoFocus}
        returnKeyType="default"
        blurOnSubmit={false}
        enablesReturnKeyAutomatically
        style={{
          fontFamily: 'SFProDisplay-Regular',
          fontSize: 16,
          color: '#1A1A1A',
          maxHeight: 120,
          paddingVertical: 8,
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingTop: 2, paddingBottom: 4 }}>
        <Animated.View style={sendStyle}>
          <Pressable
            onPress={handleSend}
            onPressIn={() => { sendScale.value = withSpring(0.88, { damping: 15 }); }}
            onPressOut={() => { sendScale.value = withSpring(1, { damping: 15 }); }}
            disabled={!hasText || isStreaming}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: hasText ? ACCENT : '#E8E8E6',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text style={{ color: hasText ? '#FFF' : '#B5B5B5', fontSize: 18, marginTop: -1 }}>↑</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}
