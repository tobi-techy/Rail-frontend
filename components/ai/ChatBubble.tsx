import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  type LayoutRectangle,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from '@/utils/platformHaptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import { SPRING_BUBBLE, SPRING_PRESS, EASE_OUT, DUR } from '@/lib/motion';
import type { AIMessage, InsightCard, ActionChip, MemeCardData } from '@/api/types/ai';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { File01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';

import { MarkdownContent } from './MarkdownContent';
import { InsightCardView } from './InsightCardView';
import { MemeBubble } from './MemeBubble';
import { StaggeredMiriamBubbles } from './StaggeredMiriamBubbles';
import { TapbackPicker, type Tapback } from './TapbackPicker';
import { VoiceMessageBubble } from './VoiceMessageBubble';
import { PollBubble } from './PollBubble';
import { MessageContextMenu } from './MessageContextMenu';
import { useAIChatStore } from '@/stores/aiChatStore';

// ── Brand tokens ──────────────────────────────────────────────────
export const CHAT_BG = '#FBFAF9';
const MIRIAM_BUBBLE = '#E9E9EB';
const USER_GRADIENT = ['#FF6A3D', '#FF3E00'] as const;
const USER_SOLID = '#FF3E00';
const BUBBLE_RADIUS = 20;

// ── Helpers ───────────────────────────────────────────────────────

/** Split reply into consecutive short bubbles on blank lines */
export function splitIntoBubbles(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const parts = trimmed
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 1 ? parts.slice(0, 5) : [trimmed];
}

// Classic iMessage tail mask trick (two overlapping shapes)
function BubbleTail({ side, color }: { side: 'left' | 'right'; color: string }) {
  if (side === 'left') {
    return (
      <>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: -1,
            left: -6,
            width: 20,
            height: 17,
            backgroundColor: color,
            borderBottomRightRadius: 16,
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: -1,
            left: -10,
            width: 12,
            height: 19,
            backgroundColor: CHAT_BG,
            borderBottomRightRadius: 12,
          }}
        />
      </>
    );
  }
  return (
    <>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: -1,
          right: -6,
          width: 20,
          height: 17,
          backgroundColor: USER_SOLID,
          borderBottomLeftRadius: 16,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: -1,
          right: -10,
          width: 12,
          height: 19,
          backgroundColor: CHAT_BG,
          borderBottomLeftRadius: 12,
        }}
      />
    </>
  );
}

// Spring pop-in entrance like Messages bubbles. Transform via a tuned spring,
// opacity via timing (springs overshoot opacity). Reduced motion → fade only.
// User messages skip entirely (instant appearance like iMessage).
function useBubblePop(reduced: boolean, skip: boolean) {
  const scale = useSharedValue(skip || reduced ? 1 : 0.9);
  const opacity = useSharedValue(skip ? 1 : 0);
  useEffect(() => {
    if (skip) return;
    opacity.value = withTiming(1, { duration: DUR.enter, easing: EASE_OUT });
    if (!reduced) scale.value = withSpring(1, SPRING_BUBBLE);
  }, [opacity, scale, reduced, skip]);
  return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));
}

// Tapback reaction badge row shown below a bubble
function TapbackBadges({ reactions }: { reactions: Record<string, boolean> }) {
  const active = Object.keys(reactions).filter((k) => reactions[k]);
  if (!active.length) return null;
  return (
    <View className="mt-1 flex-row flex-wrap gap-1">
      {active.map((emoji) => (
        <View key={emoji} className="rounded-full border border-black/[0.07] bg-white px-2 py-0.5">
          <Text style={{ fontSize: 14 }}>{emoji}</Text>
        </View>
      ))}
    </View>
  );
}

