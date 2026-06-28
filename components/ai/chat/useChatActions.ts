import { useCallback, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { useAIChatStore } from '@/stores/aiChatStore';
import { playChatSound } from '@/lib/chatSounds';
import { ANALYTICS_EVENTS, useAnalytics } from '@/utils/analytics';
import type { ToneMode } from '@/api/types/ai';
import type { AgentAction } from './constants';
import type { AttachedImage } from './useImagePickers';

function inferToneMode(prompt: string): ToneMode | undefined {
  const n = prompt.toLowerCase();
  if (
    n.includes('audit') ||
    n.includes('hard mode') ||
    n.includes('roast') ||
    n.includes('no sugar') ||
    n.includes('reality check')
  )
    return 'hard';
  return undefined;
}

export function useChatActions(deps: {
  clearImage: () => void;
  activeAgentAction: AgentAction | null;
  setActiveAgentAction: (a: AgentAction | null) => void;
  setAgentMode: (v: boolean | ((p: boolean) => boolean)) => void;
  setEditText: (v: string) => void;
}) {
  const { clearImage, setActiveAgentAction, setAgentMode, setEditText } = deps;
  const { track } = useAnalytics();

  // Ref to always read the latest agent action without stale closures
  const agentActionRef = useRef(deps.activeAgentAction);
  agentActionRef.current = deps.activeAgentAction;

  const activeConversationId = useAIChatStore((s) => s.activeConversationId);
  const sendMessage = useAIChatStore((s) => s.sendMessage);
  const sendImage = useAIChatStore((s) => s.sendImage);
  const setTonePreference = useAIChatStore((s) => s.setTonePreference);
  const sendStatement = useAIChatStore((s) => s.sendStatement);

  const [attachedDocument, setAttachedDocument] = useState<{
    uri: string;
    name: string;
    size?: number;
  } | null>(null);

  const handleSend = useCallback(
    async (
      msg: string,
      image?: AttachedImage,
      source: 'prompt' | 'agent_mode' | 'preloaded' = 'prompt'
    ) => {
      const currentAction = agentActionRef.current;
      const trimmed = msg.trim();
      if (!trimmed && !image && !currentAction) return;

      playChatSound('send');
      Keyboard.dismiss();

      let finalMsg = trimmed;
      if (currentAction) {
        finalMsg = trimmed ? `[${currentAction.label}] ${trimmed}` : currentAction.prompt;
        if (currentAction.toneMode) setTonePreference(currentAction.toneMode);
        setActiveAgentAction(null);
      }

      setAgentMode(false);
      const toneMode = finalMsg ? inferToneMode(finalMsg) : undefined;
      if (toneMode) setTonePreference(toneMode);
      if (toneMode === 'hard')
        track(ANALYTICS_EVENTS.FINANCIAL_AUDIT_REQUESTED, { source, tone_mode: toneMode });

      if (image) {
        clearImage();
        await sendImage(
          image.base64,
          finalMsg || 'Analyze this receipt and extract the transaction details.'
        );
        return;
      }

      // Send straight away — sendMessage inserts the user bubble synchronously
      // (instant), and the stream creates + resolves the conversation id on its
      // own. Pre-creating the conversation here added a blocking round-trip that
      // delayed the very first message of a thread from appearing.
      setEditText('');
      await sendMessage(finalMsg, activeConversationId ?? undefined, { toneMode });
    },
    [
      activeConversationId,
      sendMessage,
      sendImage,
      setTonePreference,
      track,
      clearImage,
      setActiveAgentAction,
      setAgentMode,
      setEditText,
    ]
  );

  const handleSendDocument = useCallback(
    (uri: string, text?: string) => {
      setAttachedDocument(null);
      sendStatement(uri, 'auto', text);
    },
    [sendStatement]
  );

  // Stable ref for effects that need current handleSend
  const handleSendRef = useRef(handleSend);
  handleSendRef.current = handleSend;

  return {
    handleSend,
    handleSendRef,
    handleSendDocument,
    attachedDocument,
    setAttachedDocument,
  };
}
