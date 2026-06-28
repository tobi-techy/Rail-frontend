import React, { useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ConversationProvider, useConversation } from '@elevenlabs/react-native';
import { useMiriamAmbientStore } from '@/stores/miriamAmbientStore';
import { useWalletStore } from '@/stores/walletStore';
import { useHeyMiriam } from '@/hooks/useHeyMiriam';
import { buildMiriamClientTools } from '@/lib/miriamClientTools';
import { aiService } from '@/api/services/ai.service';
import { logger } from '@/lib/logger';
import { AmbientGlow } from './AmbientGlow';

/**
 * The "Hey Miriam" ambient layer. Mounted once at the app root so Miriam is
 * always present in the background. While enabled (homescreen + foreground) an
 * on-device wake-word engine listens; saying "Hey Miriam" starts a live voice
 * session in place — no navigation — and the screen edges come alive.
 *
 * Hands-free is read-only by default; money actions surface an on-screen
 * confirm card with biometric (see show_confirm), so the wake word never moves
 * money on its own.
 */
function AmbientSession() {
  const router = useRouter();
  const status = useMiriamAmbientStore((s) => s.status);
  const enabled = useMiriamAmbientStore((s) => s.enabled);
  const setStatus = useMiriamAmbientStore((s) => s.setStatus);
  const tokens = useWalletStore((s) => s.tokens);
  const totalBalanceUSD = useWalletStore((s) => s.totalBalanceUSD);
  const startingRef = useRef(false);

  const conversation = useConversation({
    clientTools: buildMiriamClientTools({
      tokens,
      totalBalanceUSD,
      navigate: (screen) => router.push(screen as never),
    }),
    onConnect: () => setStatus('listening'),
    onDisconnect: () => {
      startingRef.current = false;
      setStatus('dormant'); // wake-word engine resumes automatically
    },
    onError: (error: string) => {
      logger.error('[Miriam ambient] session error', { error });
      startingRef.current = false;
      setStatus('dormant');
    },
    onModeChange: ({ mode }: { mode: 'speaking' | 'listening' }) =>
      setStatus(mode === 'speaking' ? 'speaking' : 'listening'),
  });

  const handleWake = useCallback(async () => {
    if (startingRef.current || useMiriamAmbientStore.getState().isActive()) return;
    startingRef.current = true;
    setStatus('waking');
    try {
      const { agent_id, dynamic_variables } = await aiService.getVoiceSignedUrl();
      await conversation.startSession({
        agentId: agent_id,
        dynamicVariables: { ...dynamic_variables, supports_pidgin: true, platform: Platform.OS },
        connectionDelay: { default: 300, ios: 400, android: 200 },
        preferHeadphonesForIosDevices: true,
      });
    } catch (e) {
      logger.error('[Miriam ambient] failed to start', {
        error: e instanceof Error ? e.message : String(e),
      });
      startingRef.current = false;
      setStatus('dormant');
    }
  }, [conversation, setStatus]);

  // Only listen for the wake word when present and idle (not mid-session).
  useHeyMiriam({ enabled: enabled && status === 'dormant', onWake: handleWake });

  return <AmbientGlow status={status} />;
}

export function MiriamAmbientLayer() {
  return (
    <ConversationProvider>
      <AmbientSession />
    </ConversationProvider>
  );
}
