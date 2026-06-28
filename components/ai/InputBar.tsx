import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, TextInput, Pressable, Text, Keyboard, Image, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  cancelAnimation,
} from 'react-native-reanimated';
import {
  Mic01Icon,
  ArrowUp01Icon,
  Cancel01Icon,
  Add01Icon,
  File01Icon,
  PhoneIcon,
  IconComponent as HugeiconsIcon,
} from '@/lib/icons';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useRouter } from 'expo-router';
import * as Haptics from '@/utils/platformHaptics';

const ACCENT = '#E8503A';
const LISTENING_COLOR = '#FF5733';

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
  onAgentModeToggle?: () => void;
  agentMode?: boolean;
}

// ── Perplexity-style document chip: spinner → PDF icon ──────────────
function DocumentAttachmentChip({ name, onClear }: { name: string; onClear?: () => void }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 600);
    return () => clearTimeout(t);
  }, []);

  const truncated = name.length > 16 ? name.slice(0, 13) + '...' + name.slice(-4) : name;
  const ext = name.split('.').pop()?.toLowerCase() ?? '';

  return (
    <View className="relative self-start">
      {/* Floating X at top-right corner */}
      {onClear && (
        <Pressable
          onPress={onClear}
          hitSlop={8}
          className="absolute -right-2 -top-2 z-10 h-[22px] w-[22px] items-center justify-center rounded-full bg-[#6B6B6B]"
          accessibilityRole="button"
          accessibilityLabel="Remove document">
          <HugeiconsIcon icon={Cancel01Icon} size={10} color="#FFFFFF" />
        </Pressable>
      )}
      <View className="flex-row items-center rounded-2xl bg-[#EAEAE7] p-2.5 pr-5">
        {/* Thumbnail area */}
        <View className="mr-3 h-14 w-14 items-center justify-center rounded-xl bg-white">
          {ready ? (
            <View className="items-center justify-center">
              <HugeiconsIcon icon={File01Icon} size={22} color="#6B6B6B" />
              <Text className="mt-0.5 font-body-medium text-[9px] uppercase text-[#6B6B6B]">
                {ext}
              </Text>
            </View>
          ) : (
            <ActivityIndicator size="small" color="#8C8C8C" />
          )}
        </View>
        {/* Labels */}
        <View>
          <Text className="font-body-medium text-[14px] text-[#1C1C1E]" numberOfLines={1}>
            {truncated}
          </Text>
          <Text className="mt-0.5 font-body text-[12px] text-[#8C8C8C]">{ext}</Text>
        </View>
      </View>
    </View>
  );
}

