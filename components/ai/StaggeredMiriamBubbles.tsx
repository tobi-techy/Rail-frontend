import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { CHAT_BG } from './ChatBubble';
import { bubbleEnter } from '@/lib/motion';
import { MarkdownContent } from './MarkdownContent';
import { TypingBubble } from './TypingBubble';
import { useHaptics } from '@/hooks/useHaptics';
import * as Haptics from '@/utils/platformHaptics';

// Timing constants — fast delivery, just enough stagger to feel sequential.
const INITIAL_PAUSE_MS = 120; // brief pause before first bubble
const READING_MS_PER_WORD = 35; // snappy inter-bubble pacing
const MIN_INTER_BUBBLE_MS = 180; // floor between consecutive bubbles
const MAX_INTER_BUBBLE_MS = 500; // ceiling so long paragraphs don't stall

const MIRIAM_BUBBLE = '#E9E9EB';

function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.min(MAX_INTER_BUBBLE_MS, Math.max(MIN_INTER_BUBBLE_MS, words * READING_MS_PER_WORD));
}

// Single left bubble with optional tail — rises + scales + fades in on mount.
function BubbleIn({ children, tail }: { children: React.ReactNode; tail: boolean }) {
  return (
    <Animated.View entering={bubbleEnter()}>
      <View style={{ position: 'relative' }}>
        {tail ? (
          <>
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                bottom: -1,
                left: -6,
                width: 20,
                height: 17,
                backgroundColor: MIRIAM_BUBBLE,
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
        ) : null}
        <View
          style={{
            backgroundColor: MIRIAM_BUBBLE,
            borderRadius: 20,
            paddingHorizontal: 15,
            paddingVertical: 9,
          }}>
          {children}
        </View>
      </View>
    </Animated.View>
  );
}

interface Props {
  segments: string[];
  /** tail on the final text bubble (only when no attachments follow) */
  showTextTail: boolean;
  onLongPress?: () => void;
  measureRef?: React.RefObject<View>;
  /** fired once every segment has been revealed */
  onAllVisible?: () => void;
}

/**
 * Renders Miriam's reply as staggered consecutive text bubbles — a typing
 * indicator appears between each, simulating real iMessage typing. Text only;
 * attachments (memes, polls, cards) are rendered by ChatBubble once this
 * reports completion via onAllVisible.
 */
export const StaggeredMiriamBubbles = React.memo(function StaggeredMiriamBubbles({
  segments,
  showTextTail,
  onLongPress,
  measureRef,
  onAllVisible,
}: Props) {
  const haptics = useHaptics();
  const [visibleCount, setVisibleCount] = useState(0);
  const [showTyping, setShowTyping] = useState(true);
  const onAllVisibleRef = useRef(onAllVisible);
  onAllVisibleRef.current = onAllVisible;

  useEffect(() => {
    if (segments.length === 0) {
      setShowTyping(false);
      setVisibleCount(0);
      onAllVisibleRef.current?.();
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    let cumDelay = 0;

    setShowTyping(true);
    setVisibleCount(0);

    for (let i = 0; i < segments.length; i++) {
      cumDelay += i === 0 ? INITIAL_PAUSE_MS : readingTime(segments[i - 1]);
      const capturedI = i;
      const capturedDelay = cumDelay;

      timers.push(
        setTimeout(() => {
          setVisibleCount(capturedI + 1);
          if (capturedI < segments.length - 1) {
            setShowTyping(false);
            timers.push(setTimeout(() => setShowTyping(true), 80));
          } else {
            setShowTyping(false);
            onAllVisibleRef.current?.();
          }
        }, capturedDelay)
      );
    }

    return () => timers.forEach(clearTimeout);
  }, [segments]);

  return (
    <View ref={measureRef} collapsable={false} className="w-full items-start gap-1.5">
      {segments.slice(0, visibleCount).map((seg, i) => {
        const isLastSeg = i === segments.length - 1;
        return (
          <Pressable
            key={`seg-${i}`}
            onLongPress={() => {
              haptics.impact(Haptics.ImpactFeedbackStyle.Medium);
              onLongPress?.();
            }}
            delayLongPress={300}
            className="max-w-[88%]"
            accessibilityRole="text">
            <BubbleIn tail={showTextTail && isLastSeg && i < visibleCount}>
              <MarkdownContent content={seg} variant="bubble" />
            </BubbleIn>
          </Pressable>
        );
      })}

      {showTyping && visibleCount < segments.length ? <TypingBubble /> : null}
    </View>
  );
});
