import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator, Alert, type LayoutRectangle } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from '@/utils/platformHaptics';
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import type { AIMessage, InsightCard, ActionChip } from '@/api/types/ai';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { Copy01Icon, Delete02Icon, RefreshIcon, File01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';

import { MarkdownContent } from './MarkdownContent';
import { TypingText } from './TypingText';
import { InsightCardView } from './InsightCardView';
import { MiriamCharacter } from './MiriamCharacter';
import { MessageContextMenu } from './MessageContextMenu';
import { useAIChatStore } from '@/stores/aiChatStore';

// ── Perplexity-style polling indicator ───────────────────────────
function StatementPollingIndicator() {
  const phase = useAIChatStore((s) => s.streamingPhase);

  return (
    <View className="flex-1 py-1">
      <View className="flex-row items-center gap-2">
        <MiriamCharacter size={18} emotion="thinking" isProcessing animate />
        <Text className="font-body-medium text-[15px] text-[#1C1C1E]">
          <Text style={{ color: '#00C853' }}>W</Text>
          {'orking...'}
        </Text>
      </View>
      {phase ? (
        <Animated.View entering={FadeIn.duration(200)} className="mt-2 pl-7">
          <Text className="font-body text-[13px] text-[#8C8C8C]">{phase}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

interface Props {
  msg: AIMessage;
  cards?: InsightCard[];
  actionChips?: ActionChip[];
  isLatest?: boolean;
  animate?: boolean;
  onDeleteMessage?: () => void;
  onRetry?: () => void;
  onEdit?: (content: string) => void;
  onActionChip?: (chip: ActionChip) => void;
}

export const ChatBubble = React.memo(function ChatBubble({ msg, cards, actionChips, animate, onEdit, onRetry, onActionChip, onDeleteMessage }: Props) {
  const isUser = msg.role === 'user';
  const content = msg.content ?? '';
  const imageUrl = msg.image_url ?? msg.metadata?.image_url;
  const { showSuccess } = useFeedbackPopup();

  const [typingDone, setTypingDone] = useState(!animate);
  const [menuVisible, setMenuVisible] = useState(false);
  const [anchor, setAnchor] = useState<LayoutRectangle | null>(null);
  const bubbleRef = useRef<View>(null);   // for animation
  const measureRef = useRef<View>(null);  // for measureInWindow — plain View, accurate on Android
  const mountedRef = useRef(true);
  const isFirstRender = useRef(true);
  const statementStatus = msg.metadata?.statement_status as string | undefined;

  // Reset typing state when animate changes, but skip the initial mount
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setTypingDone(!animate);
  }, [animate]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const scale = useSharedValue(1);
  const bubbleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const triggerLongPress = useCallback(() => {
    if (!content) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    measureRef.current?.measureInWindow((x, y, width, height) => {
      if (!mountedRef.current) return;
      setAnchor({ x, y, width, height });
      scale.value = withSpring(1.03, { damping: 18, stiffness: 300 });
      setTimeout(() => { scale.value = withSpring(1, { damping: 18, stiffness: 300 }); }, 120);
      setMenuVisible(true);
    });
  }, [content]);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(content);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showSuccess('Copied', undefined, { duration: 1400 });
  }, [content, showSuccess]);
  const handleEdit = useCallback(() => { onEdit?.(content); }, [content, onEdit]);
  const handleRetry = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRetry?.();
  }, [onRetry]);
  const handleDelete = useCallback(() => {
    if (!onDeleteMessage) return;
    Alert.alert(
      'Delete message?',
      'This removes the message from this conversation.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onDeleteMessage();
          },
        },
      ]
    );
  }, [onDeleteMessage]);
  const handleCloseMenu = useCallback(() => setMenuVisible(false), []);
  const handleTypingDone = useCallback(() => setTypingDone(true), []);

  if (isUser) {
    const docName = msg.metadata?.document_name as string | undefined;

    return (
      <>
        <Animated.View entering={FadeIn.duration(150)} className="mb-5 max-w-[88%] self-end">
          <Animated.View style={bubbleStyle}>
            <View ref={measureRef} collapsable={false}>
            <Pressable
              ref={bubbleRef}
              onLongPress={triggerLongPress}
              delayLongPress={380}
              accessibilityRole="text"
              accessibilityLabel={`Your message: ${content.slice(0, 100)}`}>
              {imageUrl ? (
                <ImageWithLoader uri={imageUrl} />
              ) : msg.metadata?.hasImage ? (
                <View className="mb-1.5 h-52 w-52 items-center justify-center overflow-hidden rounded-2xl bg-[#1c1c1e]">
                  <ActivityIndicator size="small" color="#ffffff" />
                </View>
              ) : null}

              {/* File name displayed prominently like Perplexity */}
              {docName ? (
                <View className="rounded-3xl bg-[#EDEDEB] px-5 py-4">
                  <Text className="font-body-medium text-[16px] leading-[24px] text-[#343433]">
                    {docName}
                  </Text>
                  {content && content !== docName ? (
                    <Text className="mt-1 font-body text-[15px] leading-[22px] text-[#6B6B6B]">
                      {content}
                    </Text>
                  ) : null}
                </View>
              ) : (
                <View className="rounded-3xl bg-[#EDEDEB] px-5 py-3.5">
                  <Text className="font-body text-[18px] leading-[30px] text-[#343433]">
                    {content.replace(/^Image:\s*/i, '')}
                  </Text>
                </View>
              )}
            </Pressable>
            </View>
          </Animated.View>

          {/* File chip below message — like Perplexity */}
          {docName && (
            <Animated.View entering={FadeIn.delay(100).duration(150)} className="mt-2 self-end">
              <View className="flex-row items-center rounded-full border border-black/[0.08] bg-white px-3 py-1.5">
                <HugeiconsIcon icon={File01Icon} size={14} color="#6B6B6B" />
                <Text className="ml-1.5 max-w-[180px] font-body text-[12px] text-[#6B6B6B]" numberOfLines={1}>
                  {docName}
                </Text>
              </View>
            </Animated.View>
          )}
        </Animated.View>
        <MessageContextMenu
          visible={menuVisible} onClose={handleCloseMenu}
          onCopy={handleCopy} onEdit={onEdit ? handleEdit : undefined}
          onRetry={onRetry ? handleRetry : undefined}
          onDelete={onDeleteMessage ? handleDelete : undefined} anchor={anchor} isUser
        />
      </>
    );
  }

  const topCards = cards?.filter((c) => c.type === 'stat_grid' || c.type === 'highlight');
  const bottomCards = cards?.filter((c) => c.type !== 'stat_grid' && c.type !== 'highlight');
  const isStatementMsg = !!statementStatus;
  const statementEmotion: 'processing' | 'completed' | 'failed' =
    statementStatus === 'completed' ? 'completed' : statementStatus === 'failed' ? 'failed' : 'processing';

  const isTyping = animate && !typingDone;

  return (
    <>
      <Animated.View className="mb-6 w-full self-start">
        {!isTyping && topCards?.map((card, i) => (
          <View key={`top-${i}`} className="mb-2"><InsightCardView card={card} /></View>
        ))}

        <View className="flex-row items-start gap-3">
          {isStatementMsg && statementEmotion === 'processing' && !content ? (
            /* Perplexity-style "Working..." state — shown during polling */
            <StatementPollingIndicator />
          ) : (
            <Animated.View ref={bubbleRef} style={bubbleStyle} className="flex-1 py-1"
              accessibilityRole="text"
              accessibilityLabel={`Miriam: ${content.slice(0, 100)}`}>
              <View ref={measureRef} collapsable={false}>
              {isTyping ? (
                <TypingText text={content} speed={14} onComplete={handleTypingDone}>
                  {(displayed) => <MarkdownContent content={displayed} />}
                </TypingText>
              ) : (
                <MarkdownContent content={content} selectable />
              )}
              </View>
            </Animated.View>
          )}
        </View>

        {!isTyping && bottomCards?.map((card, i) => (
          <View key={`btm-${i}`} className="mt-3"><InsightCardView card={card} /></View>
        ))}

        {!isTyping && actionChips && actionChips.length > 0 && (
          <View className="mt-4 flex-row flex-wrap gap-2">
            {actionChips.map((chip) => (
              <Pressable
                key={chip.id}
                onPress={() => onActionChip?.(chip)}
                className="rounded-full border border-ember-orange/30 bg-ember-orange/5 px-4 py-2">
                <Text className="font-body-medium text-[13px] text-ember-orange">{chip.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {/* Quick actions — Regenerate, Delete */}
        {!isTyping && content ? (
          <View className="mt-1.5 flex-row items-center gap-1">
            {onRetry && (
              <Pressable
                onPress={handleRetry}
                hitSlop={8}
                className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1.5 active:bg-black/[0.05]"
                accessibilityRole="button"
                accessibilityLabel="Regenerate response">
                <HugeiconsIcon icon={RefreshIcon} size={15} color="#94918d" weight="regular" />
              </Pressable>
            )}
            {onDeleteMessage && (
              <Pressable
                onPress={handleDelete}
                hitSlop={8}
                className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1.5 active:bg-black/[0.05]"
                accessibilityRole="button"
                accessibilityLabel="Delete message">
                <HugeiconsIcon icon={Delete02Icon} size={15} color="#94918d" weight="regular" />
              </Pressable>
            )}
          </View>
        ) : null}
      </Animated.View>
    </>
  );
});

function ImageWithLoader({ uri }: { uri: string }) {
  const [loading, setLoading] = useState(true);
  return (
    <View className="mb-1.5 h-52 w-52 overflow-hidden rounded-2xl bg-[#1c1c1e]">
      {loading && (
        <View className="absolute inset-0 z-10 items-center justify-center">
          <ActivityIndicator size="small" color="#ffffff" />
        </View>
      )}
      <Image source={{ uri }} className="h-full w-full" resizeMode="cover" onLoad={() => setLoading(false)} />
    </View>
  );
}
