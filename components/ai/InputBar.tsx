import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, Pressable, Text, Keyboard } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Mic01Icon, Image01Icon, ArrowUp01Icon } from '@hugeicons/core-free-icons';
import { useAIHaptics } from '@/hooks/useAIHaptics';

const ACCENT = '#FF2E01';

interface Props {
  onSend: (msg: string) => void;
  onMicPress?: () => void;
  onImagePress?: () => void;
  isStreaming: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  initialValue?: string;
  showAttachments?: boolean;
}

export function InputBar({
  onSend,
  onMicPress,
  onImagePress,
  isStreaming,
  placeholder,
  autoFocus,
  initialValue,
  showAttachments = true,
}: Props) {
  const [text, setText] = useState(initialValue ?? '');
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
  };

  useEffect(() => {
    if (initialValue) {
      setText(initialValue);
      inputRef.current?.focus();
    }
  }, [initialValue]);

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
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}>
      <TextInput
        ref={inputRef}
        value={text}
        onChangeText={setText}
        placeholder={placeholder ?? 'Ask Miriam anything...'}
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
          paddingHorizontal: 4,
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2, paddingBottom: 4 }}>
        {/* Left: attachment buttons */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {showAttachments && onImagePress && (
            <Pressable
              onPress={onImagePress}
              disabled={isStreaming}
              hitSlop={8}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <HugeiconsIcon icon={Image01Icon} size={20} color={isStreaming ? '#D4D4D4' : '#8C8C8C'} />
            </Pressable>
          )}
          {showAttachments && onMicPress && (
            <Pressable
              onPress={onMicPress}
              disabled={isStreaming}
              hitSlop={8}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <HugeiconsIcon icon={Mic01Icon} size={20} color={isStreaming ? '#D4D4D4' : '#8C8C8C'} />
            </Pressable>
          )}
          {text.length > 3500 && (
            <Text style={{ fontFamily: 'SFMono-Medium', fontSize: 11, color: text.length > 3900 ? '#DC2626' : '#8C8C8C' }}>
              {text.length}/4000
            </Text>
          )}
        </View>

        {/* Right: send button */}
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
            <HugeiconsIcon icon={ArrowUp01Icon} size={18} color={hasText ? '#FFF' : '#B5B5B5'} />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}
