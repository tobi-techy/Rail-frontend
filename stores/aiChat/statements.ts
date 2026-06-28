import type { StateCreator } from 'zustand';
import { aiService } from '@/api/services/ai.service';
import { StatementActivity } from '@/utils/statementActivity';
import type { AIMessage } from '@/api/types/ai';
import type { AIChatStore } from './types';

export const createStatementSlice: StateCreator<AIChatStore, [], [], Pick<AIChatStore, 'sendStatement' | 'pollStatementStatus' | 'clearStatementPolling' | 'retryStatementUpload'>> = (set, get) => ({
  sendStatement: async (fileUri: string, bankName: string, text?: string) => {
    get().clearStatementPolling();
    set({ isStatementProcessing: true, pendingStatementRetry: { fileUri, bankName, text } });

    const label = bankName === 'auto' ? 'bank statement' : `${bankName} statement`;
    const fileName = fileUri.split('/').pop() ?? 'Statement.pdf';
    const userMsg: AIMessage = {
      role: 'user',
      content: text?.trim() ? text.trim() : `Analyse my ${label}`,
      metadata: { document_name: fileName },
      created_at: new Date().toISOString(),
    };
    set((s) => ({ messages: [...s.messages, userMsg] }));

    // Ensure a conversation exists so statement results persist and follow-ups work.
    let convId = get().activeConversationId;
    if (!convId) {
      try { convId = await get().createConversation(`${label} analysis`); }
      catch { /* proceed without — upload still works */ }
    }

    set({ isStreaming: true, streamingPhase: 'Uploading statement...', lastError: null, pendingStatementRetry: null });

    const activityFileName = fileUri.split('/').pop() ?? 'Statement.pdf';
    await StatementActivity.start(activityFileName, 'Uploading statement...');

    try {
      const res = await aiService.uploadStatement(fileUri, bankName);
      const { upload_id } = res.data;
      if (!upload_id) throw new Error('Upload succeeded but no upload ID was returned');

      set({ lastStatementUploadId: upload_id, isStreaming: false, streamedContent: '' });
      get().pollStatementStatus(upload_id);
    } catch (err: any) {
      set({ isStreaming: false, streamedContent: '', streamingPhase: '' });
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
    const existing = get().statementPollIntervalId;
    if (existing) clearInterval(existing);

    set({ streamingPhase: 'Analysing your statement...' });

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
    const maxAttempts = 999;
    const interval = setInterval(async () => {
      attempts++;

      if (PHASE_UPDATES[attempts]) {
        set({ streamingPhase: PHASE_UPDATES[attempts] });
        StatementActivity.update(PHASE_UPDATES[attempts], -1);
      }

      if (attempts > maxAttempts) {
        clearInterval(interval);
        StatementActivity.end(false);
        const timeoutMsg: AIMessage = {
          role: 'assistant',
          content: "Statement processing is taking longer than expected. You'll get a notification once it's ready — feel free to check back or try again.",
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
        const { status, transaction_count, error_message, period_start, period_end, summary } = res.data;

        if (status === 'completed') {
          clearInterval(interval);
          StatementActivity.end(true);
          set({ statementPollIntervalId: null, pendingStatementRetry: null, isStatementProcessing: false, streamingPhase: '' });

          const periodStr = period_start && period_end ? ` from ${period_start} to ${period_end}` : '';
          let content: string;
          let cards: Record<string, any>[] | undefined;

          if (summary) {
            const monthsLabel = summary.months_covered
              ? ` covering ${summary.months_covered} month${summary.months_covered > 1 ? 's' : ''}`
              : '';
            content = `Here's your **${summary.bank_name}** statement${monthsLabel}. I've saved everything — ask me anything about your spending.`;
            cards = [
              {
                type: 'statement_summary',
                title: summary.bank_name,
                data: {
                  ...summary,
                  transaction_count,
                  period_start: period_start ?? summary.period_start,
                  period_end: period_end ?? summary.period_end,
                },
              },
            ];
          } else {
            content = `I reviewed your bank statement${periodStr} and found **${transaction_count}** transactions.\n\nI've saved this data — ask me anything about your finances.`;
          }

          const completionMsg: AIMessage = {
            role: 'assistant',
            content,
            metadata: { statement_upload_id: uploadId, statement_status: 'completed', ...(cards ? { cards } : {}) },
            created_at: new Date().toISOString(),
          };
          set((s) => {
            const idx = s.messages.findLastIndex(
              (m) => m.metadata?.statement_upload_id === uploadId && m.metadata?.statement_status === 'processing'
            );
            if (idx >= 0) {
              const updated = [...s.messages];
              updated[idx] = completionMsg;
              return { messages: updated };
            }
            return { messages: [...s.messages, completionMsg] };
          });
        } else if (status === 'failed') {
          clearInterval(interval);
          StatementActivity.end(false);
          set({ statementPollIntervalId: null, isStatementProcessing: false, streamingPhase: '' });

          const failMsg: AIMessage = {
            role: 'assistant',
            content: error_message || "I couldn't process that. Please try uploading a different file.",
            metadata: { statement_upload_id: uploadId, statement_status: 'failed' },
            created_at: new Date().toISOString(),
          };
          set((s) => {
            const idx = s.messages.findLastIndex(
              (m) => m.metadata?.statement_upload_id === uploadId && m.metadata?.statement_status === 'processing'
            );
            if (idx >= 0) {
              const updated = [...s.messages];
              updated[idx] = failMsg;
              return { messages: updated };
            }
            return { messages: [...s.messages, failMsg] };
          });
        }
      } catch {
        // Silently retry on network errors
      }
    }, 10000);

    set({ statementPollIntervalId: interval });
  },

  clearStatementPolling: () => {
    const { statementPollIntervalId } = get();
    if (statementPollIntervalId) {
      clearInterval(statementPollIntervalId);
      set({ statementPollIntervalId: null, isStatementProcessing: false, streamingPhase: '' });
    }
  },

  retryStatementUpload: async () => {
    const { pendingStatementRetry } = get();
    if (!pendingStatementRetry) return;
    const { fileUri, bankName, text } = pendingStatementRetry;
    set({ pendingStatementRetry: null, isStatementProcessing: false });
    await get().sendStatement(fileUri, bankName, text);
  },
});
