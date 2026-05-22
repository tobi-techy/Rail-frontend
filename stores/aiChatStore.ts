import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { aiService } from '@/api/services/ai.service';
import type {
  AIConversation,
  AIMessage,
  InsightCard,
  PendingAction,
  ToneMode,
} from '@/api/types/ai';

type QueuedMessage = {
  message: string;
  toneMode?: ToneMode;
};

interface AIChatState {
  // Conversations list
  conversations: AIConversation[];
  conversationsLoading: boolean;
  // Active conversation
  activeConversationId: string | null;
  messages: AIMessage[];
  // Chat state
  isStreaming: boolean;
  streamedContent: string;
  cards: InsightCard[];
  suggestions: string[];
  suggestionsLoading: boolean;
  pendingAction: PendingAction | null;
  overCeiling: boolean;
  tonePreference: ToneMode;
  // Screen state
  isOpen: boolean;
  // Hardening: message queue, abort control, connection status
  messageQueue: QueuedMessage[];
  streamAbortController: AbortController | null;
  connectionStatus: 'online' | 'offline' | 'streaming';
  streamingPhase: string;
  lastError: string | null;
  retryCount: number;
}

interface AIChatActions {
  open: () => void;
  close: () => void;
  // Conversations
  fetchConversations: () => Promise<void>;
  createConversation: (title: string) => Promise<string>;
  selectConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  clearActiveConversation: () => void;
  // Chat
  setTonePreference: (tone: ToneMode) => void;
  sendMessage: (
    message: string,
    conversationId?: string,
    options?: { toneMode?: ToneMode }
  ) => Promise<void>;
  sendImage: (base64Image: string, message?: string, conversationId?: string) => Promise<void>;
  stopStreaming: () => void;
  retryLastMessage: () => void;
  fetchSuggestions: () => Promise<void>;
  clearPendingAction: () => void;
  reset: () => void;
  // Internal
  processQueue: () => Promise<void>;
}

const initialState: AIChatState = {
  conversations: [],
  conversationsLoading: false,
  activeConversationId: null,
  messages: [],
  isStreaming: false,
  streamedContent: '',
  cards: [],
  suggestions: [],
  suggestionsLoading: false,
  pendingAction: null,
  overCeiling: false,
  tonePreference: 'direct',
  isOpen: false,
  messageQueue: [],
  streamAbortController: null,
  connectionStatus: 'online',
  streamingPhase: '',
  lastError: null,
  retryCount: 0,
};