// "Working…" indicator during statement processing
function StatementPollingIndicator() {
  const phase = useAIChatStore((s) => s.streamingPhase);
  return (
    <View className="py-1">
      <View className="flex-row items-center gap-2">
        <Text className="font-body-medium text-[15px] text-[#1C1C1E]">
          <Text style={{ color: '#00C853' }}>W</Text>
          {'orking...'}
        </Text>
      </View>
      {phase ? (
        <Animated.View entering={FadeIn.duration(200)} className="mt-2">
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
  showAvatar?: boolean;
  groupedAbove?: boolean;
  showTail?: boolean;
  onDeleteMessage?: () => void;
  onRetry?: () => void;
  onEdit?: (content: string) => void;
  onActionChip?: (chip: ActionChip) => void;
  onReact?: (emoji: Tapback) => void;
  onPickPoll?: (option: string) => void;
}

export const ChatBubble = React.memo(function ChatBubble({
  msg,
  cards,
  actionChips,
  animate = false,
  showAvatar = true,
  groupedAbove = false,
  showTail = true,
  onEdit,
  onRetry,
  onActionChip,
  onDeleteMessage,
  onReact,
  onPickPoll,
}: Props) {
  const isUser = msg.role === 'user';
  const content = msg.content ?? '';
  const imageUrl = msg.image_url ?? msg.metadata?.image_url;
  const reactions = (msg.metadata?.reactions ?? {}) as Record<string, boolean>;
  const { showSuccess } = useFeedbackPopup();

  const [menuVisible, setMenuVisible] = useState(false);
  const [tapbackVisible, setTapbackVisible] = useState(false);
  const [anchor, setAnchor] = useState<LayoutRectangle | null>(null);
  // For animated messages, attachments (memes/polls/cards) appear only after the
  // staggered text finishes revealing. Historical messages show everything at once.
  const [textRevealed, setTextRevealed] = useState(!animate);
  const measureRef = useRef<View>(null);
  const mountedRef = useRef(true);
  const statementStatus = msg.metadata?.statement_status as string | undefined;

  const reducedMotion = useReducedMotion();
  const popStyle = useBubblePop(reducedMotion, isUser);
  const pressScale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }));

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const measureAnchor = useCallback((onMeasured: (r: LayoutRectangle) => void) => {
    measureRef.current?.measureInWindow((x, y, width, height) => {
      if (mountedRef.current) onMeasured({ x, y, width, height });
    });
  }, []);

  const triggerLongPress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    measureAnchor((r) => {
      setAnchor(r);
      pressScale.value = withSpring(1.03, SPRING_PRESS);
      setTimeout(() => {
        pressScale.value = withSpring(1, SPRING_PRESS);
      }, 120);
      setTapbackVisible(true);
    });
  }, [measureAnchor, pressScale]);

  const handleShowMenu = useCallback(() => {
    setTapbackVisible(false);
    // Small delay so the tapback picker is fully gone before the menu appears
    setTimeout(() => setMenuVisible(true), 120);
  }, []);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(content);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showSuccess('Copied', undefined, { duration: 1400 });
  }, [content, showSuccess]);
  const handleEdit = useCallback(() => {
    onEdit?.(content);
  }, [content, onEdit]);
  const handleRetry = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRetry?.();
  }, [onRetry]);
  const handleDelete = useCallback(() => {
    if (!onDeleteMessage) return;
    Alert.alert('Delete message?', 'This removes the message from this conversation.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onDeleteMessage();
        },
      },
    ]);
  }, [onDeleteMessage]);

  // ─── USER ──────────────────────────────────────────────────────
  if (isUser) {
    const docName = msg.metadata?.document_name as string | undefined;
    return (
      <>
        <Animated.View
          style={popStyle}
          className={`w-full items-end ${groupedAbove ? 'mt-[2px]' : 'mt-2.5'}`}>
          <Animated.View style={pressStyle} className="max-w-[80%] items-end">
            <View ref={measureRef} collapsable={false}>
              <Pressable
                onLongPress={triggerLongPress}
                delayLongPress={300}
                accessibilityRole="text"
                accessibilityLabel={`Your message: ${content.slice(0, 100)}`}>
                {imageUrl ? <ImageWithLoader uri={imageUrl} /> : null}
                {msg.metadata?.hasImage && !imageUrl ? (
                  <View className="mb-1.5 h-52 w-52 items-center justify-center overflow-hidden rounded-[20px] bg-[#1c1c1e]">
                    <ActivityIndicator size="small" color="#ffffff" />
                  </View>
                ) : null}
                {content ? (
                  <View style={{ position: 'relative' }}>
                    {showTail && !imageUrl ? <BubbleTail side="right" color={USER_SOLID} /> : null}
                    <LinearGradient
                      colors={USER_GRADIENT}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={{
                        borderRadius: BUBBLE_RADIUS,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                      }}>
                      <Text className="font-body text-[17px] leading-[23px] text-white">
                        {content.replace(/^Image:\s*/i, '')}
                      </Text>
                    </LinearGradient>
                  </View>
                ) : null}
              </Pressable>
            </View>
            {docName ? (
              <Animated.View entering={FadeIn.delay(80).duration(150)} className="mt-1.5">
                <View className="flex-row items-center rounded-full border border-black/[0.06] bg-white px-3 py-1.5">
                  <HugeiconsIcon icon={File01Icon} size={14} color="#6B6B6B" />
                  <Text
                    className="ml-1.5 max-w-[180px] font-body text-[12px] text-[#6B6B6B]"
                    numberOfLines={1}>
                    {docName}
                  </Text>
                </View>
              </Animated.View>
            ) : null}
            <TapbackBadges reactions={reactions} />
          </Animated.View>
        </Animated.View>

        <TapbackPicker
          visible={tapbackVisible}
          anchor={anchor}
          isUser
          currentReactions={reactions}
          onSelect={(emoji) => onReact?.(emoji)}
          onClose={() => handleShowMenu()}
        />
        <MessageContextMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          onCopy={handleCopy}
          onEdit={onEdit ? handleEdit : undefined}
          onRetry={onRetry ? handleRetry : undefined}
          onDelete={onDeleteMessage ? handleDelete : undefined}
          anchor={anchor}
          isUser
        />
      </>
    );
  }

  // ─── MIRIAM ────────────────────────────────────────────────────
  const memeCards = cards?.filter((c) => c.type === 'meme') ?? [];
  const voiceCards = cards?.filter((c) => c.type === 'voice_message') ?? [];
  const pollCards = cards?.filter((c) => c.type === 'poll') ?? [];
  // 'celebration' cards drive the full-screen overlay, not an inline bubble.
  const otherCards =
    cards?.filter(
      (c) =>
        c.type !== 'meme' &&
        c.type !== 'voice_message' &&
        c.type !== 'poll' &&
        c.type !== 'celebration'
    ) ?? [];
  const segments = content ? splitIntoBubbles(content) : [];
  const isStatementMsg = !!statementStatus;
  const showWorking =
    isStatementMsg && statementStatus !== 'completed' && statementStatus !== 'failed' && !content;

  return (
    <>
      <Animated.View
        style={popStyle}
        className={`w-full self-start ${groupedAbove ? 'mt-[2px]' : 'mt-2.5'}`}>
        <View className="items-start gap-1.5">
          {(() => {
            const hasAttachments =
              memeCards.length + voiceCards.length + pollCards.length + otherCards.length > 0;
            const textTail = showTail && !hasAttachments;
            if (showWorking) return <StatementPollingIndicator />;
            if (animate && segments.length > 0) {
              // New message — staggered delivery with typing indicator between bubbles
              return (
                <StaggeredMiriamBubbles
                  segments={segments}
                  showTextTail={textTail}
                  onLongPress={triggerLongPress}
                  measureRef={measureRef as React.RefObject<View>}
                  onAllVisible={() => setTextRevealed(true)}
                />
              );
            }
            if (segments.length > 0) {
              // Historical message — all bubbles at once
              return (
                <Animated.View style={pressStyle} className="w-full items-start gap-1.5">
                  <View ref={measureRef} collapsable={false} className="w-full items-start gap-1.5">
                    {segments.map((seg, i) => {
                      const isLast = i === segments.length - 1;
                      return (
                        <Pressable
                          key={`seg-${i}`}
                          onLongPress={triggerLongPress}
                          delayLongPress={300}
                          className="max-w-[88%]"
                          accessibilityRole="text"
                          accessibilityLabel={`Miriam: ${seg.slice(0, 100)}`}>
                          <View style={{ position: 'relative' }}>
                            {textTail && isLast ? (
                              <BubbleTail side="left" color={MIRIAM_BUBBLE} />
                            ) : null}
                            <View
                              style={{
                                backgroundColor: MIRIAM_BUBBLE,
                                borderRadius: BUBBLE_RADIUS,
                                paddingHorizontal: 15,
                                paddingVertical: 9,
                              }}>
                              <MarkdownContent content={seg} variant="bubble" />
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </Animated.View>
              );
            }
            return null;
          })()}

          {textRevealed ? (
            <>
              {memeCards.map((card, i) => (
                <MemeBubble key={`meme-${i}`} data={(card.data ?? {}) as MemeCardData} />
              ))}

              {voiceCards.map((card, i) => (
                <VoiceMessageBubble
                  key={`voice-${i}`}
                  audioUrl={(card.data?.audio_url as string) ?? ''}
                  duration={card.data?.duration_seconds as number | undefined}
                  caption={card.data?.caption as string | undefined}
                />
              ))}

              {pollCards.map((card, i) => (
                <PollBubble
                  key={`poll-${i}`}
                  data={(card.data ?? {}) as { question?: string; options?: string[] }}
                  onPick={onPickPoll}
                />
              ))}

              {otherCards.map((card, i) => (
                <View key={`card-${i}`} className="w-full">
                  <InsightCardView card={card} />
                </View>
              ))}
            </>
          ) : null}

          {actionChips && actionChips.length > 0 ? (
            <View className="mt-1 flex-row flex-wrap gap-2">
              {actionChips.map((chip) => (
                <Pressable
                  key={chip.id}
                  onPress={() => onActionChip?.(chip)}
                  className="rounded-full border border-ember-orange/30 bg-ember-orange/5 px-4 py-2">
                  <Text className="font-body-medium text-[13px] text-ember-orange">
                    {chip.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <TapbackBadges reactions={reactions} />
        </View>
      </Animated.View>

      <TapbackPicker
        visible={tapbackVisible}
        anchor={anchor}
        isUser={false}
        currentReactions={reactions}
        onSelect={(emoji) => onReact?.(emoji)}
        onClose={() => {
          setTapbackVisible(false);
          handleShowMenu();
        }}
      />
      <MessageContextMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onCopy={handleCopy}
        onEdit={onEdit ? handleEdit : undefined}
        onRetry={onRetry ? handleRetry : undefined}
        onDelete={onDeleteMessage ? handleDelete : undefined}
        anchor={anchor}
        isUser={false}
      />
    </>
  );
});

function ImageWithLoader({ uri }: { uri: string }) {
  const [loading, setLoading] = useState(true);
  return (
    <View className="mb-1.5 h-52 w-52 overflow-hidden rounded-[20px] bg-[#1c1c1e]">
      {loading && (
        <View className="absolute inset-0 z-10 items-center justify-center">
          <ActivityIndicator size="small" color="#ffffff" />
        </View>
      )}
      <Image
        source={{ uri }}
        className="h-full w-full"
        resizeMode="cover"
        onLoad={() => setLoading(false)}
      />
    </View>
  );
}
