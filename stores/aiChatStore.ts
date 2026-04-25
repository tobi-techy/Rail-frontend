import { create } from 'zustand';
import { aiService } from '@/api/services/ai.service';
import type { AIConversation, AIMessage, InsightCard, PendingAction } from '@/api/types/ai';

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
  // Screen state
  isOpen: boolean;
  // Hardening: message queue, abort control, connection status
  messageQueue: string[];
  streamAbortController: AbortController | null;
  connectionStatus: 'online' | 'offline' | 'streaming';
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
  sendMessage: (message: string, conversationId?: string) => Promise<void>;
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
  isOpen: false,
  messageQueue: [],
  streamAbortController: null,
  connectionStatus: 'online',
  lastError: null,
  retryCount: 0,
};

export const useAIChatStore = create<AIChatState & AIChatActions>()((set, get) => ({
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

  sendMessage: async (message: string, conversationId?: string) => {
    const state = get();

    // If currently streaming, queue the message instead of dropping it
    if (state.isStreaming) {
      set({ messageQueue: [...state.messageQueue, message] });
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
      connectionStatus: 'streaming',
    }));

    // Stream for both one-shot and conversation chat
    let accumulated = '';
    let finalCards: InsightCard[] = [];
    let finalPending: PendingAction | null = null;
    let hitCeiling = false;
    let resolvedConvId = convId;

    const controller = aiService.streamChat(
      { message, ...(convId ? { conversation_id: convId } : {}) },
      (event) => {
        switch (event.type) {
          case 'token':
            accumulated += event.content;
            set({ streamedContent: accumulated });
            break;
          case 'tool_result':
            // Keep Miriam typing dots visible during tool execution
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
        const content = accumulated || "I'm having a moment — try again in a few seconds 🔄";
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
            : "I'm having a moment — try again in a few seconds 🔄",
          created_at: new Date().toISOString(),
        };
        set((s) => ({
          messages: [...s.messages, errorMsg],
          isStreaming: false,
          streamedContent: '',
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
      set({ messageQueue: [...state.messageQueue, message ?? 'Image analysis'] });
      return;
    }

    const convId = conversationId ?? state.activeConversationId;
    const userContent = message ? `📸 ${message}` : '📸 Image uploaded';
    const userMsg: AIMessage = {
      role: 'user',
      content: userContent,
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
      const res = await aiService.analyzeImage(base64Image, message);
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
    await get().sendMessage(next);
  },
}));
