import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, Platform, AppState, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, useKeyboardHandler } from 'react-native-keyboard-controller';
import Animated, { FadeIn, runOnJS } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAIChatStore } from '@/stores/aiChatStore';
import { playChatSound } from '@/lib/chatSounds';
import * as Haptics from '@/utils/platformHaptics';

import {
  ChatBubble,
  InputBar,
  InlineActionCard,
  CHAT_BG,
  DateSeparator,
  isDifferentDay,
  ScrollToBottomButton,
  CelebrationOverlay,
} from '@/components/ai';
import { AttachmentSheet } from '@/components/sheets/AttachmentSheet';
import { AppsSheet } from '@/components/sheets/AppsSheet';
import { StatementUploadSheet } from '@/components/sheets/StatementUploadSheet';
import type { AIMessage, PendingAction, InsightCard } from '@/api/types/ai';
import type { Tapback } from '@/components/ai/TapbackPicker';
import {
  useAutoScroll,
  useImagePickers,
  useChatActions,
  ChatHeader,
  EmptyChatState,
  SuggestionChips,
  AgentActionRail,
  ActiveAgentBadge,
  StreamingFooter,
  PollingFooter,
  RetryBanner,
  CeilingBanner,
  DEFAULT_SUGGESTIONS,
  type AgentAction,
} from '@/components/ai/chat';

// ─── Hooks ───────────────────────────────────────────────────────

function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useKeyboardHandler({
    onEnd: (e) => {
      'worklet';
      runOnJS(setVisible)(e.height > 0);
    },
  });
  return visible;
}

// ─── Main Screen ─────────────────────────────────────────────────

