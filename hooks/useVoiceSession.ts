import { useRef, useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
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
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const fileIdRef = useRef(0);

  const setVoiceState = useCallback((s: VoiceState) => {
    stateRef.current = s;
    setState(s);
  }, []);

  const cleanup = useCallback(() => {
    activeRef.current = false;
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    try {
      LiveAudioStream?.stop();
    } catch {}
    try {
      LiveAudioStream?.removeAllListeners?.();
    } catch {}
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setVoiceState('idle');
    setTranscript('');
    setResponseText('');
  }, [setVoiceState]);

  // Play a single WAV file and resolve when done
  const playWav = useCallback((wavBase64: string): Promise<void> => {
    return new Promise((resolve) => {
      try {
        const id = fileIdRef.current++;
        const filePath = `${Paths.cache}/voice_${id}.wav`;
        const file = new File(filePath);
        file.write(wavBase64, { encoding: 'base64' });

        const player = createAudioPlayer(filePath);
        const sub = player.addListener('playbackStatusUpdate', (status) => {
          if (status.didJustFinish) {
            sub.remove();
            player.remove();
            try {
              file.delete();
            } catch {}
            resolve();
          }
        });
        player.play();

        // Safety timeout - 15s max per chunk
        setTimeout(() => {
          sub.remove();
          try {
            player.remove();
          } catch {}
          try {
            file.delete();
          } catch {}
          resolve();
        }, 15000);
      } catch (e) {
        if (__DEV__) console.warn('[voice] playWav error:', e);
        resolve();
      }
    });
  }, []);

  // Drain audio queue sequentially
  const drainQueue = useCallback(async () => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;

    while (audioQueueRef.current.length > 0 && activeRef.current) {
      // Batch up to 5 chunks for smoother playback (fewer file writes)
      const batch = audioQueueRef.current.splice(0, 5);
      const combinedPcm = batch.join('');
      if (!combinedPcm) continue;

      // Build WAV
      const padding = combinedPcm.endsWith('==') ? 2 : combinedPcm.endsWith('=') ? 1 : 0;
      const pcmBytes = Math.floor((combinedPcm.length * 3) / 4) - padding;
      const header = wavHeaderBase64(pcmBytes, 24000, 1, 16);
      await playWav(header + combinedPcm);
    }

    isPlayingRef.current = false;
    if (activeRef.current && stateRef.current === 'speaking') {
      setVoiceState('listening');
    }
  }, [playWav, setVoiceState]);

  // Handle events from backend
  const handleEvent = useCallback(
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
          // Barge-in: clear queue
          audioQueueRef.current = [];
          break;

        case 'input.speech.stopped':
          setVoiceState('thinking');
          break;

        case 'transcript.user':
          setTranscript(event.text ?? '');
          break;

        case 'reply.started':
          setVoiceState('speaking');
          break;

        case 'reply.audio':
          if (event.data) {
            audioQueueRef.current.push(event.data);
            drainQueue();
          }
          break;

        case 'transcript.agent':
          setResponseText(event.text ?? '');
          break;

        case 'reply.done':
          if (event.status === 'interrupted') {
            audioQueueRef.current = [];
          }
          if (!isPlayingRef.current) setVoiceState('listening');
          break;

        case 'session.error':
          setError(event.message ?? 'Voice error');
          setVoiceState('error');
          break;
      }
    },
    [setVoiceState, drainQueue]
  );

  // Connect
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
      setError('Voice requires a native app build');
      setVoiceState('error');
      return;
    }

    // Enable playback in silent mode + allow mixing
    await AudioModule.setAudioModeAsync({
      playsInSilentMode: true,
    });

    // Init mic: PCM16 24kHz mono
    LiveAudioStream.init({
      sampleRate: 24000,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 6,
      wavFile: '',
      bufferSize: 4800,
    });

    // Stream mic to backend
    LiveAudioStream.on('data', (base64Pcm: string) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN || !activeRef.current) return;
      ws.send(JSON.stringify({ type: 'input.audio', audio: base64Pcm }));
    });

    // WebSocket
    const httpBase = API_CONFIG.baseURL;
    const wsBase = httpBase.replace(/^http/, 'ws');
    const token = useAuthStore.getState().accessToken;
    const url = `${wsBase}/v1/ai/voice/session?token=${token}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (__DEV__) console.log('[voice] ws connected');
    };
    ws.onmessage = (e) => {
      try {
        handleEvent(JSON.parse(e.data));
      } catch (err) {
        if (__DEV__) console.warn('[voice] parse:', err);
      }
    };
    ws.onerror = (e) => {
      if (__DEV__) console.warn('[voice] ws error:', e);
      setError('Connection failed');
      setVoiceState('error');
    };
    ws.onclose = () => {
      activeRef.current = false;
      try {
        LiveAudioStream?.stop();
      } catch {}
      if (stateRef.current !== 'error') setVoiceState('idle');
    };
  }, [cleanup, handleEvent, setVoiceState]);

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

// WAV header (44 bytes) as base64
function wavHeaderBase64(dataSize: number, sr: number, ch: number, bits: number): string {
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
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < 44; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
