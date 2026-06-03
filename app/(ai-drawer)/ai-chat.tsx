import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable, FlatList, Platform, ScrollView, Alert } from 'react-native';
import { GlassView } from '@/components/ui/GlassView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, useKeyboardHandler } from 'react-native-keyboard-controller';
import Animated, { FadeIn, FadeOut, useSharedValue, runOnJS } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  ArrowLeft01Icon,
  Menu01Icon,
  Add01Icon,
  BarChartIcon,
  Calendar03Icon,
  FlashIcon,
  Invoice02Icon,
  Target01Icon,
  Wallet01Icon,
  Cancel01Icon,
  IconComponent as HugeiconsIcon,
  type PhosphorIcon,
} from '@/lib/icons';
import { launchScanner } from '@dariyd/react-native-document-scanner';
import { useAIChatStore } from '@/stores/aiChatStore';
import { logger } from '@/lib/logger';
import { ChatBubble, InputBar, MiriamCharacter } from '@/components/ai';
import { ActionConfirmSheet } from '@/components/ai/ActionConfirmSheet';
import { AttachmentSheet } from '@/components/sheets/AttachmentSheet';
import { AppsSheet } from '@/components/sheets/AppsSheet';
import type { AIMessage, PendingAction, InsightCard, ToneMode } from '@/api/types/ai';
import { useHaptics } from '@/hooks/useHaptics';
import { ANALYTICS_EVENTS, useAnalytics } from '@/utils/analytics';

const BG = '#FAFAF7';

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
          className="rounded-full border border-black/[0.08] bg-[#F5F5F5] px-4 py-2">
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
            className="flex-row items-center gap-1.5 rounded-full border border-black/[0.08] bg-[#F5F5F5] px-3.5 py-2.5"
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

// ─── Empty State (Perplexity-inspired: centered character + name) ────

