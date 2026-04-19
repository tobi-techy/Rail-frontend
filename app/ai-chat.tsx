import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAIChatStore } from '@/stores/aiChatStore';
import { useAIHaptics } from '@/hooks/useAIHaptics';
import { ChatBubble, InputBar, ThreadRow } from '@/components/ai';
import { ActionConfirmSheet } from '@/components/ai/ActionConfirmSheet';
import { ActionSheet } from '@/components/sheets/ActionSheet';
import type { AIMessage, PendingAction } from '@/api/types/ai';
import { aiService } from '@/api/services/ai.service';
import { useSubscription } from '@/api/hooks/useGameplay';
import { Camera01Icon, Image01Icon } from '@hugeicons/core-free-icons';

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
      <Text style={{ fontFamily: 'SFMono-Medium', fontSize: 12, color: ACCENT, letterSpacing: 0.5, marginRight: 8 }}>MIRIAM</Text>
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
          <Text style={{ fontFamily: 'SFProDisplay-Regular', fontSize: 15, color: TEXT_SECONDARY }}>{s}</Text>
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
    sendMessage,
    selectConversation,
    createConversation,
    deleteConversation,
    clearActiveConversation,
    clearPendingAction,
    close,
  } = useAIChatStore();

  // Auto-scroll on new messages
  useEffect(() => {
    if ((messages ?? []).length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [(messages ?? []).length, isStreaming]);

  const handleSend = useCallback(
    async (msg: string, image?: { uri: string; base64: string }) => {
      // Image analysis flow
      if (image) {
        const userMsg: AIMessage = {
          role: 'user',
          content: msg ? `📸 ${msg}` : '📸 [Receipt image attached]',
          created_at: new Date().toISOString(),
        };
        useAIChatStore.setState((s) => ({
          messages: [...s.messages, userMsg],
          isStreaming: true,
        }));
        setAttachedImage(null);
        try {
          const res = await aiService.analyzeImage(image.base64, msg || 'Analyze this receipt and extract the transaction details.');
          const assistantMsg: AIMessage = {
            role: 'assistant',
            content: res.data.content,
            created_at: new Date().toISOString(),
          };
          useAIChatStore.setState((s) => ({
            messages: [...s.messages, assistantMsg],
            cards: res.data.cards ?? [],
            isStreaming: false,
          }));
        } catch {
          const errorMsg: AIMessage = {
            role: 'assistant',
            content: "I couldn't analyze that image — try again with a clearer photo 📸",
            created_at: new Date().toISOString(),
          };
          useAIChatStore.setState((s) => ({
            messages: [...s.messages, errorMsg],
            isStreaming: false,
          }));
        }
        return;
      }

      // Text-only flow
      let convId = activeConversationId;
      if (!convId) convId = await createConversation(msg.slice(0, 50));
      sendMessage(msg, convId);
      setEditText('');
    },
    [activeConversationId, createConversation, sendMessage]
  );

  const handleActionConfirmed = useCallback(
    (action: PendingAction) => {
      clearPendingAction();
      const confirmMsg: AIMessage = { role: 'assistant', content: `✅ Done — ${action.description}`, created_at: new Date().toISOString() };
      useAIChatStore.setState((s) => ({ messages: [...s.messages, confirmMsg] }));
    },
    [clearPendingAction]
  );

  const handleActionCancelled = useCallback(() => {
    clearPendingAction();
    const cancelMsg: AIMessage = { role: 'assistant', content: 'No worries — action cancelled.', created_at: new Date().toISOString() };
    useAIChatStore.setState((s) => ({ messages: [...s.messages, cancelMsg] }));
  }, [clearPendingAction]);

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

  const [editText, setEditText] = useState('');

  const handleEdit = useCallback((content: string) => {
    setEditText(content);
  }, []);

  const handleMicPress = useCallback(() => {
    if (!isPro) {
      router.push('/subscription');
      return;
    }
    router.push('/voice-mode');
  }, [router, isPro]);

  const [attachedImage, setAttachedImage] = useState<{ uri: string; base64: string } | null>(null);
  const [showImageSheet, setShowImageSheet] = useState(false);

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

  const handleImagePress = useCallback(() => {
    if (!isPro) {
      router.push('/subscription');
      return;
    }
    setShowImageSheet(true);
  }, [isPro, router]);

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
          onEdit={handleEdit}
        />
      );
    },
    [messages, cards, handleEdit]
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
                MIRIAM
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
                {overCeiling && (
                  <View style={{ backgroundColor: '#FFF7ED', borderRadius: 12, padding: 12, marginTop: 8 }}>
                    <Text style={{ fontFamily: 'SFProDisplay-Medium', fontSize: 13, color: '#92400E', textAlign: 'center' }}>
                      You&apos;ve reached your monthly AI limit. Miriam will be back at full power next month 💡
                    </Text>
                  </View>
                )}
              </>
            }
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          />

          {/* Input */}
          <View style={{ paddingBottom: insets.bottom + 8 }}>
            <InputBar onSend={handleSend} onMicPress={handleMicPress} onImagePress={handleImagePress} isStreaming={isStreaming} placeholder="Ask a follow up..." initialValue={editText} attachedImage={attachedImage} onClearImage={() => setAttachedImage(null)} />
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
            miriam
          </Text>
          <Text style={{ fontFamily: 'SFProDisplay-Regular', fontSize: 14, color: TEXT_TERTIARY, marginTop: 6 }}>
            Your financial companion
          </Text>
        </View>

        {/* Bottom: suggestions + input */}
        <View style={{ paddingBottom: insets.bottom + 8 }}>
          <SuggestionChips suggestions={suggestions ?? []} onPress={handleSend} />
          <InputBar onSend={handleSend} onMicPress={handleMicPress} onImagePress={handleImagePress} isStreaming={isStreaming} attachedImage={attachedImage} onClearImage={() => setAttachedImage(null)} />
        </View>
      </KeyboardAvoidingView>

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
