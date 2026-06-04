import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { aiService } from '@/api/services/ai.service';
import { StatementActivity } from '@/utils/statementActivity';
import type {
  AIConversation,
  AIMessage,
  InsightCard,
  PendingAction,
  ProactiveOpener,
  ActionChip,
  StatementSummary,
  ToneMode,
} from '@/api/types/ai';

type QueuedMessage = {
  message: string;
  toneMode?: ToneMode;
  image?: string;
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
  actionChips: ActionChip[];
  suggestions: string[];
  suggestionsLoading: boolean;
  pendingAction: PendingAction | null;
  overCeiling: boolean;
  tonePreference: ToneMode;
  // Proactive opener
  proactiveOpener: ProactiveOpener | null;
  proactiveOpenerLoading: boolean;
  // Screen state
  isOpen: boolean;
  // Hardening: message queue, abort control, connection status
  messageQueue: QueuedMessage[];
  streamAbortController: AbortController | null;
  connectionStatus: 'online' | 'offline' | 'streaming';
  streamingPhase: string;
  lastError: string | null;
  retryCount: number;
  // Scanned receipt bridge (set by scanner, consumed by ai-chat)
  pendingScannedReceipt: { uri: string; base64: string } | null;
  // Statement upload state
  statementPollIntervalId: ReturnType<typeof setInterval> | null;
  pendingStatementRetry: { fileUri: string; bankName: string; text?: string } | null;
  lastStatementUploadId: string | null;
  isStatementProcessing: boolean;
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
  sendStatement: (fileUri: string, bankName: string, userText?: string) => Promise<void>;
  pollStatementStatus: (uploadId: string) => void;
  stopStreaming: () => void;
  retryLastMessage: () => void;
  // Per-message actions (used by the message context menu)
  deleteMessage: (target: { id?: string; index?: number }) => void;
  retryFromMessage: (target: { id?: string; index?: number }) => void;
  fetchSuggestions: () => Promise<void>;
  fetchProactiveOpener: () => Promise<void>;
  dismissActionChip: (chipId: string) => void;
  clearPendingAction: () => void;
  reset: () => void;
  // Scanned receipt bridge
  setPendingScannedReceipt: (receipt: { uri: string; base64: string }) => void;
  consumePendingScannedReceipt: () => { uri: string; base64: string } | null;
  // Statement upload
  clearStatementPolling: () => void;
  retryStatementUpload: () => Promise<void>;
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
  actionChips: [],
  suggestions: [],
  suggestionsLoading: false,
  pendingAction: null,
  overCeiling: false,
  tonePreference: 'direct',
  proactiveOpener: null,
  proactiveOpenerLoading: false,
  isOpen: false,
  messageQueue: [],
  streamAbortController: null,
  connectionStatus: 'online',
  streamingPhase: '',
  lastError: null,
  retryCount: 0,
  pendingScannedReceipt: null,
  statementPollIntervalId: null,
  pendingStatementRetry: null,
  lastStatementUploadId: null,
  isStatementProcessing: false,
};

