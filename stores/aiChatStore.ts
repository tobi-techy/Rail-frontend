import { create } from 'zustand';
import { aiService } from '@/api/services/ai.service';
import type { AIConversation, AIMessage, AIChatResponse, InsightCard } from '@/api/types/ai';

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
  // Screen state
  isOpen: boolean;
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
  sendMessage: (message: string) => Promise<void>;
  fetchSuggestions: () => Promise<void>;
  reset: () => void;
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
  isOpen: false,
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
    set({ activeConversationId: id, messages: [], cards: [] });
    try {
      const res = await aiService.getConversation(id);
      set({ messages: res.data.messages ?? [] });
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
    set({ activeConversationId: null, messages: [], cards: [], streamedContent: '' }),

  sendMessage: async (message: string) => {
    const { activeConversationId } = get();
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
    }));

    try {
      let response: AIChatResponse;
      if (activeConversationId) {
        const res = await aiService.chatInConversation(activeConversationId, message);
        response = res.data;
      } else {
        response = await aiService.chat({ message });
      }

      const assistantMsg: AIMessage = {
        role: 'assistant',
        content: response.content,
        created_at: new Date().toISOString(),
      };
      set((s) => ({
        messages: [...s.messages, assistantMsg],
        cards: response.cards ?? [],
        isStreaming: false,
      }));
    } catch {
      const errorMsg: AIMessage = {
        role: 'assistant',
        content: "I'm having a moment — try again in a few seconds 🔄",
        created_at: new Date().toISOString(),
      };
      set((s) => ({ messages: [...s.messages, errorMsg], isStreaming: false }));
    }
  },

  fetchSuggestions: async () => {
    set({ suggestionsLoading: true });
    try {
      const res = await aiService.getSuggestions();
      set({ suggestions: res.suggestions ?? [] });
    } catch {
    } finally {
      set({ suggestionsLoading: false });
    }
  },

  reset: () => set(initialState),
}));
