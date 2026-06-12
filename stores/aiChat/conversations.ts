import type { StateCreator } from 'zustand';
import { aiService } from '@/api/services/ai.service';
import type { InsightCard } from '@/api/types/ai';
import type { AIChatStore } from './types';

export const createConversationSlice: StateCreator<AIChatStore, [], [], Pick<AIChatStore, 'open' | 'close' | 'fetchConversations' | 'createConversation' | 'selectConversation' | 'deleteConversation' | 'clearActiveConversation' | 'setTonePreference' | 'fetchSuggestions' | 'fetchProactiveOpener' | 'dismissActionChip' | 'clearPendingAction' | 'setPendingScannedReceipt' | 'consumePendingScannedReceipt' | 'reset'>> = (set, get) => ({
  open: () => {
    set({ isOpen: true });
    get().fetchConversations();
    get().fetchSuggestions();
    get().fetchProactiveOpener();
  },

  close: () => {
    get().clearStatementPolling();
    set({ isOpen: false });
  },

  fetchConversations: async () => {
    set({ conversationsLoading: true });
    try {
      const res = await aiService.listConversations();
      const convs = res.data ?? [];
      set({ conversations: convs });

      // Auto-resume most recent conversation if chat is fresh (no active conv,
      // no pending receipt, no messages already in view). Like ChatGPT — you
      // pick up where you left off.
      const state = get();
      if (!state.activeConversationId && !state.pendingScannedReceipt && state.messages.length === 0 && convs.length > 0) {
        const recent = convs[0]; // sorted most-recent-first by backend
        void get().selectConversation(recent.id);
      }
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
      // Preserve existing messages (e.g. from receipt scan) — only clear if empty
      ...(s.messages.length === 0 ? { messages: [] } : {}),
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

  clearActiveConversation: () => {
    get().clearStatementPolling();
    set({
      activeConversationId: null,
      messages: [],
      cards: [],
      streamedContent: '',
      streamingPhase: '',
      isStatementProcessing: false,
      pendingAction: null,
      lastError: null,
      retryCount: 0,
      pendingStatementRetry: null,
      lastStatementUploadId: null,
    });
  },

  setTonePreference: (tone) => set({ tonePreference: tone }),

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

  fetchProactiveOpener: async () => {
    set({ proactiveOpenerLoading: true });
    try {
      const opener = await aiService.getProactiveOpener();
      set({ proactiveOpener: opener });
    } catch {
      set({ proactiveOpener: null });
    } finally {
      set({ proactiveOpenerLoading: false });
    }
  },

  dismissActionChip: (chipId: string) => {
    set((s) => ({ actionChips: s.actionChips.filter((c) => c.id !== chipId) }));
  },

  clearPendingAction: () => set({ pendingAction: null }),

  setPendingScannedReceipt: (receipt) => set({ pendingScannedReceipt: receipt }),

  consumePendingScannedReceipt: () => {
    const { pendingScannedReceipt } = get();
    if (pendingScannedReceipt) set({ pendingScannedReceipt: null });
    return pendingScannedReceipt;
  },

  reset: () => {
    get().clearStatementPolling();
    const { initialState } = require('./types');
    set(initialState);
  },
});