export const useAIChatStore = create<AIChatState & AIChatActions>()(
  persist(
    (set, get) => ({
      ...initialState,

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

      clearActiveConversation: () => {
        get().clearStatementPolling();
        set({
          activeConversationId: null,
          messages: [],
          cards: [],
          streamedContent: '',
          pendingAction: null,
          lastError: null,
          retryCount: 0,
          pendingStatementRetry: null,
          lastStatementUploadId: null,
        });
      },

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

      // Resolve a message's index from either an explicit id or a positional index.
      // Returns -1 when the target can no longer be found (e.g. list changed under us).
      deleteMessage: ({ id, index }) => {
        const { messages, isStreaming } = get();
        // Never mutate the transcript mid-stream — the streaming tail isn't in `messages` yet.
        if (isStreaming) return;
        const targetIndex =
          typeof id === 'string'
            ? messages.findIndex((m) => m.id === id)
            : typeof index === 'number'
              ? index
              : -1;
        if (targetIndex < 0 || targetIndex >= messages.length) return;

        const next = messages.filter((_, i) => i !== targetIndex);
        // If we removed the trailing assistant message, the failure banner no longer applies.
        const removedWasLast = targetIndex === messages.length - 1;
        set({
          messages: next,
          ...(removedWasLast ? { cards: [], lastError: null } : {}),
        });
      },

      retryFromMessage: ({ id, index }) => {
        const { messages, retryCount, isStreaming } = get();
        if (isStreaming) return;
        const targetIndex =
          typeof id === 'string'
            ? messages.findIndex((m) => m.id === id)
            : typeof index === 'number'
              ? index
              : -1;
        if (targetIndex < 0 || targetIndex >= messages.length) return;

        // Walk back from the target to the user turn that produced it, then resend that turn.
        // Retrying an assistant message regenerates its response; retrying a user message resends it.
        let userIndex = targetIndex;
        while (userIndex >= 0 && messages[userIndex].role !== 'user') {
          userIndex -= 1;
        }
        if (userIndex < 0) return;

        const userContent = messages[userIndex].content;
        // Drop everything after the user turn (the stale/failed response) before resending.
        set({
          messages: messages.slice(0, userIndex + 1),
          cards: [],
          lastError: null,
          retryCount: retryCount + 1,
        });
        void get().sendMessage(userContent);
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
        let receivedAnyEvent = false;

        const controller = aiService.streamChat(
          {
            message,
            tone_mode: toneMode,
            ...(convId ? { conversation_id: convId } : {}),
          },
          (event) => {
            receivedAnyEvent = true;
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
            const content =
              accumulated ||
              (receivedAnyEvent ? '' : "I'm having a moment — try again in a few seconds");
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
            // If we already accumulated content or received events, treat as success
            if (accumulated || receivedAnyEvent) {
              const content = accumulated;
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
          set({
            messageQueue: [
              ...state.messageQueue,
              { message: message ?? 'Image analysis', image: base64Image },
            ],
          });
          return;
        }

        const convId = conversationId ?? state.activeConversationId;
        const userContent = message || 'Analyze this receipt';

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

      sendStatement: async (fileUri: string, bankName: string, text?: string) => {
        // Clear any existing poll first
        get().clearStatementPolling();

        // Mark processing flow active
        set({ isStatementProcessing: true });

        // Save for potential retry
        set({ pendingStatementRetry: { fileUri, bankName, text } });

        // Add user message reflecting intent, not system status
        const label = bankName === 'auto' ? 'bank statement' : `${bankName} statement`;
        const fileName = fileUri.split('/').pop() ?? 'Statement.pdf';
        const userMsg: AIMessage = {
          role: 'user',
          content: text?.trim() ? text.trim() : `Analyse my ${label}`,
          metadata: { document_name: fileName },
          created_at: new Date().toISOString(),
        };
        set((s) => ({ messages: [...s.messages, userMsg] }));

        // Show Miriam typing dots during the upload API call
        set({
          isStreaming: true,
          streamingPhase: 'Uploading statement...',
          lastError: null,
          pendingStatementRetry: null,
        });

        // Start Live Activity so user can leave the app (awaited so end() is never called before start())
        const activityFileName = fileUri.split('/').pop() ?? 'Statement.pdf';
        await StatementActivity.start(activityFileName, 'Uploading statement...');

        try {
          const res = await aiService.uploadStatement(fileUri, bankName);
          const { upload_id } = res.data;

          if (!upload_id) {
            throw new Error('Upload succeeded but no upload ID was returned');
          }

          set({ lastStatementUploadId: upload_id });

          // Turn off streaming/typing dots
          set({
            isStreaming: false,
            streamedContent: '',
            streamingPhase: '',
          });

          const assistantMsg: AIMessage = {
            role: 'assistant',
            content: `I'm reviewing your ${label}. This usually takes a minute or two — I'll let you know when I'm done.`,
            metadata: { statement_upload_id: upload_id, statement_status: 'processing' },
            created_at: new Date().toISOString(),
          };
          set((s) => ({ messages: [...s.messages, assistantMsg] }));

          // Start polling for completion
          get().pollStatementStatus(upload_id);
        } catch (err: any) {
          set({
            isStreaming: false,
            streamedContent: '',
            streamingPhase: '',
          });

          const errMsg =
            err?.response?.data?.error?.includes?.('network') || err?.message?.includes?.('network')
              ? 'Network issue — check your connection and try again.'
              : "I couldn't process that statement. Please try a different file or upload again.";
          const errorMsg: AIMessage = {
            role: 'assistant',
            content: errMsg,
            metadata: { statement_status: 'failed' },
            created_at: new Date().toISOString(),
          };
          set((s) => ({
            messages: [...s.messages, errorMsg],
            pendingStatementRetry: { fileUri, bankName, text },
          }));
        }
      },

      pollStatementStatus: (uploadId: string) => {
        // Clear any existing interval to prevent duplicate polling
        const existing = get().statementPollIntervalId;
        if (existing) clearInterval(existing);

        // Phase messages shown at specific attempt thresholds to reduce dead-zone anxiety
        const PHASE_UPDATES: Record<number, string> = {
          6: 'Reading your transactions...',
          12: 'Categorising spending...',
          20: 'Building your financial picture...',
          30: 'Almost there...',
          45: 'Still processing — large statements take a bit longer...',
          60: 'Wrapping up...',
          80: 'Finishing analysis...',
        };

        let attempts = 0;
        const maxAttempts = 999; // Poll indefinitely until success/failure
        const interval = setInterval(async () => {
          attempts++;

          // Update streaming phase at key milestones
          if (PHASE_UPDATES[attempts]) {
            set({ streamingPhase: PHASE_UPDATES[attempts] });
            // Pass -1 (indeterminate) — attempt count doesn't reflect actual processing progress
            StatementActivity.update(PHASE_UPDATES[attempts], -1);
          }

          if (attempts > maxAttempts) {
            clearInterval(interval);
            StatementActivity.end(false);
            const timeoutMsg: AIMessage = {
              role: 'assistant',
              content:
                "Statement processing is taking longer than expected. You'll get a notification once it's ready — feel free to check back or try again.",
              metadata: { statement_upload_id: uploadId, statement_status: 'failed' },
              created_at: new Date().toISOString(),
            };
            set((s) => ({
              statementPollIntervalId: null,
              isStatementProcessing: false,
              streamingPhase: '',
              messages: [...s.messages, timeoutMsg],
            }));
            return;
          }
          try {
            const res = await aiService.getStatementStatus(uploadId);
            const { status, transaction_count, error_message, period_start, period_end, summary } =
              res.data;

            if (status === 'completed') {
              clearInterval(interval);
              StatementActivity.end(true);
              set({
                statementPollIntervalId: null,
                pendingStatementRetry: null,
                isStatementProcessing: false,
              });

              const periodStr =
                period_start && period_end ? ` from ${period_start} to ${period_end}` : '';

              let content: string;
              if (summary) {
                // Use rich summary data for an informative message
                const spending = `${summary.currency} ${summary.total_spending}`;
                const income =
                  summary.total_income !== '0'
                    ? `${summary.currency} ${summary.total_income}`
                    : null;
                const cats = summary.top_categories
                  .slice(0, 3)
                  .map((c) => `${c.category} (${summary.currency} ${c.total})`)
                  .join(', ');

                let msg = `I reviewed your ${summary.bank_name} statement covering ${summary.months_covered} month${summary.months_covered > 1 ? 's' : ''}${periodStr} and found ${transaction_count} transactions.`;
                msg += `\n\nSpending: ${spending}`;
                if (income) msg += ` | Income: ${income}`;
                if (cats) msg += `\nTop categories: ${cats}`;
                msg += `\n\nI've saved this data — ask me anything about your spending.`;
                content = msg;
              } else {
                content = `I reviewed your bank statement${periodStr} and found ${transaction_count} transactions. I've saved this data — ask me anything about your finances.`;
              }

              const completionMsg: AIMessage = {
                role: 'assistant',
                content,
                metadata: { statement_upload_id: uploadId, statement_status: 'completed' },
                created_at: new Date().toISOString(),
              };
              set((s) => ({ messages: [...s.messages, completionMsg] }));
            } else if (status === 'failed') {
              clearInterval(interval);
              StatementActivity.end(false);
              set({ statementPollIntervalId: null, isStatementProcessing: false });

              const failMsg: AIMessage = {
                role: 'assistant',
                content:
                  error_message ||
                  "I couldn't process that. Please try uploading a different file.",
                metadata: { statement_upload_id: uploadId, statement_status: 'failed' },
                created_at: new Date().toISOString(),
              };
              set((s) => ({ messages: [...s.messages, failMsg] }));
            }
          } catch {
            // Silently retry on network errors — interval handles cleanup via maxAttempts
          }
        }, 10000);

        set({ statementPollIntervalId: interval });
      },

      clearStatementPolling: () => {
        const { statementPollIntervalId } = get();
        if (statementPollIntervalId) {
          clearInterval(statementPollIntervalId);
          set({ statementPollIntervalId: null, isStatementProcessing: false });
        }
      },

      retryStatementUpload: async () => {
        const { pendingStatementRetry } = get();
        if (!pendingStatementRetry) return;
        const { fileUri, bankName, text } = pendingStatementRetry;
        set({ pendingStatementRetry: null, isStatementProcessing: false });
        await get().sendStatement(fileUri, bankName, text);
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
        set((s) => ({
          actionChips: s.actionChips.filter((c) => c.id !== chipId),
        }));
      },

      clearPendingAction: () => set({ pendingAction: null }),

      setPendingScannedReceipt: (receipt) => set({ pendingScannedReceipt: receipt }),

      consumePendingScannedReceipt: () => {
        const { pendingScannedReceipt } = get();
        if (pendingScannedReceipt) {
          set({ pendingScannedReceipt: null });
        }
        return pendingScannedReceipt;
      },

      reset: () => {
        get().clearStatementPolling();
        set(initialState);
      },

      // Internal: process next queued message
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
    }),
    {
      name: 'ai-chat-preferences',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ tonePreference: state.tonePreference }),
    }
  )
);
