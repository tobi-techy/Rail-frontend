import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable, FlatList, Platform, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, useKeyboardHandler } from 'react-native-keyboard-controller';
import Animated, { FadeIn, FadeOut, useSharedValue, runOnJS } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft01Icon,
  Menu01Icon,
  Add01Icon,
  BarChartIcon,
  Camera01Icon,
  Calendar03Icon,
  Image01Icon,
  FlashIcon,
  Invoice02Icon,
  Target01Icon,
  Wallet01Icon,
  IconComponent as HugeiconsIcon,
  type PhosphorIcon,
} from '@/lib/icons';
import { useAIChatStore } from '@/stores/aiChatStore';
import { ChatBubble, InputBar, MiriamCharacter } from '@/components/ai';
import { ActionConfirmSheet } from '@/components/ai/ActionConfirmSheet';
import { ActionSheet } from '@/components/sheets/ActionSheet';
import type { AIMessage, PendingAction, InsightCard, ToneMode } from '@/api/types/ai';
import { useSubscription } from '@/api/hooks/useGameplay';
import { useHaptics } from '@/hooks/useHaptics';
import { ANALYTICS_EVENTS, useAnalytics } from '@/utils/analytics';
import { lastScannedReceipt, clearScannedReceipt } from '@/app/receipt-scanner';

const BG = '#fbfaf9';

type AgentAction = {
  label: string;
  subtitle: string;
  icon: PhosphorIcon;
  prompt: string;
  toneMode?: ToneMode;
};

const AGENT_ACTIONS: AgentAction[] = [
  {
    label: 'Audit',
    subtitle: 'Hard look at leaks',
    icon: BarChartIcon,
    prompt: 'Audit me',
    toneMode: 'hard',
  },
  {
    label: 'Plan',
    subtitle: 'This month setup',
    icon: Wallet01Icon,
    prompt: 'Build my Miriam operating plan for this month',
  },
  {
    label: 'Obligations',
    subtitle: 'Bills and recurring',
    icon: Invoice02Icon,
    prompt: 'Help me add my financial obligations',
  },
  {
    label: 'Automate',
    subtitle: 'Approval-gated rules',
    icon: FlashIcon,
    prompt: 'Help me set up an automation',
  },
  {
    label: 'Forecast',
    subtitle: 'End-of-month view',
    icon: Calendar03Icon,
    prompt: 'Forecast my end-of-month balance',
  },
  {
    label: 'Goals',
    subtitle: 'Pick the next target',
    icon: Target01Icon,
    prompt: 'Help me build a savings plan',
  },
];

function inferToneModeFromPrompt(prompt: string): ToneMode | undefined {
  const normalized = prompt.toLowerCase();
  if (
    normalized.includes('audit') ||
    normalized.includes('hard mode') ||
    normalized.includes('roast') ||
    normalized.includes('no sugar') ||
    normalized.includes('reality check')
  ) {
    return 'hard';
  }
  return undefined;
}

// ─── Keyboard state hook ─────────────────────────────────────────

function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  const height = useSharedValue(0);

  useKeyboardHandler({
    onMove: (e) => {
      'worklet';
      height.value = e.height;
    },
    onEnd: (e) => {
      'worklet';
      runOnJS(setVisible)(e.height > 0);
    },
  });

  return visible;
}

// ─── Typing Dots ─────────────────────────────────────────────────

function TypingDots() {
  const phase = useAIChatStore((s) => s.streamingPhase);
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      className="mb-6 flex-row items-center gap-3">
      <MiriamCharacter size={28} emotion="thinking" isProcessing />
      <Text className="font-body text-[14px] text-ash">{phase || 'Thinking...'}</Text>
    </Animated.View>
  );
}

// ─── Retry Banner ────────────────────────────────────────────────

function RetryBanner({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="mt-3 flex-row items-center justify-center gap-2 py-3">
      <Text className="font-body text-[15px] text-ash">Failed to send.</Text>
      <Text className="font-body-medium text-[15px] text-spearmint">Retry</Text>
    </Pressable>
  );
}

// ─── Suggestion Chips ────────────────────────────────────────────

