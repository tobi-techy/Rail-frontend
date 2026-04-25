import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, Pressable, Text, Keyboard, Image } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Mic01Icon,
  Image01Icon,
  ArrowUp01Icon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons';

const ACCENT = '#1A7A6D';

interface AttachedImage {
  uri: string;
  base64: string;
}

interface Props {
  onSend: (msg: string, image?: AttachedImage) => void;
  onMicPress?: () => void;
  onImagePress?: () => void;
  isStreaming: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  initialValue?: string;
  showAttachments?: boolean;
  attachedImage?: AttachedImage | null;
  onClearImage?: () => void;
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
  attachedImage,
  onClearImage,
}: Props) {
  const [text, setText] = useState(initialValue ?? '');
  const inputRef = useRef<TextInput>(null);
  const sendScale = useSharedValue(1);
  const hasContent = text.trim().length > 0 || !!attachedImage;

  const sendStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const handleSend = () => {
    if ((!text.trim() && !attachedImage) || isStreaming) return;
    onSend(text.trim(), attachedImage ?? undefined);
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
      className="mx-4 rounded-[24px] bg-white border border-black/[0.05]"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}>
      {attachedImage && (
        <Animated.View entering={FadeIn.duration(150)} className="px-4 pt-3">
          <View className="relative self-start">
            <Image
              source={{ uri: attachedImage.uri }}
              className="w-20 h-20 rounded-xl"
              resizeMode="cover"
            />
            <Pressable
              onPress={onClearImage}
              className="absolute -top-1.5 -right-1.5 w-[22px] h-[22px] rounded-full bg-[#1A1A1A] items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Remove image">
              <HugeiconsIcon icon={Cancel01Icon} size={12} color="#FFFFFF" />
            </Pressable>
          </View>
        </Animated.View>
      )}

      <TextInput
        ref={inputRef}
        value={text}
        onChangeText={setText}
        placeholder={
          attachedImage ? 'Add a message...' : (placeholder ?? 'Ask anything...')
        }
        placeholderTextColor="#B5B5B5"
        multiline
        maxLength={4000}
        autoFocus={autoFocus}
        returnKeyType="default"
        blurOnSubmit={false}
        enablesReturnKeyAutomatically
        className="font-body text-[17px] text-[#1A1A1A] max-h-[120px] px-5 pt-4 pb-2 leading-[26px]"
      />

      <View className="flex-row items-center justify-between px-3 pb-3">
        <View className="flex-row items-center gap-0.5">
          {showAttachments && onImagePress && (
            <Pressable
              onPress={onImagePress}
              disabled={isStreaming}
              hitSlop={8}
              className="w-10 h-10 rounded-full items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Attach image">
              <HugeiconsIcon
                icon={Image01Icon}
                size={22}
                color={isStreaming ? '#D4D4D4' : '#8C8C8C'}
              />
            </Pressable>
          )}
          {showAttachments && onMicPress && (
            <Pressable
              onPress={onMicPress}
              disabled={isStreaming}
              hitSlop={8}
              className="w-10 h-10 rounded-full items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Voice input">
              <HugeiconsIcon
                icon={Mic01Icon}
                size={22}
                color={isStreaming ? '#D4D4D4' : '#8C8C8C'}
              />
            </Pressable>
          )}
          {text.length > 3500 && (
            <Text
              className={`font-mono-medium text-[12px] ml-1 ${text.length > 3900 ? 'text-red-600' : 'text-text-secondary'}`}>
              {text.length}/4000
            </Text>
          )}
        </View>

        <Animated.View style={sendStyle}>
          <Pressable
            onPress={handleSend}
            onPressIn={() => {
              sendScale.value = withSpring(0.88, { damping: 15 });
            }}
            onPressOut={() => {
              sendScale.value = withSpring(1, { damping: 15 });
            }}
            disabled={!hasContent || isStreaming}
            className="w-[42px] h-[42px] rounded-full items-center justify-center"
            style={{ backgroundColor: hasContent ? ACCENT : '#E8E8E6' }}
            accessibilityRole="button"
            accessibilityLabel="Send message">
            <HugeiconsIcon
              icon={ArrowUp01Icon}
              size={20}
              color={hasContent ? '#FFF' : '#B5B5B5'}
            />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}
