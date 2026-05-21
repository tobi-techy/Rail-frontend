import { useRef, useState, useCallback, useEffect } from 'react';
import {
  initialize,
  playPCMData,
  toggleRecording,
  tearDown,
  requestMicrophonePermissionsAsync,
  useExpoTwoWayAudioEventListener,
  type MicrophoneDataCallback,
  type VolumeLevelCallback,
} from '@speechmatics/expo-two-way-audio';
import { requireNativeModule } from 'expo-modules-core';
import { Buffer } from 'buffer';
import { useAuthStore } from '@/stores/authStore';
import { API_CONFIG } from '@/api/config';

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

interface VoiceEvent {
  type: string;
  data?: string;
  text?: string;
  status?: string;
  message?: string;
  [key: string]: any;
}

interface ExpoTwoWayAudioNativeModule {
  stopPlayback?: () => void;
}

const twoWayAudioNative = requireNativeModule<ExpoTwoWayAudioNativeModule>('ExpoTwoWayAudio');

// Fast base64 decode
function base64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(Buffer.from(b64, 'base64'));
}

// Fast base64 encode for mic data (Uint8Array → base64)
function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

function splitCaptionTokens(text: string): string[] {
  return text.match(/\S+\s*/g) ?? [];
}

function estimateCaptionDurationMs(text: string, audioDurationMs: number, audioStartedAt: number) {
  const tokenCount = Math.max(splitCaptionTokens(text).length, 1);
  const naturalDurationMs = Math.min(Math.max(tokenCount * 115, 500), 5000);
  if (!audioDurationMs || !audioStartedAt) return naturalDurationMs;

  const elapsedPlaybackMs = Date.now() - audioStartedAt;
  const remainingPlaybackMs = audioDurationMs - elapsedPlaybackMs;
  if (remainingPlaybackMs > 300) return Math.min(Math.max(remainingPlaybackMs, 500), 5000);

  return naturalDurationMs;
}

