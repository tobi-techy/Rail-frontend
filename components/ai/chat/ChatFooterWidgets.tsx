import React, { useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Cancel01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import { useAIChatStore } from '@/stores/aiChatStore';
import { useHaptics } from '@/hooks/useHaptics';
import { ChatBubble, TypingBubble } from '@/components/ai';
import type { AgentAction } from './constants';
import { AGENT_ACTIONS } from './constants';

// ─── Suggestion Chips ────────────────────────────────────────────

export const SuggestionChips = React.memo(function SuggestionChips({
  suggestions,
  onPress,
}: {
  suggestions: string[];
  onPress: (s: string) => void;
}) {
  if (!suggestions.length) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 6,
        gap: 8,
        alignItems: 'center',
      }}>
      {suggestions.slice(0, 5).map((s, i) => (
        <Pressable
          key={i}
          onPress={() => onPress(s)}
          className="rounded-full border border-black/[0.08] bg-white px-4 py-2 active:bg-black/[0.03]">
          <Text className="font-body text-[13px] text-charcoal-primary" numberOfLines={1}>
            {s}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
});

// ─── Agent Action Rail ───────────────────────────────────────────

export const AgentActionRail = React.memo(function AgentActionRail({
  onPick,
  disabled,
}: {
  onPick: (a: AgentAction) => void;
  disabled?: boolean;
}) {
  const { impact } = useHaptics();
  const handlePress = useCallback(
    (action: AgentAction) => {
      if (disabled) return;
      impact();
      onPick(action);
    },
    [disabled, impact, onPick]
  );

  return (
    <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-2"
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {AGENT_ACTIONS.map((card) => (
          <Pressable
            key={card.label}
            onPress={() => handlePress(card)}
            disabled={disabled}
            className="flex-row items-center gap-1.5 rounded-full border border-black/[0.08] bg-stone-surface px-3.5 py-2.5"
            style={{ opacity: disabled ? 0.5 : 1 }}
            accessibilityRole="button"
            accessibilityLabel={card.label}>
            <HugeiconsIcon icon={card.icon} size={16} color="#343433" />
            <Text className="font-body-medium text-[13px] text-charcoal-primary">{card.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </Animated.View>
  );
});

// ─── Active Agent Badge ──────────────────────────────────────────

export const ActiveAgentBadge = React.memo(function ActiveAgentBadge({
  action,
  onClear,
}: {
  action: AgentAction;
  onClear: () => void;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      className="mx-4 mb-2 flex-row items-center gap-2 rounded-full bg-stone-surface px-3.5 py-2">
      <HugeiconsIcon icon={action.icon} size={15} color="#343433" />
      <Text className="flex-1 font-body-medium text-[13px] text-charcoal-primary">
        {action.label}
      </Text>
      <Pressable onPress={onClear} hitSlop={8}>
        <HugeiconsIcon icon={Cancel01Icon} size={14} color="#94918d" />
      </Pressable>
    </Animated.View>
  );
});

// ─── Streaming Footer (subscribes to store directly for perf) ────

export const StreamingFooter = React.memo(function StreamingFooter() {
  const streamedContent = useAIChatStore((s) => s.streamedContent);
  if (streamedContent) {
    return (
      <ChatBubble
        msg={{ role: 'assistant', content: streamedContent }}
        isLatest
        animate={false}
        showTail
      />
    );
  }
  return (
    <View className="mt-3">
      <TypingBubble />
    </View>
  );
});

// ─── Polling Footer ──────────────────────────────────────────────

export const PollingFooter = React.memo(function PollingFooter() {
  const phase = useAIChatStore((s) => s.streamingPhase);
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      className="mb-6 py-2">
      <View className="flex-row items-center gap-2">
        <Text className="font-body-medium text-[15px] text-charcoal-primary">
          <Text style={{ color: '#343433' }}>W</Text>
          {'orking...'}
        </Text>
      </View>
      {phase ? (
        <Animated.View entering={FadeIn.duration(200)} className="mt-2">
          <Text className="font-body text-[13px] text-graphite">{phase}</Text>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
});

// ─── Retry Banner ────────────────────────────────────────────────

export const RetryBanner = React.memo(function RetryBanner({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="mt-3 flex-row items-center justify-center gap-2 py-3">
      <Text className="font-body text-[15px] text-ash">Failed to send.</Text>
      <Text className="font-body-medium text-[15px] text-spearmint">Retry</Text>
    </Pressable>
  );
});

// ─── Ceiling Banner ──────────────────────────────────────────────

export const CeilingBanner = React.memo(function CeilingBanner() {
  return (
    <View className="mt-3 rounded-[22px] bg-sunburst-yellow/10 p-4">
      <Text className="text-center font-body text-[14px] text-amber-700">
        Monthly AI limit reached. Miriam resets next month.
      </Text>
    </View>
  );
});