export function InputBar({
  onSend,
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
  onAgentModeToggle,
  agentMode,
}: Props) {
  const [text, setText] = useState(initialValue ?? '');
  const [imageLoading, setImageLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const sendScale = useSharedValue(1);
  const router = useRouter();
  const hasContent = text.trim().length > 0 || !!attachedImage || !!attachedDocument;

  // ── Speech-to-text ──────────────────────────────────────────────
  const { isListening, startListening, stopListening } = useSpeechToText({
    onResult: (transcript) => {
      setText(transcript);
    },
  });

  // ── Animated border for listening state ─────────────────────────
  const borderProgress = useSharedValue(0);

  useEffect(() => {
    if (isListening) {
      borderProgress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(borderProgress);
      borderProgress.value = withTiming(0, { duration: 150, easing: Easing.out(Easing.ease) });
    }
  }, [isListening, borderProgress]);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderWidth: isListening ? 2 : 0,
    borderColor: `rgba(255, 87, 51, ${0.3 + borderProgress.value * 0.7})`,
  }));

  // ── Handlers ────────────────────────────────────────────────────
  useEffect(() => {
    if (attachedImage) setImageLoading(true);
  }, [attachedImage?.uri]);

  const sendStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const handleSend = () => {
    if (isStreaming) return;
    if (isListening) stopListening();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (attachedDocument && onSendDocument) {
      onSendDocument(attachedDocument.uri, text.trim());
      setText('');
      return;
    }
    if (!text.trim() && !attachedImage) return;
    onSend(text.trim(), attachedImage ?? undefined);
    setText('');
  };

  const handleMicPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

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
    <View className="mx-4 mb-1">
      {/* Attached image preview */}
      {attachedImage && !isListening && (
        <Animated.View entering={FadeIn.duration(150)} className="mb-2 pl-12">
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

      {/* Attached document — Perplexity-style: thumbnail with spinner → PDF icon */}
      {attachedDocument && !isListening && (
        <Animated.View entering={FadeIn.duration(150)} className="mb-2 pl-12">
          <DocumentAttachmentChip name={attachedDocument.name} onClear={onClearDocument} />
        </Animated.View>
      )}

      {/* iMessage-style composer row: [ + ]  [ pill: input · mic ]  [ accent ] */}
      <View className="flex-row items-end gap-2">
        {/* Plus — tap: attachments · long-press: toggle Agent mode */}
        {onPlusPress && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Keyboard.dismiss();
              onPlusPress();
            }}
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onAgentModeToggle?.();
            }}
            disabled={isStreaming}
            className="mb-0.5 h-10 w-10 items-center justify-center rounded-full border border-black/[0.08] bg-white"
            accessibilityRole="button"
            accessibilityLabel="Add attachment (long-press for Agent mode)">
            <HugeiconsIcon
              icon={Add01Icon}
              size={20}
              color={isStreaming ? '#D4D4D4' : agentMode ? ACCENT : '#1C1C1E'}
            />
          </Pressable>
        )}

        {/* Pill */}
        <Animated.View
          className="flex-1 flex-row items-end rounded-[22px] bg-[#F1F0EC] pl-4 pr-1.5"
          style={[{ minHeight: 44 }, animatedBorderStyle]}>
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            placeholder={
              isListening
                ? 'Listening...'
                : attachedDocument
                  ? 'Add context, or send as-is...'
                  : (placeholder ?? 'Message Miriam')
            }
            placeholderTextColor={isListening ? LISTENING_COLOR : '#9C9C9C'}
            multiline
            maxLength={4000}
            autoFocus={autoFocus}
            returnKeyType="default"
            blurOnSubmit={false}
            enablesReturnKeyAutomatically
            editable={!isListening}
            className="max-h-[120px] flex-1 py-2.5 pr-1 font-body text-[16px] leading-[22px] text-[#1C1C1E]"
          />

          {/* Trailing mic inside the pill — tap: dictate · long-press: live voice */}
          {isListening ? (
            <Pressable
              onPress={handleMicPress}
              className="mb-1 h-8 w-8 items-center justify-center rounded-full bg-[#1C1C1E]"
              accessibilityRole="button"
              accessibilityLabel="Stop listening">
              <View className="h-3 w-3 rounded-sm bg-white" />
            </Pressable>
          ) : !hasContent ? (
            <Pressable
              onPress={handleMicPress}
              onLongPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/voice-mode');
              }}
              hitSlop={8}
              disabled={isStreaming}
              className="mb-1 h-8 w-8 items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Dictate (long-press for live voice)">
              <HugeiconsIcon
                icon={Mic01Icon}
                size={20}
                color={isStreaming ? '#D4D4D4' : '#5F5F5F'}
              />
            </Pressable>
          ) : null}
        </Animated.View>

        {/* Accent circle — live voice when empty, send when typing */}
        {!isListening &&
          (hasContent ? (
            <Animated.View style={sendStyle}>
              <Pressable
                onPress={handleSend}
                onPressIn={() => {
                  sendScale.value = withSpring(0.88, { damping: 15 });
                }}
                onPressOut={() => {
                  sendScale.value = withSpring(1, { damping: 15 });
                }}
                disabled={isStreaming}
                className="mb-0.5 h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: ACCENT }}
                accessibilityRole="button"
                accessibilityLabel="Send message">
                <HugeiconsIcon icon={ArrowUp01Icon} size={20} color="#FFF" />
              </Pressable>
            </Animated.View>
          ) : (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/voice-mode');
              }}
              disabled={isStreaming}
              className="mb-0.5 h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: ACCENT }}
              accessibilityRole="button"
              accessibilityLabel="Talk to Miriam">
              <HugeiconsIcon icon={PhoneIcon} size={18} color="#FFFFFF" />
            </Pressable>
          ))}
      </View>
    </View>
  );
}