function EmptyChatState({
  hideForTyping,
}: {
  onSend: (msg: string) => void;
  suggestions: string[];
  hideForTyping: boolean;
  agentMode: boolean;
}) {
  if (hideForTyping) return <View className="flex-1" />;

  return (
    <View className="flex-1 items-center justify-center">
      <View className="flex-row items-center gap-3">
        <MiriamCharacter size={40} emotion="happy" animate />
        <Text className="font-body text-[34px] tracking-[-0.5px] text-[#6B6B68]">miriam</Text>
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
    isStatementProcessing,
    sendMessage,
    sendImage,
    setTonePreference,
    retryLastMessage,
    deleteMessage,
    retryFromMessage,
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

  // Track which message should play the typing animation.
  // Only the message that arrives after a live stream should animate — never history.
  const animateMessageIdRef = useRef<string | null>(null);
  const prevIsStreaming = useRef(false);
  useEffect(() => {
    if (prevIsStreaming.current && !isStreaming) {
      const msgs = messages ?? [];
      const lastIndex = msgs.length - 1;
      const last = msgs[lastIndex];
      if (last?.role === 'assistant') {
        // Key must match renderMessage's msgKey exactly
        animateMessageIdRef.current = last.id ?? `${last.created_at}-${lastIndex}`;
      }
    }
    prevIsStreaming.current = isStreaming;
  }, [isStreaming, messages]);

  const [editText, setEditText] = useState('');
  const [attachedImage, setAttachedImage] = useState<{ uri: string; base64: string } | null>(null);
  const [showAttachmentSheet, setShowAttachmentSheet] = useState(false);
  const [showAppsSheet, setShowAppsSheet] = useState(false);
  const [attachedDocument, setAttachedDocument] = useState<{
    uri: string;
    name: string;
    size?: number;
  } | null>(null);
  const consumePendingScannedReceipt = useAIChatStore((s) => s.consumePendingScannedReceipt);
  const sendStatement = useAIChatStore((s) => s.sendStatement);
  const clearStatementPolling = useAIChatStore((s) => s.clearStatementPolling);

  // Pick up scanned receipt from store when returning from scanner
  useFocusEffect(
    useCallback(() => {
      const pending = consumePendingScannedReceipt();
      if (pending) {
        setAttachedImage(pending);
      }
    }, [consumePendingScannedReceipt])
  );

  const [activeAgentAction, setActiveAgentAction] = useState<AgentAction | null>(null);

  const handleStatementUpload = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/heic'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0];
      if (file.size && file.size > 20 * 1024 * 1024) {
        Alert.alert('File too large', 'Please upload a file under 20MB.');
        return;
      }
      setAttachedDocument({ uri: file.uri, name: file.name || 'Statement.pdf', size: file.size });
    } catch {
      Alert.alert('Error', 'Could not pick document. Please try again.');
    }
  }, []);

  const handleSendDocument = useCallback(
    (uri: string, text?: string) => {
      setAttachedDocument(null);
      sendStatement(uri, 'auto', text);
    },
    [sendStatement]
  );

  const handleSend = useCallback(
    async (
      msg: string,
      image?: { uri: string; base64: string },
      source: 'prompt' | 'agent_mode' | 'preloaded' = 'prompt'
    ) => {
      const trimmed = msg.trim();
      if (!trimmed && !image && !activeAgentAction) return;

      // If agent action is active, prepend its prompt as context
      let finalMsg = trimmed;
      if (activeAgentAction) {
        finalMsg = trimmed ? `[${activeAgentAction.label}] ${trimmed}` : activeAgentAction.prompt;
        if (activeAgentAction.toneMode) {
          setTonePreference(activeAgentAction.toneMode);
        }
        setActiveAgentAction(null);
      }

      setAgentMode(false);
      const toneMode = finalMsg ? inferToneModeFromPrompt(finalMsg) : undefined;
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
          finalMsg || 'Analyze this receipt and extract the transaction details.'
        );
        return;
      }

      let convId = activeConversationId;
      if (!convId) {
        try {
          convId = await createConversation(finalMsg.slice(0, 50));
        } catch {
          await sendMessage(finalMsg, undefined, { toneMode });
          setEditText('');
          return;
        }
      }

      await sendMessage(finalMsg, convId, { toneMode });
      setEditText('');
    },
    [
      activeConversationId,
      activeAgentAction,
      createConversation,
      sendMessage,
      sendImage,
      setTonePreference,
      track,
    ]
  );

  const handleAgentPick = useCallback(
    (action: AgentAction) => {
      if (action.toneMode) {
        setTonePreference(action.toneMode);
      }
      setActiveAgentAction(action);
    },
    [setTonePreference]
  );

  const handleClearAgentAction = useCallback(() => {
    setActiveAgentAction(null);
  }, []);

  // Clean up statement polling when component unmounts
  useEffect(() => {
    return () => clearStatementPolling();
  }, [clearStatementPolling]);

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

  const pickFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.status !== 'granted') {
      const message = permissionResult.canAskAgain
        ? 'Allow photo access to scan receipts.'
        : 'Photo access was permanently denied. Go to Settings > Privacy > Photos to enable it.';
      Alert.alert('Permission needed', message);
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

  const pickFromCamera = async () => {
    try {
      const result = await launchScanner({
        quality: 0.7,
        includeBase64: true,
      });

      if (result.error || result.didCancel) return;

      const image = result.images?.[0];
      if (image?.base64) {
        setAttachedImage({ uri: image.uri, base64: image.base64 });
      }
    } catch (err) {
      logger.warn('Document scanner failed', { error: err });
    }
  };

  const handleClearImage = useCallback(() => setAttachedImage(null), []);

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
      const msgKey = item.id ?? `${item.created_at}-${index}`;
      const shouldAnimate = item.role === 'assistant' && msgKey === animateMessageIdRef.current;
      // Clear after consuming so re-mounts don't replay the animation
      if (shouldAnimate) animateMessageIdRef.current = null;
      return (
        <ChatBubble
          msg={item}
          cards={showCards}
          isLatest={isLast}
          animate={shouldAnimate}
          onEdit={(content) => setEditText(content)}
          onRetry={() => retryFromMessage({ id: item.id, index })}
          onDeleteMessage={() => deleteMessage({ id: item.id, index })}
        />
      );
    },
    [messageCount, cards, deleteMessage, retryFromMessage]
  );

  const isEmpty = !activeConversationId && (messages ?? []).length === 0;

  return (
    <View className="flex-1" style={{ backgroundColor: BG }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: BG }}
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
            <GlassView
              effect="regular"
              interactive
              white
              fallbackColor="rgba(0,0,0,0.06)"
              style={{ borderRadius: 22, flexDirection: 'row', alignItems: 'center' }}>
              <Pressable
                onPress={() => (navigation as any).openDrawer()}
                hitSlop={12}
                className="h-10 w-10 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Open threads">
                <HugeiconsIcon icon={Menu01Icon} size={22} color="#343433" />
              </Pressable>
              <Pressable
                onPress={handleNewThread}
                hitSlop={12}
                className="h-10 w-10 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="New thread">
                <HugeiconsIcon icon={Add01Icon} size={22} color="#343433" />
              </Pressable>
            </GlassView>
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
                ) : isStreaming && isStatementProcessing ? (
                  <View className="flex-row items-center gap-3 px-1 py-3">
                    <MiriamCharacter size={36} emotion="thinking" isProcessing animate={false} />
                    <Text className="font-body text-[15px] text-ash">Uploading statement...</Text>
                  </View>
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
          {agentMode && !isKeyboardVisible && !activeAgentAction && (
            <AgentActionRail onPick={handleAgentPick} disabled={isStreaming} />
          )}
          {!isEmpty && !agentMode && !isKeyboardVisible && (
            <SuggestionChips suggestions={smartSuggestions} onPress={handleSend} />
          )}
          {activeAgentAction && (
            <Animated.View
              entering={FadeIn.duration(150)}
              className="mx-4 mb-2 flex-row items-center gap-2 rounded-full bg-[#F0F0F0] px-3.5 py-2">
              <HugeiconsIcon icon={activeAgentAction.icon} size={15} color="#343433" />
              <Text className="flex-1 font-body-medium text-[13px] text-charcoal-primary">
                {activeAgentAction.label}
              </Text>
              <Pressable onPress={handleClearAgentAction} hitSlop={8}>
                <HugeiconsIcon icon={Cancel01Icon} size={14} color="#94918d" />
              </Pressable>
            </Animated.View>
          )}
          <InputBar
            onSend={handleSend}
            onPlusPress={() => setShowAttachmentSheet(true)}
            isStreaming={isStreaming}
            placeholder={isEmpty ? 'Ask anything...' : 'Ask a follow up...'}
            initialValue={editText}
            attachedImage={attachedImage}
            attachedDocument={attachedDocument}
            onClearImage={handleClearImage}
            onClearDocument={() => setAttachedDocument(null)}
            onSendDocument={handleSendDocument}
            agentMode={agentMode}
            onAgentModeToggle={() => setAgentMode((v) => !v)}
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

      <AttachmentSheet
        visible={showAttachmentSheet}
        onClose={() => setShowAttachmentSheet(false)}
        onScanReceipt={pickFromCamera}
        onPickImage={pickFromGallery}
        onUploadStatement={handleStatementUpload}
        onApps={() => setShowAppsSheet(true)}
      />

      <AppsSheet visible={showAppsSheet} onClose={() => setShowAppsSheet(false)} />
    </View>
  );
}
