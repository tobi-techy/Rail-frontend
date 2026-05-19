import { useRef, useState, useCallback, useEffect } from 'react';
import { AudioModule, createAudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { useAuthStore } from '@/stores/authStore';
import { API_CONFIG } from '@/api/config';

let LiveAudioStream: any = null;
try {
  LiveAudioStream = require('react-native-live-audio-stream').default;
} catch {}

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

interface VoiceEvent {
  type: string;
  data?: string;
  text?: string;
  status?: string;
  message?: string;
  [key: string]: any;
}

export function useVoiceSession() {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [responseText, setResponseText] = useState('');
  const [error, setError] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const activeRef = useRef(false);
  const stateRef = useRef<VoiceState>('idle');

  // Playback
  const playQueueRef = useRef<string[]>([]);
  const isDrainingRef = useRef(false);
  const cancelDrainRef = useRef(false);
  const playerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const fileCounterRef = useRef(0);
  const replyPendingRef = useRef(false);

  const setVoiceState = useCallback((s: VoiceState) => {
    stateRef.current = s;
    setState(s);
  }, []);

  const cleanup = useCallback(() => {
    activeRef.current = false;
    cancelDrainRef.current = true;
    playQueueRef.current = [];
    isDrainingRef.current = false;
    replyPendingRef.current = false;
    try {
      LiveAudioStream?.stop();
    } catch {}
    try {
      LiveAudioStream?.removeAllListeners?.();
    } catch {}
    if (playerRef.current) {
      try {
        playerRef.current.remove();
      } catch {}
      playerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setVoiceState('idle');
    setTranscript('');
    setResponseText('');
  }, [setVoiceState]);

  // --- Playback ---
  const drainPlayQueue = useCallback(async () => {
    if (isDrainingRef.current) return;
    isDrainingRef.current = true;
    cancelDrainRef.current = false;

    while (playQueueRef.current.length > 0 && !cancelDrainRef.current) {
      const batch = playQueueRef.current.splice(0, 3);
      const pcmBase64 = batch.join('');
      if (!pcmBase64) continue;

      const padding = pcmBase64.endsWith('==') ? 2 : pcmBase64.endsWith('=') ? 1 : 0;
      const pcmBytes = Math.floor((pcmBase64.length * 3) / 4) - padding;
      const wavBase64 = wavHeader(pcmBytes, 24000, 1, 16) + pcmBase64;

      const idx = fileCounterRef.current++;
      const file = new File(Paths.cache, `v_${idx}.wav`);

      try {
        file.write(wavBase64, { encoding: 'base64' });

        const player = createAudioPlayer(file.uri);
        playerRef.current = player;
        player.play();

        // Wait for playback to finish
        await new Promise<void>((resolve) => {
          const sub = player.addListener('playbackStatusUpdate', (status: any) => {
            if (status.didJustFinish || (!status.playing && status.currentTime > 0)) {
              sub.remove();
              resolve();
            }
          });
          // Safety timeout
          setTimeout(() => {
            sub.remove();
            resolve();
          }, 8000);
        });

        player.remove();
        playerRef.current = null;
        try {
          file.delete();
        } catch {}
      } catch {
        try {
          file.delete();
        } catch {}
        playerRef.current = null;
      }

      if (cancelDrainRef.current) break;
    }

    isDrainingRef.current = false;
    if (!replyPendingRef.current && playQueueRef.current.length === 0 && activeRef.current) {
      setVoiceState('listening');
    }
  }, [setVoiceState]);

  const flushPlayback = useCallback(() => {
    cancelDrainRef.current = true;
    playQueueRef.current = [];
    if (playerRef.current) {
      try {
        playerRef.current.pause();
      } catch {}
      try {
        playerRef.current.remove();
      } catch {}
      playerRef.current = null;
    }
    isDrainingRef.current = false;
  }, []);

  // --- Events ---
  const handleServerEvent = useCallback(
    (event: VoiceEvent) => {
      switch (event.type) {
        case 'session.ready':
          setVoiceState('listening');
          activeRef.current = true;
          LiveAudioStream?.start();
          break;

        case 'input.speech.started':
          setVoiceState('listening');
          setResponseText('');
          replyPendingRef.current = false;
          flushPlayback();
          break;

        case 'input.speech.stopped':
          setVoiceState('thinking');
          break;

        case 'transcript.user':
          setTranscript(event.text ?? '');
          break;

        case 'reply.started':
          setVoiceState('speaking');
          replyPendingRef.current = true;
          cancelDrainRef.current = false;
          break;

        case 'reply.audio':
          if (event.data) {
            playQueueRef.current.push(event.data);
            drainPlayQueue();
          }
          break;

        case 'transcript.agent':
          setResponseText(event.text ?? '');
          break;

        case 'reply.done':
          replyPendingRef.current = false;
          if (event.status === 'interrupted') {
            flushPlayback();
            setVoiceState('listening');
          } else if (!isDrainingRef.current) {
            setVoiceState('listening');
          }
          break;

        case 'session.error':
          setError(event.message ?? 'Voice error');
          setVoiceState('error');
          break;
      }
    },
    [setVoiceState, drainPlayQueue, flushPlayback]
  );

  // --- Connect ---
  const connect = useCallback(async () => {
    cleanup();
    setVoiceState('connecting');
    setError('');

    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setError('Microphone permission required');
      setVoiceState('error');
      return;
    }

    if (!LiveAudioStream) {
      setError('Voice requires a native app build. Please update the app.');
      setVoiceState('error');
      return;
    }

    await AudioModule.setAudioModeAsync({ playsInSilentMode: true });

    LiveAudioStream.init({
      sampleRate: 24000,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 6,
      wavFile: '',
      bufferSize: 4800,
    });

    LiveAudioStream.on('data', (base64: string) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN || !activeRef.current) return;
      ws.send(JSON.stringify({ type: 'input.audio', audio: base64 }));
    });

    const httpBase = API_CONFIG.baseURL;
    const wsBase = httpBase.replace(/^http/, 'ws');
    const token = useAuthStore.getState().accessToken;
    const url = `${wsBase}/v1/ai/voice/session?token=${token}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onopen = () => {};
    ws.onmessage = (e) => {
      try {
        handleServerEvent(JSON.parse(e.data));
      } catch (err) {
        if (__DEV__) console.warn('[voice] parse error:', err);
      }
    };
    ws.onerror = () => {
      setError('Voice connection failed');
      setVoiceState('error');
    };
    ws.onclose = () => {
      activeRef.current = false;
      try {
        LiveAudioStream?.stop();
      } catch {}
      try {
        LiveAudioStream?.removeAllListeners?.();
      } catch {}
      if (stateRef.current !== 'error') setVoiceState('idle');
    };
  }, [cleanup, handleServerEvent, setVoiceState]);

  const disconnect = useCallback(() => {
    cleanup();
  }, [cleanup]);

  useEffect(
    () => () => {
      cleanup();
    },
    [cleanup]
  );

  return {
    state,
    transcript,
    responseText,
    error,
    connect,
    disconnect,
    isActive: state !== 'idle' && state !== 'error',
  };
}

function wavHeader(dataSize: number, sr: number, ch: number, bits: number): string {
  const buf = new ArrayBuffer(44);
  const v = new DataView(buf);
  const s = (o: number, t: string) => {
    for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i));
  };
  s(0, 'RIFF');
  v.setUint32(4, 36 + dataSize, true);
  s(8, 'WAVE');
  s(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, ch, true);
  v.setUint32(24, sr, true);
  v.setUint32(28, sr * ch * (bits / 8), true);
  v.setUint16(32, ch * (bits / 8), true);
  v.setUint16(34, bits, true);
  s(36, 'data');
  v.setUint32(40, dataSize, true);
  let bin = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < 44; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
