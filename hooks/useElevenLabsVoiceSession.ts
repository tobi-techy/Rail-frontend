import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useConversation, ConversationProvider } from '@elevenlabs/react-native';
import NetInfo from '@react-native-community/netinfo';
import { aiService } from '@/api/services/ai.service';
import { logger } from '@/lib/logger';
import { safeError, sanitizeForLog } from '@/utils/logSanitizer';

export type VoiceState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'interrupted'
  | 'error';

const VOICE_TOOLS = [
  'transfer_funds',
  'initiate_withdrawal',
  'get_account_summary',
  'set_savings_goal',
  'create_automation',
  'create_obligation_reminder',
  'get_money_flow',
  'get_withdrawal_history',
  'get_deposit_history',
  'get_financial_health',
  'get_financial_audit',
] as const;

const INITIAL_TOOL_RESULT = JSON.stringify({
  error: "That didn't work from voice. Try again in a moment.",
});
const CONNECT_TIMEOUT_MS = 30_000;
const RECONNECT_DELAYS_MS = [2_000, 4_000, 8_000, 16_000, 32_000];
const MAX_RECONNECT_ATTEMPTS = 4;
const KEEPALIVE_INTERVAL_MS = 30_000;
const INSIGHT_POLL_INTERVAL_MS = 60_000;

type ToolErrorStrategy = 'transient' | 'fatal';

function classifyError(message: string): ToolErrorStrategy {
  const fatalPatterns = [
    'unauthorized',
    'forbidden',
    'not found',
    'invalid agent',
    'configuration',
    'api key',
  ];
  if (fatalPatterns.some((p) => message.toLowerCase().includes(p))) return 'fatal';
  return 'transient';
}

function safeVoiceErrorMessage(err: unknown) {
  if (err instanceof Error && err.message) return sanitizeForLog(err.message);
  if (typeof err === 'string') return sanitizeForLog(err);
  return 'Unknown voice error';
}