export default function AIChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { preloaded_message } = useLocalSearchParams<{ preloaded_message?: string }>();
  const isKeyboardVisible = useKeyboardVisible();

  // ─── Local UI state ────────────────────────────────────────────
  const [agentMode, setAgentMode] = useState(false);
  const [activeAgentAction, setActiveAgentAction] = useState<AgentAction | null>(null);
  const [editText, setEditText] = useState('');
  const [showAttachmentSheet, setShowAttachmentSheet] = useState(false);
  const [showAppsSheet, setShowAppsSheet] = useState(false);
  const [showStatementSheet, setShowStatementSheet] = useState(false);
  const [inputBarHeight, setInputBarHeight] = useState(0);

  // ─── Custom hooks ──────────────────────────────────────────────
  const {
    scrollRef,
    showScrollBtn,
    isNearBottom,
    handleScroll,
    scrollToBottom,
    handleContentSizeChange,
    handleLayout,
  } = useAutoScroll();

  const { attachedImage, setAttachedImage, pickFromGallery, pickFromCamera, clearImage } =
    useImagePickers();

  const { handleSend, handleSendRef, handleSendDocument, attachedDocument, setAttachedDocument } =
    useChatActions({
      clearImage,
      activeAgentAction,
      setActiveAgentAction,
      setAgentMode,
      setEditText,
    });

  // ─── Store selectors (granular) ────────────────────────────────
  const activeConversationId = useAIChatStore((s) => s.activeConversationId);
  const messages = useAIChatStore((s) => s.messages);
  const isStreaming = useAIChatStore((s) => s.isStreaming);
  const cards = useAIChatStore((s) => s.cards);
  const suggestions = useAIChatStore((s) => s.suggestions);
  const pendingAction = useAIChatStore((s) => s.pendingAction);
  const overCeiling = useAIChatStore((s) => s.overCeiling);
  const lastError = useAIChatStore((s) => s.lastError);
  const isStatementProcessing = useAIChatStore((s) => s.isStatementProcessing);

  // Store actions
  const retryLastMessage = useAIChatStore((s) => s.retryLastMessage);
  const deleteMessage = useAIChatStore((s) => s.deleteMessage);
  const retryFromMessage = useAIChatStore((s) => s.retryFromMessage);
  const clearActiveConversation = useAIChatStore((s) => s.clearActiveConversation);
  const clearPendingAction = useAIChatStore((s) => s.clearPendingAction);
  const close = useAIChatStore((s) => s.close);
  const consumePendingScannedReceipt = useAIChatStore((s) => s.consumePendingScannedReceipt);
  const sendStatement = useAIChatStore((s) => s.sendStatement);
  const clearStatementPolling = useAIChatStore((s) => s.clearStatementPolling);
  const addReaction = useAIChatStore((s) => s.addReaction);
  const setTonePreference = useAIChatStore((s) => s.setTonePreference);

  const messageCount = messages.length;
  const isEmpty = !activeConversationId && messageCount === 0;
  const hasFailedMessage =
    !!lastError && messageCount > 0 && messages[messageCount - 1].role === 'assistant';

  // ─── Derived values ────────────────────────────────────────────
  const smartSuggestions = useMemo(() => {
    return suggestions.length > 0 ? suggestions : DEFAULT_SUGGESTIONS;
  }, [suggestions]);

  // ─── Effects ───────────────────────────────────────────────────

  // Auto-scroll on new messages
  const prevCountRef = useRef(0);
  useEffect(() => {
    if (messageCount > prevCountRef.current && isNearBottom()) {
      scrollToBottom(true);
    }
    prevCountRef.current = messageCount;
  }, [messageCount, isNearBottom, scrollToBottom]);

  // Animate & sound on new assistant reply
  const animateMessageIdRef = useRef<string | null>(null);
  const prevIsStreaming = useRef(false);
  useEffect(() => {
    if (prevIsStreaming.current && !isStreaming) {
      const last = messages[messages.length - 1];
      if (last?.role === 'assistant') {
        animateMessageIdRef.current = last.id ?? `${last.created_at}-${messages.length - 1}`;
        playChatSound('receive');
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        scrollToBottom(true);
      }
    }
    prevIsStreaming.current = isStreaming;
  }, [isStreaming, messages, scrollToBottom]);

  // Pick up pending scanned receipt on focus
  useFocusEffect(
    useCallback(() => {
      const pending = consumePendingScannedReceipt();
      if (pending) setAttachedImage(pending);
    }, [consumePendingScannedReceipt, setAttachedImage])
  );

  // Cleanup polling on unmount
  useEffect(() => () => clearStatementPolling(), [clearStatementPolling]);

  // Fresh chat when app backgrounds
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') clearActiveConversation();
    });
    return () => sub.remove();
  }, [clearActiveConversation]);

  // Auto-send preloaded message
  const preloadHandled = useRef(false);
  useEffect(() => {
    if (preloaded_message && !preloadHandled.current && !isStreaming) {
      preloadHandled.current = true;
      handleSendRef.current(preloaded_message, undefined, 'preloaded');
    }
  }, [preloaded_message, isStreaming, handleSendRef]);

  // ─── Handlers ─────────────────────────────────────────────────

  const handleBack = useCallback(() => {
    if (agentMode) {
      setAgentMode(false);
      return;
    }
    if (activeConversationId) {
      clearActiveConversation();
      return;
    }
    close();
    router.back();
  }, [agentMode, activeConversationId, clearActiveConversation, close, router]);

  const handleNewThread = useCallback(() => {
    clearActiveConversation();
    setAgentMode(false);
  }, [clearActiveConversation]);

  const handleAgentPick = useCallback(
    (action: AgentAction) => {
      if (action.toneMode) setTonePreference(action.toneMode);
      setActiveAgentAction(action);
    },
    [setTonePreference]
  );

  const handleActionConfirmed = useCallback(
    (action: PendingAction) => {
      clearPendingAction();
      playChatSound('confirm');
      useAIChatStore.setState((s) => ({
        messages: [
          ...s.messages,
          {
            role: 'assistant' as const,
            content: `Done — ${action.description}`,
            created_at: new Date().toISOString(),
          },
        ],
      }));
    },
    [clearPendingAction]
  );

  const handleActionCancelled = useCallback(() => {
    clearPendingAction();
    useAIChatStore.setState((s) => ({
      messages: [
        ...s.messages,
        {
          role: 'assistant' as const,
          content: 'No worries — action cancelled.',
          created_at: new Date().toISOString(),
        },
      ],
    }));
  }, [clearPendingAction]);

  // ─── Render message ────────────────────────────────────────────

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const renderMessage = useCallback(
    ({ item, index }: { item: AIMessage; index: number }) => {
      const isLast = index === messageCount - 1;
      let showCards: InsightCard[] | undefined;
      if (isLast && item.role === 'assistant')
        showCards = cards?.length ? cards : (item.metadata?.cards as InsightCard[] | undefined);
      else if (item.role === 'assistant' && item.metadata?.cards)
        showCards = item.metadata.cards as InsightCard[];

      const msgKey = item.id ?? `${item.created_at}-${index}`;
      const shouldAnimate = item.role === 'assistant' && msgKey === animateMessageIdRef.current;
      if (shouldAnimate) animateMessageIdRef.current = null;

      const msgs = messagesRef.current;
      const prev = index > 0 ? msgs[index - 1] : undefined;
      const next = index < messageCount - 1 ? msgs[index + 1] : undefined;
      const groupedAbove = prev?.role === item.role;
      const showTail = !next || next.role !== item.role;
      const showDate = isDifferentDay(prev?.created_at, item.created_at);

      return (
        <View>
          {showDate && item.created_at ? <DateSeparator iso={item.created_at} /> : null}
          <ChatBubble
            msg={item}
            cards={showCards}
            isLatest={isLast}
            animate={shouldAnimate}
            groupedAbove={groupedAbove}
            showTail={showTail}
            onEdit={(content) => setEditText(content)}
            onRetry={() => retryFromMessage({ id: item.id, index })}
            onDeleteMessage={() => deleteMessage({ id: item.id, index })}
            onReact={(emoji: Tapback) => addReaction(index, emoji)}
            onPickPoll={(option) => handleSend(option)}
          />
          {item.role === 'user' && isLast && !isStreaming ? (
            <Animated.View entering={FadeIn.duration(150)} className="mb-1 items-end pr-1">
              <Text className="font-body text-[11px] text-ash" maxFontSizeMultiplier={1.4}>
                Delivered
              </Text>
            </Animated.View>
          ) : null}
        </View>
      );
    },
    [messageCount, cards, isStreaming, deleteMessage, retryFromMessage, addReaction, handleSend]
  );

  // ─── List footer ───────────────────────────────────────────────

  const listFooter = useMemo(
    () => (
      <>
        {isStreaming && !isStatementProcessing && <StreamingFooter />}
        {pendingAction && !isStreaming ? (
          <View className="mt-3">
            <InlineActionCard
              key={pendingAction.id}
              action={pendingAction}
              onConfirmed={handleActionConfirmed}
              onCancelled={handleActionCancelled}
            />
          </View>
        ) : null}
        {!isStreaming && isStatementProcessing && <PollingFooter />}
        {hasFailedMessage && <RetryBanner onPress={retryLastMessage} />}
        {overCeiling && <CeilingBanner />}
      </>
    ),
    [
      isStreaming,
      isStatementProcessing,
      pendingAction,
      hasFailedMessage,
      overCeiling,
      retryLastMessage,
      handleActionConfirmed,
      handleActionCancelled,
    ]
  );

  // ─── JSX ──────────────────────────────────────────────────────

  return (
    <View className="flex-1" style={{ backgroundColor: CHAT_BG }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}>
        <ChatHeader
          paddingTop={insets.top + 8}
          agentMode={agentMode}
          isKeyboardVisible={isKeyboardVisible}
          onBack={handleBack}
          onOpenDrawer={() => (navigation as any).openDrawer()}
          onNewThread={handleNewThread}
        />

        {isEmpty ? (
          <EmptyChatState hideForTyping={isKeyboardVisible} />
        ) : (
          <View className="flex-1">
            <FlatList
              ref={scrollRef}
              data={messages}
              keyExtractor={(item, i) => item.id || `${item.role}-${i}-${item.created_at || i}`}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}
              renderItem={renderMessage}
              onScroll={handleScroll}
              onContentSizeChange={handleContentSizeChange}
              onLayout={handleLayout}
              scrollEventThrottle={16}
              windowSize={7}
              maxToRenderPerBatch={8}
              updateCellsBatchingPeriod={30}
              ListFooterComponent={listFooter}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
              removeClippedSubviews={Platform.OS === 'android'}
            />
            <ScrollToBottomButton
              visible={showScrollBtn}
              onPress={() => scrollToBottom(true)}
              bottom={inputBarHeight + 16}
            />
          </View>
        )}

        {/* Input area */}
        <View
          onLayout={(e) => setInputBarHeight(e.nativeEvent.layout.height)}
          style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
          {agentMode && !isKeyboardVisible && !activeAgentAction && (
            <AgentActionRail onPick={handleAgentPick} disabled={isStreaming} />
          )}
          {!isEmpty && !agentMode && !isKeyboardVisible && (
            <SuggestionChips suggestions={smartSuggestions} onPress={handleSend} />
          )}
          {activeAgentAction && (
            <ActiveAgentBadge
              action={activeAgentAction}
              onClear={() => setActiveAgentAction(null)}
            />
          )}
          <InputBar
            onSend={handleSend}
            onPlusPress={() => setShowAttachmentSheet(true)}
            isStreaming={isStreaming}
            placeholder={isEmpty ? 'Message Miriam' : 'Reply...'}
            initialValue={editText}
            attachedImage={attachedImage}
            attachedDocument={attachedDocument}
            onClearImage={clearImage}
            onClearDocument={() => setAttachedDocument(null)}
            onSendDocument={handleSendDocument}
            agentMode={agentMode}
            onAgentModeToggle={() => setAgentMode((v) => !v)}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Sheets */}
      <AttachmentSheet
        visible={showAttachmentSheet}
        onClose={() => setShowAttachmentSheet(false)}
        onScanReceipt={pickFromCamera}
        onPickImage={pickFromGallery}
        onUploadStatement={() => setShowStatementSheet(true)}
        onApps={() => setShowAppsSheet(true)}
      />
      <AppsSheet visible={showAppsSheet} onClose={() => setShowAppsSheet(false)} />
      <StatementUploadSheet
        visible={showStatementSheet}
        onClose={() => setShowStatementSheet(false)}
        onUpload={(uri) => sendStatement(uri, 'auto')}
      />
      <CelebrationOverlay />
    </View>
  );
}