function SuggestionChips({
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
      className="h-[48px]"
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 6,
        gap: 8,
        alignItems: 'center',
      }}>
      {suggestions.slice(0, 6).map((s, i) => (
        <Pressable
          key={i}
          onPress={() => onPress(s)}
          className="rounded-full border border-fog/40 bg-parchment-card px-4 py-2">
          <Text className="font-body text-[14px] text-ash" numberOfLines={1}>
            {s}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ─── Agent Action Rail ───────────────────────────────────────────

function AgentActionRail({
  onPick,
  disabled,
}: {
  onPick: (action: AgentAction) => void;
  disabled?: boolean;
}) {
  const { impact } = useHaptics();

  const handlePress = (action: AgentAction) => {
    if (disabled) return;
    impact();
    onPick(action);
  };

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
            className="flex-row items-center gap-1.5 rounded-full border border-fog/40 bg-parchment-card px-3.5 py-2.5"
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
}

// ─── Empty State (Miriam centered) ───────────────────────────────

function EmptyChatState({
  onSend,
  suggestions,
  hideForTyping,
  agentMode,
}: {
  onSend: (msg: string) => void;
  suggestions: string[];
  hideForTyping: boolean;
  agentMode: boolean;
}) {
  if (hideForTyping) return <View className="flex-1" />;

  const topSuggestions = [
    'Audit my money in hard mode',
    'Audit me',
    'Build my monthly plan',
    'Find my biggest spending leak',
    ...suggestions,
  ];
  const seen = new Set<string>();
  const cleanSuggestions = topSuggestions.filter((suggestion) => {
    const key = suggestion.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <View className="flex-1 px-6 pt-10">
      <View className="flex-1 justify-center">
        <MiriamCharacter size={agentMode ? 56 : 88} emotion="happy" animate />
        <Text className="mt-6 font-body-medium text-[20px] leading-[28px] text-charcoal-primary">
          {agentMode
            ? 'Agent mode is ready. Give Miriam a task: audit spending, build a plan, organize obligations, or set money rules.'
            : "Hey, I'm Miriam. I can audit your spending, plan the month, or catch the leaks."}
        </Text>
        {!agentMode && (
          <View className="mt-6 gap-3">
            {cleanSuggestions.slice(0, 3).map((suggestion) => (
              <Pressable
                key={suggestion}
                onPress={() => onSend(suggestion)}
                className="self-start rounded-2xl border border-fog/40 px-4 py-3"
                accessibilityRole="button"
                accessibilityLabel={suggestion}>
                <Text className="font-body text-[16px] text-charcoal-primary" numberOfLines={1}>
                  {suggestion}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────

export default function AIChatScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<FlatList>(null);
  const router = useRouter();
  const navigation = useNavigation();
  const { preloaded_message } = useLocalSearchParams<{ preloaded_message?: string }>();
  const [agentMode, setAgentMode] = useState(false);
  const isKeyboardVisible = useKeyboardVisible();
  const { track } = useAnalytics();
  const { data: subData } = useSubscription();
  const isPro = __DEV__ || (subData?.is_pro ?? false);

  const {
    activeConversationId,
    messages,
    isStreaming,
    streamedContent,
    cards,
    suggestions,
    pendingAction,
    overCeiling,
    lastError,
    sendMessage,
    sendImage,
    setTonePreference,
    retryLastMessage,
    createConversation,
    clearActiveConversation,
    clearPendingAction,
    close,
  } = useAIChatStore();
  const messageCount = messages.length;

  const smartSuggestions = useMemo(() => {
    const defaults = [
      'Audit me',
      "What's my financial health?",
      'Forecast my end-of-month balance',
      'Show my spending breakdown',
      'Help me build a savings plan',
    ];
    const merged = [...defaults, ...(suggestions ?? [])];
    const seen = new Set<string>();
    return merged.filter((s) => {
      const key = s.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [suggestions]);

  const prevCountRef = useRef(0);
  useEffect(() => {
    if (messageCount > prevCountRef.current) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
    prevCountRef.current = messageCount;
  }, [messageCount]);

  const [editText, setEditText] = useState('');
  const [attachedImage, setAttachedImage] = useState<{ uri: string; base64: string } | null>(null);
  const [showImageSheet, setShowImageSheet] = useState(false);

  // Pick up scanned receipt when returning from scanner
  useEffect(() => {
    if (lastScannedReceipt) {
      setAttachedImage(lastScannedReceipt);
      clearScannedReceipt();
    }
  });

  const handleSend = useCallback(
    async (
      msg: string,
      image?: { uri: string; base64: string },
      source: 'prompt' | 'agent_mode' | 'preloaded' = 'prompt'
    ) => {
      const trimmed = msg.trim();
      if (!trimmed && !image) return;
      setAgentMode(false);
      const toneMode = trimmed ? inferToneModeFromPrompt(trimmed) : undefined;
      if (toneMode) {
        setTonePreference(toneMode);
      }
      if (toneMode === 'hard') {
        track(ANALYTICS_EVENTS.FINANCIAL_AUDIT_REQUESTED, {
          source,
          tone_mode: toneMode,
        });
      }

      if (image) {
        setAttachedImage(null);
        await sendImage(
          image.base64,
          trimmed || 'Analyze this receipt and extract the transaction details.'
        );
        return;
      }

      let convId = activeConversationId;
      if (!convId) {
        try {
          convId = await createConversation(trimmed.slice(0, 50));
        } catch {
          await sendMessage(trimmed, undefined, { toneMode });
          setEditText('');
          return;
        }
      }

      await sendMessage(trimmed, convId, { toneMode });
      setEditText('');
    },
    [activeConversationId, createConversation, sendMessage, sendImage, setTonePreference, track]
  );

  const handleAgentPick = useCallback(
    (action: AgentAction) => {
      if (action.toneMode) {
        setTonePreference(action.toneMode);
      }
      handleSend(action.prompt, undefined, 'agent_mode');
    },
    [handleSend, setTonePreference]
  );

  // Auto-send preloaded message from notification deep-link
  const preloadHandled = useRef(false);
  const handleSendRef = useRef(handleSend);
  handleSendRef.current = handleSend;
  useEffect(() => {
    if (preloaded_message && !preloadHandled.current && !isStreaming) {
      preloadHandled.current = true;
      handleSendRef.current(preloaded_message, undefined, 'preloaded');
    }
  }, [preloaded_message, isStreaming]);

  const handleActionConfirmed = useCallback(
    (action: PendingAction) => {
      clearPendingAction();
      const confirmMsg: AIMessage = {
        role: 'assistant',
        content: `Done — ${action.description}`,
        created_at: new Date().toISOString(),
      };
      useAIChatStore.setState((s) => ({ messages: [...s.messages, confirmMsg] }));
    },
    [clearPendingAction]
  );

  const handleActionCancelled = useCallback(() => {
    clearPendingAction();
    const cancelMsg: AIMessage = {
      role: 'assistant',
      content: 'No worries — action cancelled.',
      created_at: new Date().toISOString(),
    };
    useAIChatStore.setState((s) => ({ messages: [...s.messages, cancelMsg] }));
  }, [clearPendingAction]);

  const handleBack = useCallback(() => {
    if (agentMode) {
      setAgentMode(false);
    } else if (activeConversationId) {
      clearActiveConversation();
    } else {
      close();
      router.back();
    }
  }, [agentMode, activeConversationId, clearActiveConversation, close, router]);

  const handleNewThread = useCallback(() => {
    clearActiveConversation();
    setAgentMode(false);
  }, [clearActiveConversation]);

  const handleMicPress = useCallback(() => {
    router.push('/voice-mode');
  }, [router]);

  const handleImagePress = useCallback(() => {
    setShowImageSheet(true);
  }, []);

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to scan receipts.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      setAttachedImage({ uri: result.assets[0].uri, base64: result.assets[0].base64 });
    }
  };

  const pickFromCamera = () => {
    router.push('/receipt-scanner' as any);
  };

  const handleClearImage = useCallback(() => setAttachedImage(null), []);
  const handleAgentPress = useCallback(() => setAgentMode(true), []);
  const handleAgentClose = useCallback(() => setAgentMode(false), []);
  const handleCloseImageSheet = useCallback(() => setShowImageSheet(false), []);

  const hasFailedMessage =
    lastError && messages.length > 0 && messages[messages.length - 1].role === 'assistant';

  const renderMessage = useCallback(
    ({ item, index }: { item: AIMessage; index: number }) => {
      const isLast = index === messageCount - 1;
      let showCards: InsightCard[] | undefined;
      if (isLast && item.role === 'assistant') {
        showCards = cards;
      } else if (item.role === 'assistant' && item.metadata?.cards) {
        showCards = item.metadata.cards as InsightCard[];
      }
      return (
        <ChatBubble
          msg={item}
          cards={showCards}
          isLatest={isLast}
          animate={false}
          onEdit={(content) => setEditText(content)}
        />
      );
    },
    [messageCount, cards]
  );

  const isEmpty = !activeConversationId && (messages ?? []).length === 0;

  return (
    <View className="flex-1" style={{ backgroundColor: BG }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}>
        {/* ── Header ── */}
        <View
          className="flex-row items-center justify-between px-5 pb-3"
          style={{ paddingTop: insets.top + 8, backgroundColor: BG }}>
          <Pressable
            onPress={handleBack}
            hitSlop={12}
            className="h-10 w-10 items-center justify-center rounded-full">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#343433" />
          </Pressable>
          <View className="flex-row items-center gap-1">
            <Text className="font-body-medium text-[19px] text-charcoal-primary">Miriam</Text>
            <Text className="font-body text-[17px] text-ash">
              {agentMode ? 'Agent >' : 'Instant >'}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Pressable
              onPress={() => (navigation as any).openDrawer()}
              hitSlop={12}
              className="h-10 w-10 items-center justify-center rounded-full">
              <HugeiconsIcon icon={Menu01Icon} size={22} color="#343433" />
            </Pressable>
            <Pressable
              onPress={handleNewThread}
              hitSlop={12}
              className="h-10 w-10 items-center justify-center rounded-full">
              <HugeiconsIcon icon={Add01Icon} size={22} color="#343433" />
            </Pressable>
          </View>
        </View>

        {/* ── Content ── */}
        {isEmpty ? (
          <EmptyChatState
            onSend={handleSend}
            suggestions={smartSuggestions}
            hideForTyping={isKeyboardVisible}
            agentMode={agentMode}
          />
        ) : (
          <FlatList
            ref={scrollRef}
            data={messages ?? []}
            keyExtractor={(item, i) => item.id || `${item.role}-${i}-${item.created_at || i}`}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 }}
            renderItem={renderMessage}
            ListFooterComponent={
              <>
                {isStreaming && streamedContent ? (
                  <ChatBubble
                    msg={{ role: 'assistant', content: streamedContent }}
                    isLatest
                    animate={false}
                  />
                ) : isStreaming ? (
                  <TypingDots />
                ) : null}
                {hasFailedMessage && <RetryBanner onPress={retryLastMessage} />}
                {overCeiling && (
                  <View className="mt-3 rounded-2xl bg-sunburst-yellow/10 p-4">
                    <Text className="text-center font-body text-[14px] text-amber-700">
                      Monthly AI limit reached. Miriam resets next month.
                    </Text>
                  </View>
                )}
              </>
            }
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* ── Input ── */}
        <View className="pb-2" style={{ paddingBottom: insets.bottom + 4 }}>
          {agentMode && !isKeyboardVisible && (
            <AgentActionRail onPick={handleAgentPick} disabled={isStreaming} />
          )}
          {!isEmpty && !agentMode && !isKeyboardVisible && (
            <SuggestionChips suggestions={smartSuggestions} onPress={handleSend} />
          )}
          <InputBar
            onSend={handleSend}
            onMicPress={handleMicPress}
            onImagePress={handleImagePress}
            isStreaming={isStreaming}
            placeholder={isEmpty ? 'Ask anything...' : 'Ask a follow up...'}
            initialValue={editText}
            attachedImage={attachedImage}
            onClearImage={handleClearImage}
            agentMode={agentMode}
            onAgentPress={handleAgentPress}
            onAgentClose={handleAgentClose}
          />
        </View>
      </KeyboardAvoidingView>

      <ActionConfirmSheet
        key={pendingAction?.id}
        action={pendingAction}
        visible={!!pendingAction}
        onClose={clearPendingAction}
        onConfirmed={handleActionConfirmed}
        onCancelled={handleActionCancelled}
      />

      <ActionSheet
        visible={showImageSheet}
        onClose={handleCloseImageSheet}
        icon={Camera01Icon}
        title="Add Receipt"
        subtitle="Scan or upload a receipt for Miriam to analyze"
        actions={[
          {
            id: 'scan',
            label: 'Scan Receipt',
            sublabel: 'Take a photo with your camera',
            icon: Camera01Icon,
            iconColor: '#ff3e00',
            iconBgColor: '#FFF0ED',
            onPress: pickFromCamera,
          },
          {
            id: 'upload',
            label: 'Upload from Gallery',
            sublabel: 'Choose an existing photo',
            icon: Image01Icon,
            iconColor: '#2196F3',
            iconBgColor: '#E3F2FD',
            onPress: pickFromGallery,
          },
        ]}
      />
    </View>
  );
}
