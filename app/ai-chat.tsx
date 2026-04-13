import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAIChatStore } from '@/stores/aiChatStore';
import { useAIHaptics } from '@/hooks/useAIHaptics';
import { ChatBubble, InputBar, ThreadRow } from '@/components/ai';
import type { AIMessage } from '@/api/types/ai';

const BG = '#F9F8F6';
const ACCENT = '#FF2E01';
const TEXT_PRIMARY = '#1A1A1A';
const TEXT_SECONDARY = '#8C8C8C';
const TEXT_TERTIARY = '#B5B5B5';
const SURFACE = '#FFFFFF';
const BORDER = 'rgba(0,0,0,0.06)';

// ─── Typing Dots ─────────────────────────────────────────────────

function TypingDots() {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16, paddingLeft: 2 }}>
      <Text style={{ fontFamily: 'SFMono-Medium', fontSize: 11, color: ACCENT, letterSpacing: 0.5, marginRight: 8 }}>ADA</Text>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: TEXT_TERTIARY, opacity: 0.4 + i * 0.25 }} />
      ))}
    </Animated.View>
  );
}

// ─── Suggestion Chips ────────────────────────────────────────────

function SuggestionChips({ suggestions, onPress }: { suggestions: string[]; onPress: (s: string) => void }) {
  const { onTap } = useAIHaptics();
  if (!suggestions.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}>
      {suggestions.slice(0, 5).map((s, i) => (
        <Pressable
          key={i}
          onPress={() => { onTap(); onPress(s); }}
          style={{
            backgroundColor: SURFACE,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: BORDER,
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}>
          <Text style={{ fontFamily: 'SFProDisplay-Regular', fontSize: 13, color: TEXT_SECONDARY }}>{s}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────

export default function AIChatScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<FlatList>(null);
  const router = useRouter();
  const [showThreads, setShowThreads] = useState(false);
  const { onNewThread } = useAIHaptics();

  const {
    conversations,
    activeConversationId,
    messages,
    isStreaming,
    cards,
    suggestions,
    sendMessage,
    selectConversation,
    createConversation,
    deleteConversation,
    clearActiveConversation,
    close,
  } = useAIChatStore();

  // Auto-scroll on new messages
  useEffect(() => {
    if ((messages ?? []).length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [(messages ?? []).length, isStreaming]);

  const handleSend = useCallback(
    async (msg: string) => {
      if (!activeConversationId) await createConversation(msg.slice(0, 50));
      sendMessage(msg);
    },
    [activeConversationId, createConversation, sendMessage]
  );

  const handleBack = useCallback(() => {
    if (showThreads) setShowThreads(false);
    else if (activeConversationId) clearActiveConversation();
    else {
      close();
      router.back();
    }
  }, [showThreads, activeConversationId, clearActiveConversation, close, router]);

  const handleNewThread = useCallback(() => {
    onNewThread();
    clearActiveConversation();
    setShowThreads(false);
  }, [clearActiveConversation, onNewThread]);

  const handleSelectThread = useCallback(
    (id: string) => {
      selectConversation(id);
      setShowThreads(false);
    },
    [selectConversation]
  );

  const handleDeleteThread = useCallback(
    (id: string) => {
      deleteConversation(id);
    },
    [deleteConversation]
  );

  const renderMessage = useCallback(
    ({ item, index }: { item: AIMessage; index: number }) => {
      const isLast = index === (messages ?? []).length - 1;
      const showCards = isLast && item.role === 'assistant' ? cards : undefined;
      return (
        <ChatBubble
          msg={item}
          cards={showCards}
          isLatest={isLast}
          animate={isLast && item.role === 'assistant'}
        />
      );
    },
    [messages, cards]
  );

  // ── Active Chat View ───────────────────────────────────────────

  if (activeConversationId || (messages ?? []).length > 0) {
    return (
      <View style={{ flex: 1, backgroundColor: BG }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: insets.top + 8,
              paddingHorizontal: 16,
              paddingBottom: 12,
              backgroundColor: BG,
            }}>
            <Pressable onPress={handleBack} hitSlop={12} style={{ padding: 8 }}>
              <Text style={{ fontSize: 20, color: TEXT_PRIMARY }}>←</Text>
            </Pressable>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: 'SFMono-Bold', fontSize: 13, color: TEXT_PRIMARY, letterSpacing: 0.5 }}>
                ADA
              </Text>
            </View>
            <Pressable onPress={handleNewThread} hitSlop={12} style={{ padding: 8 }}>
              <Text style={{ fontFamily: 'SFProDisplay-Regular', fontSize: 20, color: TEXT_PRIMARY }}>+</Text>
            </Pressable>
          </View>

          {/* Messages */}
          <FlatList
            ref={scrollRef}
            data={messages ?? []}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 }}
            renderItem={renderMessage}
            ListFooterComponent={isStreaming ? <TypingDots /> : null}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          />

          {/* Input */}
          <View style={{ paddingBottom: insets.bottom + 8 }}>
            <InputBar onSend={handleSend} isStreaming={isStreaming} placeholder="Ask a follow up..." />
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ── Threads List View ──────────────────────────────────────────

  if (showThreads) {
    return (
      <Animated.View entering={FadeIn.duration(150)} style={{ flex: 1, backgroundColor: BG }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: insets.top + 8,
            paddingHorizontal: 16,
            paddingBottom: 12,
          }}>
          <Pressable onPress={() => setShowThreads(false)} hitSlop={12} style={{ padding: 8 }}>
            <Text style={{ fontSize: 20, color: TEXT_PRIMARY }}>←</Text>
          </Pressable>
          <Text style={{ fontFamily: 'SFProDisplay-Medium', fontSize: 14, color: TEXT_SECONDARY }}>Threads</Text>
          <Pressable onPress={handleNewThread} hitSlop={12} style={{ padding: 8 }}>
            <Text style={{ fontSize: 20, color: TEXT_PRIMARY }}>+</Text>
          </Pressable>
        </View>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {(conversations ?? []).length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <Text style={{ fontFamily: 'SFProDisplay-Regular', fontSize: 14, color: TEXT_TERTIARY }}>
                No threads yet
              </Text>
            </View>
          ) : (
            (conversations ?? []).map((conv) => (
              <ThreadRow
                key={conv.id}
                conv={conv}
                onPress={() => handleSelectThread(conv.id)}
                onDelete={() => handleDeleteThread(conv.id)}
              />
            ))
          )}
        </ScrollView>
      </Animated.View>
    );
  }

  // ── Home View (Perplexity-inspired) ────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: insets.top + 8,
            paddingHorizontal: 16,
          }}>
          <Pressable onPress={() => { close(); router.back(); }} hitSlop={12} style={{ padding: 8 }}>
            <Text style={{ fontSize: 20, color: TEXT_PRIMARY }}>✕</Text>
          </Pressable>
          <Pressable onPress={() => setShowThreads(true)} hitSlop={12} style={{ padding: 8 }}>
            <Text style={{ fontFamily: 'SFProDisplay-Regular', fontSize: 18, color: TEXT_PRIMARY }}>☰</Text>
          </Pressable>
        </View>

        {/* Center branding */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 100 }}>
          <Text style={{ fontSize: 36, color: ACCENT, marginBottom: 8 }}>✦</Text>
          <Text style={{ fontFamily: 'SFMono-Bold', fontSize: 28, color: TEXT_PRIMARY, letterSpacing: -0.5 }}>
            ada
          </Text>
          <Text style={{ fontFamily: 'SFProDisplay-Regular', fontSize: 14, color: TEXT_TERTIARY, marginTop: 6 }}>
            Your financial companion
          </Text>
        </View>

        {/* Bottom: suggestions + input */}
        <View style={{ paddingBottom: insets.bottom + 8 }}>
          <SuggestionChips suggestions={suggestions ?? []} onPress={handleSend} />
          <InputBar onSend={handleSend} isStreaming={isStreaming} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
