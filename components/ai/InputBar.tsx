import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, Pressable, Text, Keyboard, Image, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import {
  Mic01Icon,
  ArrowUp01Icon,
  Cancel01Icon,
  Add01Icon,
  IconComponent as HugeiconsIcon,
} from '@/lib/icons';

const ACCENT = '#1A7A6D';

interface AttachedImage {
  uri: string;
  base64: string;
}

interface AttachedDocument {
  uri: string;
  name: string;
  size?: number;
}

interface Props {
  onSend: (msg: string, image?: AttachedImage) => void;
  onMicPress?: () => void;
  onPlusPress?: () => void;
  isStreaming: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  initialValue?: string;
  attachedImage?: AttachedImage | null;
  attachedDocument?: AttachedDocument | null;
  onClearImage?: () => void;
  onClearDocument?: () => void;
  onSendDocument?: (uri: string, text?: string) => void;
}

export function InputBar({
  onSend,
  onMicPress,
  onPlusPress,
  isStreaming,
  placeholder,
  autoFocus,
  initialValue,
  attachedImage,
  attachedDocument,
  onClearImage,
  onClearDocument,
  onSendDocument,
}: Props) {
  const [text, setText] = useState(initialValue ?? '');
  const [imageLoading, setImageLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const sendScale = useSharedValue(1);
  const hasContent = text.trim().length > 0 || !!attachedImage || !!attachedDocument;

  useEffect(() => {
    if (attachedImage) setImageLoading(true);
  }, [attachedImage?.uri]);

  const sendStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const handleSend = () => {
    if (isStreaming) return;
    if (attachedDocument && onSendDocument) {
      onSendDocument(attachedDocument.uri, text.trim());
      setText('');
      return;
    }
    if (!text.trim() && !attachedImage) return;
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
    <View className="mx-4 overflow-hidden rounded-[24px] border border-black/[0.08] bg-parchment-card">
      {attachedImage && (
        <Animated.View entering={FadeIn.duration(150)} className="px-4 pt-3">
          <View className="relative self-start">
            {imageLoading && (
              <View className="h-20 w-20 items-center justify-center rounded-lg bg-[#1C1C1E]">
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
            <Image
              source={{ uri: attachedImage.uri }}
              className={`h-20 w-20 rounded-lg ${imageLoading ? 'absolute opacity-0' : ''}`}
              resizeMode="cover"
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
            />
            <Pressable
              onPress={onClearImage}
              className="absolute -right-1.5 -top-1.5 h-[22px] w-[22px] items-center justify-center rounded-full bg-[#343433]"
              accessibilityRole="button"
              accessibilityLabel="Remove image">
              <HugeiconsIcon icon={Cancel01Icon} size={12} color="#FFFFFF" />
            </Pressable>
          </View>
        </Animated.View>
      )}

      {attachedDocument && (
        <Animated.View entering={FadeIn.duration(150)} className="px-4 pt-3">
          <View className="relative self-start rounded-2xl border border-black/[0.06] bg-[#F8F8F7] p-4">
            <View className="flex-row items-center">
              <View className="mr-3 h-14 w-14 items-center justify-center rounded-xl border border-black/[0.05] bg-white">
                <Text className="font-body text-[24px] text-[#8C8C8C]">📄</Text>
              </View>
              <View className="mr-8 flex-1">
                <Text
                  className="font-body-medium text-[15px] leading-[20px] text-[#343433]"
                  numberOfLines={2}>
                  {attachedDocument.name}
                </Text>
                {attachedDocument.size ? (
                  <Text className="mt-0.5 font-body text-[13px] text-[#8C8C8C]">
                    {(attachedDocument.size / 1024 / 1024).toFixed(1)} MB
                  </Text>
                ) : null}
              </View>
            </View>
            <Pressable
              onPress={onClearDocument}
              className="absolute -right-2 -top-2 h-[26px] w-[26px] items-center justify-center rounded-full bg-[#8C8C8C]"
              accessibilityRole="button"
              accessibilityLabel="Remove document">
              <HugeiconsIcon icon={Cancel01Icon} size={13} color="#FFFFFF" />
            </Pressable>
          </View>
        </Animated.View>
      )}

      <TextInput
        ref={inputRef}
        value={text}
        onChangeText={setText}
        placeholder={placeholder ?? 'Ask away. Pics work too.'}
        placeholderTextColor="#B5B5B5"
        multiline
        maxLength={4000}
        autoFocus={autoFocus}
        returnKeyType="default"
        blurOnSubmit={false}
        enablesReturnKeyAutomatically
        className="max-h-[120px] px-5 pb-2 pt-4 font-body text-[17px] leading-[26px] text-[#343433]"
      />

      <View className="flex-row items-center justify-between px-3 pb-3">
        <View className="flex-row items-center">
          {onMicPress && (
            <Pressable
              onPress={onMicPress}
              hitSlop={8}
              disabled={isStreaming}
              className="h-10 w-10 items-center justify-center rounded-full"
              accessibilityRole="button"
              accessibilityLabel="Voice input">
              <HugeiconsIcon
                icon={Mic01Icon}
                size={22}
                color={isStreaming ? '#D4D4D4' : '#343433'}
              />
            </Pressable>
          )}
        </View>

        <View className="flex-row items-center gap-2">
          {onPlusPress && (
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                onPlusPress();
              }}
              disabled={isStreaming}
              className="h-[42px] w-[42px] items-center justify-center rounded-full border border-black/[0.1]"
              accessibilityRole="button"
              accessibilityLabel="Add attachment">
              <HugeiconsIcon
                icon={Add01Icon}
                size={22}
                color={isStreaming ? '#D4D4D4' : '#343433'}
              />
            </Pressable>
          )}

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
              className="h-[42px] w-[42px] items-center justify-center rounded-full"
              style={{ backgroundColor: hasContent ? '#1C1C1E' : '#E8E8E6' }}
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
    </View>
  );
}
