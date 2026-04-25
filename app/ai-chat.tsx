import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  Platform,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  KeyboardAvoidingView,
  useKeyboardHandler,
} from 'react-native-keyboard-controller';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  Menu01Icon,
  Add01Icon,
  Search01Icon,
  Camera01Icon,
  Image01Icon,
} from '@hugeicons/core-free-icons';
import { useAIChatStore } from '@/stores/aiChatStore';
import { ChatBubble, InputBar, ThreadRow, MiriamCharacter } from '@/components/ai';
import { ActionConfirmSheet } from '@/components/ai/ActionConfirmSheet';
import { ActionSheet } from '@/components/sheets/ActionSheet';
import type { AIMessage, PendingAction, InsightCard } from '@/api/types/ai';
import { useSubscription } from '@/api/hooks/useGameplay';

const BG = '#F7F7F2';

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
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      className="mb-6 flex-row items-center gap-3">
      <MiriamCharacter size={28} emotion="thinking" isProcessing />
      <View className="flex-row items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-[#B5B5B5]"
            style={{ opacity: 0.4 + i * 0.25 }}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// ─── Retry Banner ────────────────────────────────────────────────

function RetryBanner({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="mt-3 flex-row items-center justify-center gap-2 py-3">
      <Text className="font-body text-[15px] text-[#B5B5B5]">Failed to send.</Text>
      <Text className="font-body-medium text-[15px] text-[#1A7A6D]">Retry</Text>
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
          className="rounded-full border border-black/[0.06] bg-white px-4 py-2">
          <Text className="font-body text-[14px] text-[#6B7280]" numberOfLines={1}>
            {s}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ─── Empty State (Miriam centered) ───────────────────────────────

function EmptyChatState({
  onSend,
  suggestions,
  hideForTyping,
}: {
  onSend: (msg: string) => void;
  suggestions: string[];
  hideForTyping: boolean;
}) {
  if (hideForTyping) return <View className="flex-1" />;

  return (
    <View className="flex-1">
      <View className="flex-1 items-center justify-center px-6">
        <MiriamCharacter size={120} emotion="happy" animate />
        <Text className="mt-6 font-mono-bold text-[32px] tracking-tight text-[#1A1A1A]">
          Miriam
        </Text>
        <Text className="mt-2 font-body text-[16px] text-[#B5B5B5]">
          Your financial assistant
        </Text>
      </View>
      <View className="pb-2">
        <SuggestionChips suggestions={suggestions} onPress={onSend} />
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────

export default function AIChatScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<FlatList>(null);
  const router = useRouter();
  const [showThreads, setShowThreads] = useState(false);
  const isKeyboardVisible = useKeyboardVisible();
  const [threadSearch, setThreadSearch] = useState('');
  const { data: subData } = useSubscription();
  const isPro = __DEV__ || (subData?.is_pro ?? false);

  const {
    conversations,
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
    retryLastMessage,
    selectConversation,
    createConversation,
    deleteConversation,
    clearActiveConversation,
    clearPendingAction,
    close,
  } = useAIChatStore();
  const messageCount = messages.length;

  const smartSuggestions = useMemo(() => {
    const defaults = [
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

  const filteredConversations = useMemo(() => {
    const list = conversations ?? [];
    if (!threadSearch.trim()) return list;
    const q = threadSearch.toLowerCase();
    return list.filter((c) => (c.title ?? '').toLowerCase().includes(q));
  }, [conversations, threadSearch]);

  useEffect(() => {
    if (messageCount > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messageCount, isStreaming]);

  const [editText, setEditText] = useState('');
  const [attachedImage, setAttachedImage] = useState<{ uri: string; base64: string } | null>(null);
  const [showImageSheet, setShowImageSheet] = useState(false);

  const handleSend = useCallback(
    async (msg: string, image?: { uri: string; base64: string }) => {
      const trimmed = msg.trim();
      if (!trimmed && !image) return;

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
          await sendMessage(trimmed);
          setEditText('');
          return;
        }
      }

      await sendMessage(trimmed, convId);
      setEditText('');
    },
    [activeConversationId, createConversation, sendMessage, sendImage]
  );

  const handleActionConfirmed = useCallback(
    (action: PendingAction) => {
      clearPendingAction();
      const confirmMsg: AIMessage = {
        role: 'assistant',
        content: `✅ Done — ${action.description}`,
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
    if (showThreads) {
      setShowThreads(false);
      setThreadSearch('');
    } else if (activeConversationId) {
      clearActiveConversation();
    } else {
      close();
      router.back();
    }
  }, [showThreads, activeConversationId, clearActiveConversation, close, router]);

  const handleNewThread = useCallback(() => {
    clearActiveConversation();
    setShowThreads(false);
    setThreadSearch('');
  }, [clearActiveConversation]);

  const handleMicPress = useCallback(() => {
    if (!isPro) {
      router.push('/subscription');
      return;
    }
    router.push('/voice-mode');
  }, [router, isPro]);

  const handleImagePress = useCallback(() => {
    if (!isPro) {
      router.push('/subscription');
      return;
    }
    setShowImageSheet(true);
  }, [isPro, router]);

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

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to scan receipts.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: true,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      setAttachedImage({ uri: result.assets[0].uri, base64: result.assets[0].base64 });
    }
  };

  const hasFailedMessage =
    lastError && messages.length > 0 && messages[messages.length - 1].role === 'assistant';

  const renderMessage = useCallback(
    ({ item, index }: { item: AIMessage; index: number }) => {
      const isLast = index === (messages ?? []).length - 1;
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
          animate={isLast && item.role === 'assistant'}
          onEdit={(content) => setEditText(content)}
        />
      );
    },
    [messages, cards]
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
            className="w-10 h-10 rounded-full items-center justify-center">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#1A1A1A" />
          </Pressable>
          <Text className="font-mono-bold text-[17px] tracking-wider text-[#1A1A1A]">
            Miriam
          </Text>
          <View className="flex-row items-center gap-1">
            <Pressable
              onPress={() => setShowThreads(true)}
              hitSlop={12}
              className="w-10 h-10 rounded-full items-center justify-center">
              <HugeiconsIcon icon={Menu01Icon} size={22} color="#1A1A1A" />
            </Pressable>
            <Pressable
              onPress={handleNewThread}
              hitSlop={12}
              className="w-10 h-10 rounded-full items-center justify-center">
              <HugeiconsIcon icon={Add01Icon} size={22} color="#1A1A1A" />
            </Pressable>
          </View>
        </View>

        {/* ── Content ── */}
        {isEmpty ? (
          <EmptyChatState
            onSend={handleSend}
            suggestions={smartSuggestions}
            hideForTyping={isKeyboardVisible}
          />
        ) : (
          <FlatList
            ref={scrollRef}
            data={messages ?? []}
            keyExtractor={(_, i) => String(i)}
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
                  <View className="mt-3 rounded-2xl bg-amber-50 p-4">
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

        {/* ── Threads Overlay ── */}
        {showThreads && (
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(150)}
            className="absolute bottom-0 left-0 right-0 top-0 z-20"
            style={{ backgroundColor: BG }}>
            <View
              className="flex-row items-center justify-between px-5 pb-3"
              style={{ paddingTop: insets.top + 8 }}>
              <Pressable
                onPress={() => {
                  setShowThreads(false);
                  setThreadSearch('');
                }}
                hitSlop={12}
                className="w-10 h-10 rounded-full items-center justify-center">
                <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#1A1A1A" />
              </Pressable>
              <Text className="font-heading-semibold text-[18px] text-[#1A1A1A]">
                Threads
              </Text>
              <Pressable
                onPress={handleNewThread}
                hitSlop={12}
                className="w-10 h-10 rounded-full items-center justify-center">
                <HugeiconsIcon icon={Add01Icon} size={22} color="#1A1A1A" />
              </Pressable>
            </View>

            <View className="mx-5 mb-4">
              <View className="flex-row items-center rounded-full bg-white px-4 py-3 border border-black/[0.05]">
                <HugeiconsIcon icon={Search01Icon} size={18} color="#B5B5B5" />
                <TextInput
                  value={threadSearch}
                  onChangeText={setThreadSearch}
                  placeholder="Search threads"
                  placeholderTextColor="#B5B5B5"
                  className="flex-1 font-body text-[15px] text-[#1A1A1A] ml-2.5"
                />
              </View>
            </View>

            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {filteredConversations.length === 0 ? (
                <View className="items-center pt-24 px-6">
                  <MiriamCharacter size={48} emotion="sleepy" animate={false} />
                  <Text className="mt-4 font-heading-semibold text-[17px] text-[#1A1A1A] text-center">
                    {threadSearch ? 'No matching threads' : 'No threads yet'}
                  </Text>
                  <Text className="mt-2 font-body text-[14px] text-[#B5B5B5] text-center">
                    {threadSearch
                      ? 'Try a different search term.'
                      : 'Start a conversation with Miriam to see it here.'}
                  </Text>
                </View>
              ) : (
                filteredConversations.map((conv) => (
                  <ThreadRow
                    key={conv.id}
                    conv={conv}
                    onPress={() => {
                      selectConversation(conv.id);
                      setShowThreads(false);
                      setThreadSearch('');
                    }}
                    onDelete={() => deleteConversation(conv.id)}
                  />
                ))
              )}
            </ScrollView>
          </Animated.View>
        )}

        {/* ── Input ── */}
        <View className="pb-2" style={{ paddingBottom: insets.bottom + 4 }}>
          {!isEmpty && !isKeyboardVisible && (
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
            onClearImage={() => setAttachedImage(null)}
          />
        </View>
      </KeyboardAvoidingView>

      <ActionConfirmSheet
        key={pendingAction?.id}
        action={pendingAction}
        visible={!!pendingAction}
        onClose={() => clearPendingAction()}
        onConfirmed={handleActionConfirmed}
        onCancelled={handleActionCancelled}
      />

      <ActionSheet
        visible={showImageSheet}
        onClose={() => setShowImageSheet(false)}
        icon={Camera01Icon}
        title="Add Receipt"
        subtitle="Scan or upload a receipt for Miriam to analyze"
        actions={[
          {
            id: 'scan',
            label: 'Scan Receipt',
            sublabel: 'Take a photo with your camera',
            icon: Camera01Icon,
            iconColor: '#FF2E01',
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