export function useVoiceSession() {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [responseText, setResponseText] = useState('');
  const [error, setError] = useState('');
  const [inputVolume, setInputVolume] = useState(0);
  const [outputVolume, setOutputVolume] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const activeRef = useRef(false);
  const stateRef = useRef<VoiceState>('idle');
  const canPlayReplyAudioRef = useRef(false);
  const captionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speakingSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replyAudioStartedAtRef = useRef(0);
  const replyAudioDurationMsRef = useRef(0);

  const setVoiceState = useCallback((s: VoiceState) => {
    stateRef.current = s;
    setState(s);
  }, []);

  const flushPlayback = useCallback(() => {
    canPlayReplyAudioRef.current = false;
    if (captionTimerRef.current) {
      clearInterval(captionTimerRef.current);
      captionTimerRef.current = null;
    }
    if (speakingSettleTimerRef.current) {
      clearTimeout(speakingSettleTimerRef.current);
      speakingSettleTimerRef.current = null;
    }
    setOutputVolume(0);
    try {
      twoWayAudioNative.stopPlayback?.();
    } catch {}
  }, []);

  const revealAgentCaption = useCallback((text: string, durationMs?: number) => {
    if (captionTimerRef.current) {
      clearInterval(captionTimerRef.current);
      captionTimerRef.current = null;
    }

    const tokens = splitCaptionTokens(text);
    if (tokens.length === 0) {
      setResponseText('');
      return;
    }

    const totalDurationMs = durationMs ?? Math.min(Math.max(tokens.length * 115, 500), 5000);
    const stepMs = Math.max(35, Math.floor(totalDurationMs / tokens.length));
    let index = 0;

    setResponseText('');
    captionTimerRef.current = setInterval(() => {
      index += 1;
      setResponseText(tokens.slice(0, index).join('').trimEnd());
      if (index >= tokens.length && captionTimerRef.current) {
        clearInterval(captionTimerRef.current);
        captionTimerRef.current = null;
      }
    }, stepMs);
  }, []);

  // Stream mic PCM to backend — native is patched to 24kHz PCM16 mono.
  useExpoTwoWayAudioEventListener(
    'onMicrophoneData',
    useCallback<MicrophoneDataCallback>((event) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN || !activeRef.current) return;
      const b64 = bytesToBase64(event.data);
      ws.send(JSON.stringify({ type: 'input.audio', audio: b64 }));
    }, [])
  );

  // Volume level feedback for UI animations
  useExpoTwoWayAudioEventListener(
    'onInputVolumeLevelData',
    useCallback<VolumeLevelCallback>((event) => {
      setInputVolume(event.data);
    }, [])
  );

  useExpoTwoWayAudioEventListener(
    'onOutputVolumeLevelData',
    useCallback<VolumeLevelCallback>((event) => {
      setOutputVolume(event.data);
    }, [])
  );

  const cleanup = useCallback(() => {
    activeRef.current = false;
    canPlayReplyAudioRef.current = false;
    if (captionTimerRef.current) {
      clearInterval(captionTimerRef.current);
      captionTimerRef.current = null;
    }
    if (speakingSettleTimerRef.current) {
      clearTimeout(speakingSettleTimerRef.current);
      speakingSettleTimerRef.current = null;
    }
    replyAudioStartedAtRef.current = 0;
    replyAudioDurationMsRef.current = 0;
    try {
      toggleRecording(false);
    } catch {}
    try {
      tearDown();
    } catch {}
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setVoiceState('idle');
    setTranscript('');
    setResponseText('');
    setInputVolume(0);
    setOutputVolume(0);
  }, [setVoiceState]);

  // Handle events from backend (AssemblyAI via proxy)
  const handleEvent = useCallback(
    (event: VoiceEvent) => {
      switch (event.type) {
        case 'session.ready':
          setVoiceState('listening');
          activeRef.current = true;
          // Start mic — native AEC handles echo cancellation
          toggleRecording(true);
          break;

        case 'input.speech.started':
        case 'rail.playback.flush':
          flushPlayback();
          setVoiceState('listening');
          setResponseText('');
          break;

        case 'input.speech.stopped':
          setVoiceState('thinking');
          break;

        case 'transcript.user':
        case 'transcript.user.delta':
          setTranscript(event.text ?? '');
          break;

        case 'reply.started':
          canPlayReplyAudioRef.current = true;
          replyAudioStartedAtRef.current = 0;
          replyAudioDurationMsRef.current = 0;
          if (captionTimerRef.current) {
            clearInterval(captionTimerRef.current);
            captionTimerRef.current = null;
          }
          setResponseText('');
          setVoiceState('speaking');
          break;

        case 'reply.audio':
          if (event.data && canPlayReplyAudioRef.current) {
            try {
              const audioBytes = base64ToBytes(event.data);
              if (!replyAudioStartedAtRef.current) replyAudioStartedAtRef.current = Date.now();
              replyAudioDurationMsRef.current += (audioBytes.byteLength / 2 / 24000) * 1000;
              playPCMData(audioBytes);
            } catch {
              setError('Audio playback failed');
              setVoiceState('error');
            }
          }
          break;

        case 'transcript.agent':
          if (event.interrupted) {
            flushPlayback();
            setResponseText(event.text ?? '');
          } else {
            const text = event.text ?? '';
            revealAgentCaption(
              text,
              estimateCaptionDurationMs(
                text,
                replyAudioDurationMsRef.current,
                replyAudioStartedAtRef.current
              )
            );
          }
          break;

        case 'rail.transcript.agent.sync':
          if (event.text) {
            if (captionTimerRef.current) break;
            revealAgentCaption(event.text, event.duration_ms ?? event.estimated_duration_ms);
          }
          break;

        case 'rail.voice.audio_missing':
          canPlayReplyAudioRef.current = true;
          setVoiceState('speaking');
          break;

        case 'reply.done':
          if (event.status === 'interrupted') {
            flushPlayback();
          } else {
            canPlayReplyAudioRef.current = false;
            const elapsedPlaybackMs = replyAudioStartedAtRef.current
              ? Date.now() - replyAudioStartedAtRef.current
              : 0;
            const remainingPlaybackMs = Math.min(
              Math.max(replyAudioDurationMsRef.current - elapsedPlaybackMs, 0),
              5000
            );
            if (speakingSettleTimerRef.current) clearTimeout(speakingSettleTimerRef.current);
            speakingSettleTimerRef.current = setTimeout(() => {
              speakingSettleTimerRef.current = null;
              if (stateRef.current === 'speaking') setVoiceState('listening');
            }, remainingPlaybackMs);
          }
          if (event.status === 'interrupted' && stateRef.current === 'speaking')
            setVoiceState('listening');
          break;

        case 'session.error':
          setError(event.message ?? 'Voice error');
          setVoiceState('error');
          break;
      }
    },
    [flushPlayback, revealAgentCaption, setVoiceState]
  );

  // Connect to voice session
  const connect = useCallback(async () => {
    cleanup();
    setVoiceState('connecting');
    setError('');

    const permission = await requestMicrophonePermissionsAsync();
    if (!permission.granted) {
      setError('Microphone permission required');
      setVoiceState('error');
      return;
    }

    // Initialize native audio engine:
    // - AVAudioEngine with .playAndRecord + .defaultToSpeaker
    // - Voice processing (AEC + noise reduction)
    // - PCM16 24kHz mono (patched from 16kHz)
    try {
      await initialize();
    } catch {
      setError('Failed to initialize audio');
      setVoiceState('error');
      return;
    }

    // Connect WebSocket to backend voice proxy
    const httpBase = API_CONFIG.baseURL;
    const wsBase = httpBase.replace(/^http/, 'ws');
    const token = useAuthStore.getState().accessToken;
    const url = `${wsBase}/v1/ai/voice/session?token=${token}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        handleEvent(JSON.parse(e.data));
      } catch {}
    };
    ws.onerror = () => {
      setError('Connection failed');
      setVoiceState('error');
    };
    ws.onclose = () => {
      activeRef.current = false;
      try {
        toggleRecording(false);
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
    inputVolume,
    outputVolume,
    connect,
    disconnect,
    isActive: state !== 'idle' && state !== 'error',
  };
}