export const useAIChatStore = create<AIChatState & AIChatActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      open: () => {
        set({ isOpen: true });
        get().fetchConversations();
        get().fetchSuggestions();
      },

      close: () => set({ isOpen: false }),

      fetchConversations: async () => {
        set({ conversationsLoading: true });
        try {
          const res = await aiService.listConversations();
          set({ conversations: res.data ?? [] });
        } catch {
          // silent fail — conversations are non-critical
        } finally {
          set({ conversationsLoading: false });
        }
      },

      createConversation: async (title: string) => {
        const res = await aiService.createConversation(title);
        const conv = res.data;
        set((s) => ({
          conversations: [conv, ...s.conversations],
          activeConversationId: conv.id,
          messages: [],
        }));
        return conv.id;
      },

      selectConversation: async (id: string) => {
        set({
          activeConversationId: id,
          messages: [],
          cards: [],
          pendingAction: null,
          lastError: null,
        });
        try {
          const res = await aiService.getConversation(id);
          const msgs = res.data.messages ?? [];
          // Extract cards from the last assistant message's metadata (persisted by backend)
          let lastCards: InsightCard[] = [];
          for (let i = msgs.length - 1; i >= 0; i--) {
            const msg = msgs[i];
            if (msg?.role === 'assistant' && msg.metadata?.cards) {
              lastCards = msg.metadata.cards as InsightCard[];
              break;
            }
          }
          set({ messages: msgs, cards: lastCards });
        } catch {}
      },

      deleteConversation: async (id: string) => {
        await aiService.deleteConversation(id);
        set((s) => ({
          conversations: s.conversations.filter((c) => c.id !== id),
          ...(s.activeConversationId === id
            ? { activeConversationId: null, messages: [], cards: [] }
            : {}),
        }));
      },

      clearActiveConversation: () =>
        set({
          activeConversationId: null,
          messages: [],
          cards: [],
          streamedContent: '',
          pendingAction: null,
          lastError: null,
          retryCount: 0,
        }),

      setTonePreference: (tone) => set({ tonePreference: tone }),

      stopStreaming: () => {
        const { streamAbortController } = get();
        if (streamAbortController) {
          streamAbortController.abort();
          set({
            streamAbortController: null,
            isStreaming: false,
            connectionStatus: 'online',
          });
        }
      },

      retryLastMessage: () => {
        const { messages, retryCount } = get();
        // Find the last user message
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].role === 'user') {
            // Remove the error assistant message that followed it (if any)
            const trimmedMessages = messages.slice(0, i + 1);
            set({
              messages: trimmedMessages,
              lastError: null,
              retryCount: retryCount + 1,
            });
            void get().sendMessage(messages[i].content);
            return;
          }
        }
      },

      sendMessage: async (
        message: string,
        conversationId?: string,
        options?: { toneMode?: ToneMode }
      ) => {
        const state = get();
        const toneMode = options?.toneMode ?? state.tonePreference;

        // If currently streaming, queue the message instead of dropping it
        if (state.isStreaming) {
          set({ messageQueue: [...state.messageQueue, { message, toneMode }] });
          return;
        }

        const convId = conversationId ?? state.activeConversationId;
        const userMsg: AIMessage = {
          role: 'user',
          content: message,
          created_at: new Date().toISOString(),
        };

        set((s) => ({
          messages: [...s.messages, userMsg],
          isStreaming: true,
          streamedContent: '',
          cards: [],
          pendingAction: null,
          overCeiling: false,
          lastError: null,
          streamingPhase: 'Thinking...',
          connectionStatus: 'streaming',
        }));

        // Stream for both one-shot and conversation chat
        let accumulated = '';
        let finalCards: InsightCard[] = [];
        let finalPending: PendingAction | null = null;
        let hitCeiling = false;
        let resolvedConvId = convId;

        const controller = aiService.streamChat(
          {
            message,
            tone_mode: toneMode,
            ...(convId ? { conversation_id: convId } : {}),
          },
          (event) => {
            switch (event.type) {
              case 'token':
                accumulated += event.content;
                set({ streamedContent: accumulated, streamingPhase: 'Writing...' });
                break;
              case 'tool_result':
                // Show what tool Miriam is using
                set({ streamingPhase: `Using ${event.data.tool.replace(/_/g, ' ')}...` });
                break;
              case 'cards':
                finalCards = event.data;
                set({ cards: event.data });
                break;
              case 'pending_action':
                finalPending = event.data;
                set({ pendingAction: event.data });
                break;
              case 'done':
                if (event.data?.conversation_id) resolvedConvId = event.data.conversation_id;
                if (event.data?.over_ceiling) hitCeiling = true;
                break;
              case 'error':
                accumulated += accumulated ? '' : (event.content ?? 'Something went wrong');
                break;
            }
          },
          () => {
            const content = accumulated || "I'm having a moment — try again in a few seconds";
            const assistantMsg: AIMessage = {
              role: 'assistant',
              content,
              metadata: { cards: finalCards },
              created_at: new Date().toISOString(),
            };
            set((s) => ({
              messages: [...s.messages, assistantMsg],
              cards: finalCards,
              pendingAction: finalPending,
              isStreaming: false,
              streamedContent: '',
              streamingPhase: '',
              overCeiling: hitCeiling,
              activeConversationId: resolvedConvId ?? s.activeConversationId,
              connectionStatus: 'online',
              streamAbortController: null,
              lastError: null,
            }));
            void get().processQueue();
          },
          (err) => {
            const is404 = err?.includes('404') || err?.includes('Not Found');
            const errorMsg: AIMessage = {
              role: 'assistant',
              content: is404
                ? 'Miriam is not available right now — the AI service is being set up on the backend.'
                : "I'm having a moment — try again in a few seconds",
              created_at: new Date().toISOString(),
            };
            set((s) => ({
              messages: [...s.messages, errorMsg],
              isStreaming: false,
              streamedContent: '',
              streamingPhase: '',
              lastError: err,
              connectionStatus: 'online',
              streamAbortController: null,
            }));
            void get().processQueue();
          }
        );

        set({ streamAbortController: controller });
      },

      sendImage: async (base64Image: string, message?: string, conversationId?: string) => {
        const state = get();
        if (state.isStreaming) {
          set({ messageQueue: [...state.messageQueue, { message: message ?? 'Image analysis' }] });
          return;
        }

        const convId = conversationId ?? state.activeConversationId;
        const userContent = message || 'Analyze this receipt';

        // Truncate base64 for display (full sent to API)
        const displayUrl = `data:image/jpeg;base64,${base64Image.slice(0, 1000)}`;
        const userMsg: AIMessage = {
          role: 'user',
          content: userContent,
          image_url: `data:image/jpeg;base64,${base64Image}`,
          created_at: new Date().toISOString(),
        };

        set((s) => ({
          messages: [...s.messages, userMsg],
          isStreaming: true,
          cards: [],
          pendingAction: null,
          connectionStatus: 'streaming',
        }));

        try {
          const res = await aiService.analyzeImage(base64Image, message, convId ?? undefined);
          const response = res.data;

          const assistantMsg: AIMessage = {
            role: 'assistant',
            content: response.content,
            metadata: {
              cards: response.cards ?? [],
              tool_calls: response.tool_calls ?? [],
            },
            created_at: new Date().toISOString(),
          };

          set((s) => ({
            messages: [...s.messages, assistantMsg],
            cards: response.cards ?? [],
            pendingAction: response.pending_action ?? null,
            isStreaming: false,
            connectionStatus: 'online',
            lastError: null,
          }));

          // If this was in a conversation context, create or update conversation
          if (convId) {
            void get().fetchConversations();
          }

          void get().processQueue();
        } catch (err: any) {
          const errorMsg: AIMessage = {
            role: 'assistant',
            content: err?.message?.includes('network')
              ? 'Network issue — check your connection and try again'
              : "I couldn't analyze that image. Try again or describe it in text.",
            created_at: new Date().toISOString(),
          };
          set((s) => ({
            messages: [...s.messages, errorMsg],
            isStreaming: false,
            connectionStatus: navigator?.onLine === false ? 'offline' : 'online',
            lastError: err?.message ?? 'Image analysis failed',
          }));
          void get().processQueue();
        }
      },

      fetchSuggestions: async () => {
        set({ suggestionsLoading: true });
        try {
          const res = await aiService.getSuggestions();
          set({ suggestions: res.suggestions ?? [] });
        } catch {
          // silent fail
        } finally {
          set({ suggestionsLoading: false });
        }
      },

      clearPendingAction: () => set({ pendingAction: null }),

      reset: () => set(initialState),

      // Internal: process next queued message
      processQueue: async () => {
        const { messageQueue, isStreaming } = get();
        if (isStreaming || messageQueue.length === 0) return;

        const [next, ...rest] = messageQueue;
        set({ messageQueue: rest });
        await get().sendMessage(next.message, undefined, { toneMode: next.toneMode });
      },
    }),
    {
      name: 'ai-chat-preferences',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ tonePreference: state.tonePreference }),
    }
  )
);