function useElevenLabsConversation() {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [responseText, setResponseText] = useState('');
  const [error, setError] = useState('');
  const [inputVolume, setInputVolume] = useState(0);
  const [outputVolume, setOutputVolume] = useState(0);
  const stateRef = useRef<VoiceState>('idle');
  const userRequestedDisconnectRef = useRef(false);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keepaliveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const insightTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectedRef = useRef(false);
  const connectingRef = useRef(false);
  const conversationRef = useRef<ReturnType<typeof useConversation> | null>(null);

  const setVoiceState = useCallback((s: VoiceState) => {
    stateRef.current = s;
    setState(s);
  }, []);

  const clearTimers = useCallback(() => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (keepaliveTimerRef.current) {
      clearInterval(keepaliveTimerRef.current);
      keepaliveTimerRef.current = null;
    }
    if (insightTimerRef.current) {
      clearInterval(insightTimerRef.current);
      insightTimerRef.current = null;
    }
  }, []);

  const clientTools = useMemo(() => {
    const tools: Record<string, (params: Record<string, unknown>) => Promise<string>> = {};
    for (const toolName of VOICE_TOOLS) {
      tools[toolName] = async (params: Record<string, unknown>) => {
        try {
          const result = await aiService.executeVoiceTool({
            tool_name: toolName,
            parameters: params,
          });
          return JSON.stringify(result.result ?? result);
        } catch (err) {
          safeError(`[ELVoice] Tool ${toolName} failed`, err);
          return INITIAL_TOOL_RESULT;
        }
      };
    }
    return tools;
  }, []);

  const attemptReconnect = useCallback(() => {
    if (userRequestedDisconnectRef.current) return;
    if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
      logger.error('[ELVoice] Max reconnection attempts reached');
      setError('Connection lost. Please try again.');
      setVoiceState('error');
      connectingRef.current = false;
      return;
    }
    const conv = conversationRef.current;
    if (!conv) return;
    const attempt = reconnectAttemptRef.current;
    reconnectAttemptRef.current = attempt + 1;
    const delay =
      RECONNECT_DELAYS_MS[attempt] || RECONNECT_DELAYS_MS[RECONNECT_DELAYS_MS.length - 1];
    logger.info('[ELVoice] Reconnecting in ' + delay + 'ms (attempt ' + (attempt + 1) + ')');
    setVoiceState('connecting');
    reconnectTimerRef.current = setTimeout(async () => {
      // Check network before attempting reconnect
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        logger.warn('[ELVoice] No network, waiting for connectivity');
        setError('No internet connection. Reconnecting when online...');
        setVoiceState('error');
        connectingRef.current = false;
        // Wait for network to come back, then retry
        const unsub = NetInfo.addEventListener((s) => {
          if (s.isConnected) {
            unsub();
            reconnectAttemptRef.current = 0;
            connectingRef.current = false;
            attemptReconnect();
          }
        });
        return;
      }
      try {
        const { signed_url, agent_id, dynamic_variables } = await aiService.getVoiceSignedUrl();
        conv.startSession({
          ...(signed_url ? { signedUrl: signed_url } : { agentId: agent_id }),
          connectionType: 'webrtc',
          overrides: {
            tts: { stability: 0.75, similarityBoost: 0.85, speed: 1.0 },
          },
          dynamicVariables: { ...dynamic_variables, supports_pidgin: true },
        });
      } catch (err) {
        const msg = safeVoiceErrorMessage(err);
        logger.error('[ELVoice] Reconnect failed', { error: msg, attempt: attempt + 1 });
        attemptReconnect();
      }
    }, delay);
  }, [setVoiceState]);

  const conversation = useConversation({
    clientTools,
    onConnect: () => {
      logger.info('[ELVoice] Session connected');
      connectedRef.current = true;
      connectingRef.current = false;
      reconnectAttemptRef.current = 0;
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = null;
      }
      setVoiceState('listening');

      // Start keepalive
      if (keepaliveTimerRef.current) clearInterval(keepaliveTimerRef.current);
      keepaliveTimerRef.current = setInterval(() => {
        try {
          conversation.sendUserActivity();
        } catch {}
      }, KEEPALIVE_INTERVAL_MS);

      // Start proactive insight polling
      if (insightTimerRef.current) clearInterval(insightTimerRef.current);
      const poll = async () => {
        try {
          const { insight } = await aiService.getProactiveInsight();
          if (insight && connectedRef.current) {
            conversation.sendContextualUpdate(insight);
          }
        } catch {}
      };
      setTimeout(poll, 5_000);
      insightTimerRef.current = setInterval(poll, INSIGHT_POLL_INTERVAL_MS);
    },
    onDisconnect: () => {
      logger.info('[ELVoice] Session disconnected');
      connectedRef.current = false;
      clearTimers();
      setTranscript('');
      setResponseText('');
      setInputVolume(0);
      setOutputVolume(0);
      if (userRequestedDisconnectRef.current) {
        setVoiceState('idle');
      } else {
        attemptReconnect();
      }
    },
    onError: (message: string) => {
      const severity = classifyError(message);
      logger.error('[ELVoice] Session error', {
        component: 'useElevenLabsVoiceSession',
        action: 'session-error',
        error: message,
        severity,
      });
      clearTimers();
      connectedRef.current = false;
      connectingRef.current = false;
      setError(message);
      setVoiceState('error');
    },
    onMessage: (msg: { message: string; source: 'user' | 'ai' }) => {
      if (msg.source === 'user') {
        setTranscript(msg.message);
        setVoiceState('thinking');
      } else {
        setResponseText(msg.message);
        setVoiceState('speaking');
      }
    },
    onModeChange: ({ mode }: { mode: 'speaking' | 'listening' }) => {
      if (mode === 'speaking') {
        if (stateRef.current !== 'error') setVoiceState('speaking');
      } else {
        if (stateRef.current === 'speaking') setVoiceState('listening');
      }
    },
    onStatusChange: ({ status }: { status: string }) => {
      switch (status) {
        case 'connecting':
          setVoiceState('connecting');
          break;
        case 'connected':
          if (!connectedRef.current) {
            connectedRef.current = true;
            reconnectAttemptRef.current = 0;
          }
          setVoiceState('listening');
          break;
        case 'disconnecting':
          break;
        case 'disconnected':
          connectedRef.current = false;
          break;
      }
    },
    onInterruption: () => {
      logger.info('[ELVoice] Interruption detected');
      setVoiceState('interrupted');
      setResponseText('');
    },
  });

  conversationRef.current = conversation;

  const connect = useCallback(async () => {
    if (connectingRef.current || connectedRef.current) return;
    connectingRef.current = true;
    userRequestedDisconnectRef.current = false;
    reconnectAttemptRef.current = 0;
    connectedRef.current = false;
    clearTimers();
    setVoiceState('connecting');
    setError('');
    setTranscript('');
    setResponseText('');

    try {
      const { signed_url, agent_id, dynamic_variables } = await aiService.getVoiceSignedUrl();
      conversation.startSession({
        ...(signed_url ? { signedUrl: signed_url } : { agentId: agent_id }),
        connectionType: 'webrtc',
        overrides: {
          tts: { stability: 0.75, similarityBoost: 0.85, speed: 1.0 },
        },
        dynamicVariables: { ...dynamic_variables, supports_pidgin: true },
      });
      connectTimeoutRef.current = setTimeout(() => {
        if (!connectedRef.current) {
          logger.error('[ELVoice] Connection timeout');
          setError('Voice connection timed out. Please try again.');
          setVoiceState('error');
          connectingRef.current = false;
          try {
            conversation.endSession();
          } catch {}
        }
      }, CONNECT_TIMEOUT_MS);
    } catch (err) {
      const msg = safeVoiceErrorMessage(err);
      logger.error('[ELVoice] Failed to start session', {
        component: 'useElevenLabsVoiceSession',
        action: 'connect-failed',
        error: msg,
      });
      setError(msg || 'Failed to start voice session');
      setVoiceState('error');
      connectingRef.current = false;
    }
  }, [conversation, clearTimers, setVoiceState]);

  const disconnect = useCallback(() => {
    userRequestedDisconnectRef.current = true;
    connectedRef.current = false;
    connectingRef.current = false;
    clearTimers();
    try {
      conversation.endSession();
    } catch (err) {
      safeError('[ELVoice] End session error', err);
    }
    setVoiceState('idle');
    setTranscript('');
    setResponseText('');
    setError('');
    setInputVolume(0);
    setOutputVolume(0);
  }, [conversation, clearTimers, setVoiceState]);

  // Poll volume levels periodically
  useEffect(() => {
    if (state === 'idle' || state === 'error') return;
    const iv = setInterval(() => {
      try {
        setInputVolume(conversation.getInputVolume());
        setOutputVolume(conversation.getOutputVolume());
      } catch {}
    }, 250);
    return () => clearInterval(iv);
  }, [state, conversation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
      connectedRef.current = false;
      try {
        conversation.endSession();
      } catch {}
    };
  }, [conversation, clearTimers]);

  return {
    state,
    transcript,
    responseText,
    error,
    inputVolume,
    outputVolume,
    connect,
    disconnect,
    isActive: state !== 'idle' && state !== 'error',
  };
}

export { ConversationProvider };
export default useElevenLabsConversation;
