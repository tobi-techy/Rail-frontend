import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, Pressable, Text, Keyboard, Image } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, FadeIn } from 'react-native-reanimated';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Mic01Icon, Image01Icon, ArrowUp01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { useAIHaptics } from '@/hooks/useAIHaptics';

const ACCENT = '#FF2E01';

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
  const { onSend: hapticSend } = useAIHaptics();
  const hasContent = text.trim().length > 0 || !!attachedImage;

  const sendStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const handleSend = () => {
    if ((!text.trim() && !attachedImage) || isStreaming) return;
    hapticSend();
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
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        marginHorizontal: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}>
      {/* Image preview */}
      {attachedImage && (
        <Animated.View entering={FadeIn.duration(150)} style={{ paddingTop: 8, paddingBottom: 4, paddingHorizontal: 4 }}>
          <View style={{ position: 'relative', alignSelf: 'flex-start' }}>
            <Image
              source={{ uri: attachedImage.uri }}
              style={{ width: 80, height: 80, borderRadius: 12 }}
              resizeMode="cover"
            />
            <Pressable
              onPress={onClearImage}
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: '#1A1A1A',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <HugeiconsIcon icon={Cancel01Icon} size={12} color="#FFFFFF" />
            </Pressable>
          </View>
        </Animated.View>
      )}

      <TextInput
        ref={inputRef}
        value={text}
        onChangeText={setText}
        placeholder={attachedImage ? 'Add a message...' : (placeholder ?? 'Ask Miriam anything...')}
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {showAttachments && onImagePress && (
            <Pressable onPress={onImagePress} disabled={isStreaming} hitSlop={8}
              style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
              <HugeiconsIcon icon={Image01Icon} size={20} color={isStreaming ? '#D4D4D4' : '#8C8C8C'} />
            </Pressable>
          )}
          {showAttachments && onMicPress && (
            <Pressable onPress={onMicPress} disabled={isStreaming} hitSlop={8}
              style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
              <HugeiconsIcon icon={Mic01Icon} size={20} color={isStreaming ? '#D4D4D4' : '#8C8C8C'} />
            </Pressable>
          )}
          {text.length > 3500 && (
            <Text style={{ fontFamily: 'SFMono-Medium', fontSize: 11, color: text.length > 3900 ? '#DC2626' : '#8C8C8C' }}>
              {text.length}/4000
            </Text>
          )}
        </View>

        <Animated.View style={sendStyle}>
          <Pressable
            onPress={handleSend}
            onPressIn={() => { sendScale.value = withSpring(0.88, { damping: 15 }); }}
            onPressOut={() => { sendScale.value = withSpring(1, { damping: 15 }); }}
            disabled={!hasContent || isStreaming}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: hasContent ? ACCENT : '#E8E8E6',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <HugeiconsIcon icon={ArrowUp01Icon} size={18} color={hasContent ? '#FFF' : '#B5B5B5'} />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}
