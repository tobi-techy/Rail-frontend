import type {
  AIConversation,
  AIMessage,
  InsightCard,
  PendingAction,
  ProactiveOpener,
  ActionChip,
  ToneMode,
} from '@/api/types/ai';

export type QueuedMessage = {
  message: string;
  toneMode?: ToneMode;
  image?: string;
};

export interface AIChatState {
  conversations: AIConversation[];
  conversationsLoading: boolean;
  activeConversationId: string | null;
  messages: AIMessage[];
  isStreaming: boolean;
  streamedContent: string;
  cards: InsightCard[];
  actionChips: ActionChip[];
  suggestions: string[];
  suggestionsLoading: boolean;
  pendingAction: PendingAction | null;
  overCeiling: boolean;
  tonePreference: ToneMode;
  proactiveOpener: ProactiveOpener | null;
  proactiveOpenerLoading: boolean;
  isOpen: boolean;
  messageQueue: QueuedMessage[];
  streamAbortController: AbortController | null;
  connectionStatus: 'online' | 'offline' | 'streaming';
  streamingPhase: string;
  lastError: string | null;
  retryCount: number;
  pendingScannedReceipt: { uri: string; base64: string } | null;
  statementPollIntervalId: ReturnType<typeof setInterval> | null;
  pendingStatementRetry: { fileUri: string; bankName: string; text?: string } | null;
  lastStatementUploadId: string | null;
  isStatementProcessing: boolean;
}

export interface AIChatActions {
  open: () => void;
  close: () => void;
  fetchConversations: () => Promise<void>;
  createConversation: (title: string) => Promise<string>;
  selectConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  clearActiveConversation: () => void;
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
  deleteMessage: (target: { id?: string; index?: number }) => void;
  retryFromMessage: (target: { id?: string; index?: number }) => void;
  fetchSuggestions: () => Promise<void>;
  fetchProactiveOpener: () => Promise<void>;
  dismissActionChip: (chipId: string) => void;
  clearPendingAction: () => void;
  reset: () => void;
  setPendingScannedReceipt: (receipt: { uri: string; base64: string }) => void;
  consumePendingScannedReceipt: () => { uri: string; base64: string } | null;
  clearStatementPolling: () => void;
  retryStatementUpload: () => Promise<void>;
  processQueue: () => Promise<void>;
}

export type AIChatStore = AIChatState & AIChatActions;

export const initialState: AIChatState = {
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
