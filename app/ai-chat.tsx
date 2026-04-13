import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useAIChatStore } from '@/stores/aiChatStore';
import { useRouter } from 'expo-router';
import type { AIMessage, InsightCard, AIConversation } from '@/api/types/ai';
import { formatDistanceToNow } from 'date-fns';

const BG = '#F9F8F6';
const ACCENT = '#FF2E01';
const TEXT_PRIMARY = '#1A1A1A';
const TEXT_SECONDARY = '#8C8C8C';
const TEXT_TERTIARY = '#B5B5B5';
const SURFACE = '#FFFFFF';
const BORDER = 'rgba(0,0,0,0.06)';

// ─── Insight Card ────────────────────────────────────────────────

function InsightCardView({ card }: { card: InsightCard }) {
  if (card.type === 'stat_grid' && Array.isArray(card.data)) {
    return (
      <View
        style={{
          marginTop: 10,
          backgroundColor: SURFACE,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: BORDER,
        }}>
        <Text
          style={{
            fontFamily: 'SFMono-Medium',
            fontSize: 12,
            color: TEXT_SECONDARY,
            letterSpacing: 0.3,
          }}>
          {card.title}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 10 }}>
          {(card.data as any[]).map((item: any, i: number) => (
            <View key={i} style={{ minWidth: 80 }}>
              <Text style={{ fontFamily: 'SFMono-Semibold', fontSize: 20, color: TEXT_PRIMARY }}>
                {item.value}
              </Text>
              <Text
                style={{
                  fontFamily: 'SFMono-Regular',
                  fontSize: 11,
                  color: TEXT_SECONDARY,
                  marginTop: 2,
                }}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (card.type === 'breakdown' && Array.isArray(card.data)) {
    return (
      <View
        style={{
          marginTop: 10,
          backgroundColor: SURFACE,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: BORDER,
        }}>
        <Text
          style={{
            fontFamily: 'SFMono-Medium',
            fontSize: 12,
            color: TEXT_SECONDARY,
            letterSpacing: 0.3,
          }}>
          {card.title}
        </Text>
        {(card.data as any[]).map((item: any, i: number) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 10,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
              <Text style={{ fontFamily: 'SFMono-Regular', fontSize: 14, color: TEXT_PRIMARY }}>
                {item.label}
              </Text>
            </View>
            <Text style={{ fontFamily: 'SFMono-Medium', fontSize: 14, color: TEXT_PRIMARY }}>
              ${item.amount}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View
      style={{
        marginTop: 10,
        backgroundColor: SURFACE,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: BORDER,
      }}>
      <Text style={{ fontFamily: 'SFMono-Medium', fontSize: 12, color: TEXT_SECONDARY }}>
        {card.title}
      </Text>
      {card.subtitle && (
        <Text
          style={{ fontFamily: 'SFMono-Regular', fontSize: 14, color: TEXT_PRIMARY, marginTop: 4 }}>
          {card.subtitle}
        </Text>
      )}
    </View>
  );
}

// ─── Chat Bubble ─────────────────────────────────────────────────

function ChatBubble({ msg, cards }: { msg: AIMessage; cards?: InsightCard[] }) {
  const isUser = msg.role === 'user';
  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      style={{ marginBottom: 20, maxWidth: '85%', alignSelf: isUser ? 'flex-end' : 'flex-start' }}>
      {isUser ? (
        <View
          style={{
            backgroundColor: TEXT_PRIMARY,
            borderRadius: 20,
            borderBottomRightRadius: 6,
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}>
          <Text
            style={{
              fontFamily: 'SFMono-Regular',
              fontSize: 15,
              color: '#FFFFFF',
              lineHeight: 22,
            }}>
            {msg.content}
          </Text>
        </View>
      ) : (
        <View>
          <Text
            style={{
              fontFamily: 'SFMono-Regular',
              fontSize: 15,
              color: TEXT_PRIMARY,
              lineHeight: 24,
            }}>
            {msg.content}
          </Text>
          {cards?.map((card, i) => (
            <InsightCardView key={i} card={card} />
          ))}
        </View>
      )}
    </Animated.View>
  );
}

// ─── Typing Indicator ────────────────────────────────────────────

function TypingIndicator() {
  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        marginBottom: 16,
      }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: TEXT_TERTIARY,
            opacity: 0.5 + i * 0.2,
          }}
        />
      ))}
    </Animated.View>
  );
}

// ─── Thread Row (for history sheet) ──────────────────────────────

function ThreadRow({ conv, onPress }: { conv: AIConversation; onPress: () => void }) {
  const timeAgo = formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true });
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
      }}>
      <Text
        numberOfLines={1}
        style={{ fontFamily: 'SFMono-Medium', fontSize: 15, color: TEXT_PRIMARY }}>
        {conv.title}
      </Text>
      <Text
        style={{ fontFamily: 'SFMono-Regular', fontSize: 12, color: TEXT_TERTIARY, marginTop: 4 }}>
        {timeAgo}
      </Text>
    </Pressable>
  );
}

// ─── Input Bar ───────────────────────────────────────────────────

