import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, Pressable, Text, Keyboard, Image } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import {
  Mic01Icon,
  Image01Icon,
  ArrowUp01Icon,
  Cancel01Icon,
  Add01Icon,
  InformationCircleIcon,
  Message01Icon,
  IconComponent as HugeiconsIcon,
} from '@/lib/icons';

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
  agentMode?: boolean;
  onAgentPress?: () => void;
  onAgentClose?: () => void;
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
  agentMode = false,
  onAgentPress,
  onAgentClose,
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
      className={`mx-4 overflow-hidden border border-black/[0.05] bg-parchment-card ${
        agentMode ? 'rounded-[28px]' : 'rounded-[24px]'
      }`}>
      {agentMode && (
        <>
          <View className="flex-row items-center justify-between px-5 py-4">
            <View className="flex-row items-center gap-2">
              <HugeiconsIcon icon={Message01Icon} size={18} color="#343433" />
              <Text className="font-body-medium text-[14px] text-[#343433]">Agent</Text>
              <HugeiconsIcon icon={InformationCircleIcon} size={19} color="#8C8C8C" />
            </View>
            <Pressable
              onPress={onAgentClose}
              hitSlop={10}
              className="h-10 w-10 items-center justify-center rounded-full"
              accessibilityRole="button"
              accessibilityLabel="Close agent mode">
              <HugeiconsIcon icon={Cancel01Icon} size={22} color="#8C8C8C" />
            </Pressable>
          </View>
          <View className="h-px bg-black/[0.06]" />
        </>
      )}

      {attachedImage && (
        <Animated.View entering={FadeIn.duration(150)} className="px-4 pt-3">
          <View className="relative self-start">
            <Image
              source={{ uri: attachedImage.uri }}
              className="h-20 w-20 rounded-lg"
              resizeMode="cover"
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

      {agentMode ? (
        <View className="flex-row items-center gap-3 px-4 py-4">
          {onMicPress && (
            <Pressable
              onPress={onMicPress}
              disabled={isStreaming}
              className="h-11 w-11 items-center justify-center rounded-full border border-[#343433]"
              accessibilityRole="button"
              accessibilityLabel="Voice input">
              <HugeiconsIcon
                icon={Mic01Icon}
                size={25}
                color={isStreaming ? '#B5B5B5' : '#343433'}
              />
            </Pressable>
          )}
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            placeholder={attachedImage ? 'Add a message...' : 'Enter your task...'}
            placeholderTextColor="#848281"
            multiline
            maxLength={4000}
            autoFocus={autoFocus}
            returnKeyType="default"
            blurOnSubmit={false}
            enablesReturnKeyAutomatically
            className="max-h-[120px] flex-1 font-body text-[16px] leading-[24px] text-[#343433]"
          />
          <Animated.View style={sendStyle}>
            <Pressable
              onPress={hasContent ? handleSend : onImagePress}
              onPressIn={() => {
                sendScale.value = withSpring(0.88, { damping: 15 });
              }}
              onPressOut={() => {
                sendScale.value = withSpring(1, { damping: 15 });
              }}
              disabled={isStreaming || (!hasContent && !onImagePress)}
              className="h-11 w-11 items-center justify-center rounded-full border border-[#343433]"
              accessibilityRole="button"
              accessibilityLabel={hasContent ? 'Send message' : 'Add attachment'}>
              <HugeiconsIcon
                icon={hasContent ? ArrowUp01Icon : Add01Icon}
                size={hasContent ? 20 : 24}
                color={isStreaming ? '#B5B5B5' : '#343433'}
              />
            </Pressable>
          </Animated.View>
        </View>
      ) : (
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder={attachedImage ? 'Add a message...' : (placeholder ?? 'Ask anything...')}
          placeholderTextColor="#B5B5B5"
          multiline
          maxLength={4000}
          autoFocus={autoFocus}
          returnKeyType="default"
          blurOnSubmit={false}
          enablesReturnKeyAutomatically
          className="max-h-[120px] px-5 pb-2 pt-4 font-body text-[17px] leading-[26px] text-[#343433]"
        />
      )}

      {!agentMode && (
        <View className="flex-row items-center justify-between px-3 pb-3">
          <View className="flex-row items-center gap-0.5">
            {showAttachments && onImagePress && (
              <Pressable
                onPress={onImagePress}
                disabled={isStreaming}
                hitSlop={8}
                className="h-10 w-10 items-center justify-center rounded-full"
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
                className="h-10 w-10 items-center justify-center rounded-full"
                accessibilityRole="button"
                accessibilityLabel="Voice input">
                <HugeiconsIcon
                  icon={Mic01Icon}
                  size={22}
                  color={isStreaming ? '#D4D4D4' : '#8C8C8C'}
                />
              </Pressable>
            )}
            {onAgentPress && (
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  onAgentPress();
                }}
                disabled={isStreaming}
                className="ml-1 h-10 flex-row items-center gap-1.5 rounded-full border border-black/[0.06] px-3"
                accessibilityRole="button"
                accessibilityLabel="Open agent mode">
                <HugeiconsIcon
                  icon={Message01Icon}
                  size={18}
                  color={isStreaming ? '#D4D4D4' : '#343433'}
                />
                <Text className="font-body-medium text-[14px] text-[#343433]">Agent</Text>
              </Pressable>
            )}
            {text.length > 3500 && (
              <Text
                className={`ml-1 font-mono-medium text-[12px] ${text.length > 3900 ? 'text-coral-red' : 'text-text-secondary'}`}>
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
              className="h-[42px] w-[42px] items-center justify-center rounded-full"
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
      )}
    </View>
  );
}
