import type { StateCreator } from 'zustand';
import { aiService } from '@/api/services/ai.service';
import type { AIMessage, InsightCard, PendingAction, ToneMode } from '@/api/types/ai';
import type { AIChatStore } from './types';

export const createStreamingSlice: StateCreator<AIChatStore, [], [], Pick<AIChatStore, 'sendMessage' | 'sendImage' | 'stopStreaming' | 'retryLastMessage' | 'deleteMessage' | 'retryFromMessage' | 'processQueue'>> = (set, get) => ({
  stopStreaming: () => {
    const { streamAbortController } = get();
    if (streamAbortController) {
      streamAbortController.abort();
      set({ streamAbortController: null, isStreaming: false, connectionStatus: 'online' });
    }
  },

  retryLastMessage: () => {
    const { messages, retryCount } = get();
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        const trimmedMessages = messages.slice(0, i + 1);
        set({ messages: trimmedMessages, lastError: null, retryCount: retryCount + 1 });
        void get().sendMessage(messages[i].content);
        return;
      }
    }
  },

  deleteMessage: ({ id, index }) => {
    const { messages, isStreaming } = get();
    if (isStreaming) return;
    const targetIndex =
      typeof id === 'string'
        ? messages.findIndex((m) => m.id === id)
        : typeof index === 'number' ? index : -1;
    if (targetIndex < 0 || targetIndex >= messages.length) return;
    const next = messages.filter((_, i) => i !== targetIndex);
    const removedWasLast = targetIndex === messages.length - 1;
    set({ messages: next, ...(removedWasLast ? { cards: [], lastError: null } : {}) });
  },

  retryFromMessage: ({ id, index }) => {
    const { messages, retryCount, isStreaming } = get();
    if (isStreaming) return;
    const targetIndex =
      typeof id === 'string'
        ? messages.findIndex((m) => m.id === id)
        : typeof index === 'number' ? index : -1;
    if (targetIndex < 0 || targetIndex >= messages.length) return;
    let userIndex = targetIndex;
    while (userIndex >= 0 && messages[userIndex].role !== 'user') userIndex -= 1;
    if (userIndex < 0) return;
    const userContent = messages[userIndex].content;
    set({ messages: messages.slice(0, userIndex + 1), cards: [], lastError: null, retryCount: retryCount + 1 });
    void get().sendMessage(userContent);
  },

  sendMessage: async (message: string, conversationId?: string, options?: { toneMode?: ToneMode }) => {
    const state = get();
    const toneMode = options?.toneMode ?? state.tonePreference;

    if (state.isStreaming) {
      set({ messageQueue: [...state.messageQueue, { message, toneMode }] });
      return;
    }

    const convId = conversationId ?? state.activeConversationId;
    const userMsg: AIMessage = { role: 'user', content: message, created_at: new Date().toISOString() };

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

    let accumulated = '';
    let finalCards: InsightCard[] = [];
    let finalPending: PendingAction | null = null;
    let hitCeiling = false;
    let resolvedConvId = convId;
    let receivedAnyEvent = false;

    const controller = aiService.streamChat(
      { message, tone_mode: toneMode, ...(convId ? { conversation_id: convId } : {}) },
      (event) => {
        receivedAnyEvent = true;
        switch (event.type) {
          case 'token':
            accumulated += event.content;
            set({ streamedContent: accumulated, streamingPhase: 'Writing...' });
            break;
          case 'tool_result':
            set({ streamingPhase: `Using ${event.data.tool.replace(/_/g, ' ')}...` });
            break;
          case 'cards':
            finalCards = event.data;
            set({ cards: event.data });
            break;
          case 'action_chips':
            set({ actionChips: event.data });
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
        const content = accumulated || (receivedAnyEvent ? '' : "I'm having a moment — try again in a few seconds");
        const assistantMsg: AIMessage = {
          role: 'assistant',
          content,
          metadata: { cards: finalCards },
          created_at: new Date().toISOString(),
        };
        set((s) => ({
          messages: content ? [...s.messages, assistantMsg] : s.messages,
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
        if (accumulated || receivedAnyEvent) {
          const assistantMsg: AIMessage = {
            role: 'assistant',
            content: accumulated,
            metadata: { cards: finalCards },
            created_at: new Date().toISOString(),
          };
          set((s) => ({
            messages: accumulated ? [...s.messages, assistantMsg] : s.messages,
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
          return;
        }
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
      set({ messageQueue: [...state.messageQueue, { message: message ?? 'Image analysis', image: base64Image }] });
      return;
    }

    const userContent = message || 'Analyze this receipt';

    // Ensure a conversation exists before sending the image so the receipt
    // exchange is persisted and follow-up messages stay in the same thread.
    let convId = conversationId ?? state.activeConversationId;
    if (!convId) {
      try { convId = await get().createConversation(userContent.slice(0, 50)); }
      catch { /* proceed without — image still analyzed */ }
    }

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
        metadata: { cards: response.cards ?? [], tool_calls: response.tool_calls ?? [] },
        created_at: new Date().toISOString(),
      };
      // Extract receipt-specific follow-up suggestions from the response
      const receiptSuggestions: string[] = (response as any).suggestions
        ? (response as any).suggestions.map((s: any) => s.prompt ?? s.label)
        : [];
      set((s) => ({
        messages: [...s.messages, assistantMsg],
        cards: response.cards ?? [],
        pendingAction: response.pending_action ?? null,
        isStreaming: false,
        connectionStatus: 'online',
        activeConversationId: convId ?? s.activeConversationId,
        lastError: null,
        ...(receiptSuggestions.length > 0 ? { suggestions: receiptSuggestions } : {}),
      }));
      if (convId) void get().fetchConversations();
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

  processQueue: async () => {
    const { messageQueue, isStreaming } = get();
    if (isStreaming || messageQueue.length === 0) return;
    const [next, ...rest] = messageQueue;
    set({ messageQueue: rest });
    if (next.image) {
      await get().sendImage(next.image, next.message);
    } else {
      await get().sendMessage(next.message, undefined, { toneMode: next.toneMode });
    }
  },
});