function InputBar({
  onSend,
  isStreaming,
  placeholder,
}: {
  onSend: (msg: string) => void;
  isStreaming: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const sendScale = useSharedValue(1);
  const hasText = text.trim().length > 0;

  const sendStyle = useAnimatedStyle(() => ({ transform: [{ scale: sendScale.value }] }));

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View
      style={{
        backgroundColor: SURFACE,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: BORDER,
        marginHorizontal: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
      }}>
      <TextInput
        ref={inputRef}
        value={text}
        onChangeText={setText}
        placeholder={placeholder ?? 'Ask anything...'}
        placeholderTextColor={TEXT_TERTIARY}
        multiline
        maxLength={4000}
        style={{
          fontFamily: 'SFMono-Regular',
          fontSize: 16,
          color: TEXT_PRIMARY,
          maxHeight: 120,
          paddingVertical: 8,
        }}
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingTop: 4,
        }}>
        <Animated.View style={sendStyle}>
          <Pressable
            onPress={handleSend}
            onPressIn={() => {
              sendScale.value = withSpring(0.9, { damping: 15 });
            }}
            onPressOut={() => {
              sendScale.value = withSpring(1, { damping: 15 });
            }}
            disabled={!hasText || isStreaming}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: hasText ? ACCENT : '#E8E8E6',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text style={{ color: hasText ? '#FFF' : TEXT_TERTIARY, fontSize: 18, marginTop: -1 }}>
              ↑
            </Text>
          </Pressable>
        </Animated.View>
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

  const {
    conversations,
    conversationsLoading,
    activeConversationId,
    messages,
    isStreaming,
    cards,
    suggestions,
    sendMessage,
    selectConversation,
    createConversation,
    clearActiveConversation,
    deleteConversation,
    close,
  } = useAIChatStore();

  useEffect(() => {
    if ((messages ?? []).length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [(messages ?? []).length, isStreaming]);

  const handleSend = useCallback(
    async (msg: string) => {
      if (!activeConversationId) {
        await createConversation(msg.slice(0, 50));
      }
      sendMessage(msg);
    },
    [activeConversationId, createConversation, sendMessage]
  );

  const handleBack = useCallback(() => {
    if (showThreads) {
      setShowThreads(false);
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
  }, [clearActiveConversation]);

  const handleSelectThread = useCallback(
    (id: string) => {
      selectConversation(id);
      setShowThreads(false);
    },
    [selectConversation]
  );

  // ── Active Chat View ───────────────────────────────────────────

  if (activeConversationId || (messages ?? []).length > 0) {
    return (
      <View style={{ flex: 1, backgroundColor: BG }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: insets.top + 8,
              paddingHorizontal: 16,
              paddingBottom: 12,
            }}>
            <Pressable onPress={handleBack} hitSlop={12} style={{ padding: 8 }}>
              <Text style={{ fontSize: 20, color: TEXT_PRIMARY }}>←</Text>
            </Pressable>
            <Text style={{ fontFamily: 'SFMono-Medium', fontSize: 14, color: TEXT_SECONDARY }}>
              Thread
            </Text>
            <Pressable onPress={handleNewThread} hitSlop={12} style={{ padding: 8 }}>
              <Text style={{ fontFamily: 'SFMono-Regular', fontSize: 20, color: TEXT_PRIMARY }}>
                +
              </Text>
            </Pressable>
          </View>

          {/* Messages */}
          <FlatList
            ref={scrollRef}
            data={messages ?? []}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 }}
            renderItem={({ item, index }) => (
              <ChatBubble
                msg={item}
                cards={
                  index === (messages ?? []).length - 1 && item.role === 'assistant'
                    ? cards
                    : undefined
                }
              />
            )}
            ListFooterComponent={isStreaming ? <TypingIndicator /> : null}
            showsVerticalScrollIndicator={false}
          />

          {/* Input */}
          <View style={{ paddingBottom: insets.bottom + 8 }}>
            <InputBar
              onSend={handleSend}
              isStreaming={isStreaming}
              placeholder="Ask a follow up..."
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ── Threads List ───────────────────────────────────────────────

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
          <Text style={{ fontFamily: 'SFMono-Medium', fontSize: 14, color: TEXT_SECONDARY }}>
            Threads
          </Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {(conversations ?? []).length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <Text style={{ fontFamily: 'SFMono-Regular', fontSize: 14, color: TEXT_TERTIARY }}>
                No threads yet
              </Text>
            </View>
          ) : (
            (conversations ?? []).map((conv) => (
              <ThreadRow key={conv.id} conv={conv} onPress={() => handleSelectThread(conv.id)} />
            ))
          )}
        </ScrollView>
      </Animated.View>
    );
  }

  // ── Home State (Perplexity-inspired) ───────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        {/* Top bar — close + threads */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: insets.top + 8,
            paddingHorizontal: 16,
          }}>
          <Pressable
            onPress={() => {
              close();
              router.back();
            }}
            hitSlop={12}
            style={{ padding: 8 }}>
            <Text style={{ fontSize: 20, color: TEXT_PRIMARY }}>✕</Text>
          </Pressable>
          <Pressable onPress={() => setShowThreads(true)} hitSlop={12} style={{ padding: 8 }}>
            <Text style={{ fontFamily: 'SFMono-Regular', fontSize: 18, color: TEXT_PRIMARY }}>
              ☰
            </Text>
          </Pressable>
        </View>

        {/* Center — brand mark + wordmark */}
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 }}>
          <Text style={{ fontSize: 32, color: ACCENT, marginBottom: 12 }}>✦</Text>
          <Text
            style={{
              fontFamily: 'SFMono-Bold',
              fontSize: 28,
              color: TEXT_PRIMARY,
              letterSpacing: -0.5,
            }}>
            rail ai
          </Text>
        </View>

        {/* Bottom — suggestions + input */}
        <View style={{ paddingBottom: insets.bottom + 8 }}>
          {(suggestions ?? []).length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}>
              {(suggestions ?? []).slice(0, 4).map((s, i) => (
                <Pressable
                  key={i}
                  onPress={() => handleSend(s)}
                  style={{
                    backgroundColor: SURFACE,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: BORDER,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                  }}>
                  <Text
                    style={{ fontFamily: 'SFMono-Regular', fontSize: 13, color: TEXT_SECONDARY }}>
                    {s}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
          <InputBar onSend={handleSend} isStreaming={isStreaming} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
