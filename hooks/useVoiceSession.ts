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
import { API_CONFIG } from '@/api/config';
import { aiService } from '@/api/services/ai.service';
import { logger } from '@/lib/logger';
import { safeError, sanitizeForLog } from '@/utils/logSanitizer';

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

// Audio constants
const SAMPLE_RATE = 24000; // 24kHz PCM16 mono
const BYTES_PER_SAMPLE = 2;
// Pre-buffer enough audio to keep native playback ahead of network/JS timer jitter.
const PRE_BUFFER_MS = 220;
const PRE_BUFFER_BYTES = Math.ceil((SAMPLE_RATE * BYTES_PER_SAMPLE * PRE_BUFFER_MS) / 1000);
const DRAIN_INTERVAL_MS = 30;
const DRAIN_CHUNK_MS = 80;
const DRAIN_CHUNK_BYTES = Math.ceil((SAMPLE_RATE * BYTES_PER_SAMPLE * DRAIN_CHUNK_MS) / 1000);

// Helpers
function base64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(Buffer.from(b64, 'base64'));
}

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

function safeVoiceErrorMessage(err: unknown) {
  if (err instanceof Error && err.message) return sanitizeForLog(err.message);
  if (typeof err === 'string') return sanitizeForLog(err);
  return 'Unknown voice audio error';
}

/**
 * Jitter buffer: accumulates incoming PCM chunks and drains them at a steady
 * rate to the native audio player. This eliminates crackling caused by uneven
 * network delivery of audio packets.
 */
class AudioJitterBuffer {
  private buffer: Uint8Array[] = [];
  private totalBytes = 0;
  private drainTimer: ReturnType<typeof setInterval> | null = null;
  private preBufferReached = false;
  private playing = false;

  start() {
    this.stop();
    this.buffer = [];
    this.totalBytes = 0;
    this.preBufferReached = false;
    this.playing = true;

    this.drainTimer = setInterval(() => this.drain(), DRAIN_INTERVAL_MS);
  }

  push(chunk: Uint8Array) {
    if (!this.playing) return;
    this.buffer.push(chunk);
    this.totalBytes += chunk.byteLength;
  }

  private drain() {
    if (!this.playing) return;

    // Wait for pre-buffer to fill before starting playback
    if (!this.preBufferReached) {
      if (this.totalBytes >= PRE_BUFFER_BYTES) {
        this.preBufferReached = true;
      } else {
        return; // Still accumulating
      }
    }

    if (this.buffer.length === 0) return;

    // Merge buffered chunks into a single drain-sized chunk for smooth playback
    const bytesToDrain = Math.min(DRAIN_CHUNK_BYTES, this.totalBytes);
    const merged = new Uint8Array(bytesToDrain);
    let offset = 0;

    while (offset < bytesToDrain && this.buffer.length > 0) {
      const chunk = this.buffer[0];
      const needed = bytesToDrain - offset;

      if (chunk.byteLength <= needed) {
        merged.set(chunk, offset);
        offset += chunk.byteLength;
        this.buffer.shift();
        this.totalBytes -= chunk.byteLength;
      } else {
        // Partial chunk: take what we need, leave the rest
        merged.set(chunk.subarray(0, needed), offset);
        this.buffer[0] = chunk.subarray(needed);
        this.totalBytes -= needed;
        offset += needed;
      }
    }

    if (offset > 0) {
      const toPlay = offset === bytesToDrain ? merged : merged.subarray(0, offset);
      try {
        playPCMData(toPlay);
      } catch (err) {
        const message = safeVoiceErrorMessage(err);
        safeError('[VoiceSession] Native playback failed', err);
        logger.error('[VoiceSession] Native playback failed', {
          component: 'useVoiceSession',
          action: 'play-pcm-data',
          error: message,
        });
      }
    }
  }

  stop() {
    this.playing = false;
    if (this.drainTimer) {
      clearInterval(this.drainTimer);
      this.drainTimer = null;
    }
    this.buffer = [];
    this.totalBytes = 0;
    this.preBufferReached = false;
  }

  get bufferedMs(): number {
    return (this.totalBytes / BYTES_PER_SAMPLE / SAMPLE_RATE) * 1000;
  }
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
  const jitterBufferRef = useRef(new AudioJitterBuffer());
  const micMutedRef = useRef(false);

  const setVoiceState = useCallback((s: VoiceState) => {
    stateRef.current = s;
    setState(s);
  }, []);

  const muteMic = useCallback(() => {
    if (!micMutedRef.current) {
      micMutedRef.current = true;
    }
  }, []);

  const unmuteMic = useCallback(() => {
    if (micMutedRef.current) {
      micMutedRef.current = false;
    }
  }, []);

  const flushPlayback = useCallback(() => {
    canPlayReplyAudioRef.current = false;
    jitterBufferRef.current.stop();
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
    // Unmute mic after flushing playback
    unmuteMic();
  }, [unmuteMic]);

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

  // Stream mic PCM to backend — muted during playback to prevent echo/artifacts
  useExpoTwoWayAudioEventListener(
    'onMicrophoneData',
    useCallback<MicrophoneDataCallback>((event) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN || !activeRef.current) return;
      // Duck mic during playback to prevent echo artifacts
      if (micMutedRef.current) return;
      const b64 = bytesToBase64(event.data);
      ws.send(JSON.stringify({ type: 'input.audio', audio: b64 }));
    }, [])
  );

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
    micMutedRef.current = false;
    jitterBufferRef.current.stop();
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

  // Handle events from backend
  const handleEvent = useCallback(
    (event: VoiceEvent) => {
      switch (event.type) {
        case 'session.ready':
          // Mic already recording from connect(); just confirm listening state
          setVoiceState('listening');
          activeRef.current = true;
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
          // Mute mic during playback to prevent echo/feedback artifacts
          muteMic();
          // Start jitter buffer for smooth audio drain
          jitterBufferRef.current.start();
          break;

        case 'reply.audio':
          if (event.data && canPlayReplyAudioRef.current) {
            try {
              const audioBytes = base64ToBytes(event.data);
              if (!replyAudioStartedAtRef.current) replyAudioStartedAtRef.current = Date.now();
              replyAudioDurationMsRef.current +=
                (audioBytes.byteLength / BYTES_PER_SAMPLE / SAMPLE_RATE) * 1000;
              // Push to jitter buffer instead of playing immediately
              jitterBufferRef.current.push(audioBytes);
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
            // Let the jitter buffer drain remaining audio before transitioning
            const elapsedPlaybackMs = replyAudioStartedAtRef.current
              ? Date.now() - replyAudioStartedAtRef.current
              : 0;
            const remainingPlaybackMs = Math.min(
              Math.max(replyAudioDurationMsRef.current - elapsedPlaybackMs, 0),
              5000
            );
            // Add buffer drain time
            const bufferDrainMs = jitterBufferRef.current.bufferedMs;
            const totalSettleMs = remainingPlaybackMs + bufferDrainMs + 80; // +80ms safety margin

            if (speakingSettleTimerRef.current) clearTimeout(speakingSettleTimerRef.current);
            speakingSettleTimerRef.current = setTimeout(() => {
              speakingSettleTimerRef.current = null;
              jitterBufferRef.current.stop();
              unmuteMic();
              if (stateRef.current === 'speaking') setVoiceState('listening');
            }, totalSettleMs);
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
    [flushPlayback, muteMic, unmuteMic, revealAgentCaption, setVoiceState]
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

    try {
      await initialize();
    } catch {
      setError('Failed to initialize audio');
      setVoiceState('error');
      return;
    }

    // Start recording immediately so the user can speak as soon as the screen appears.
    // Mic data is only forwarded once the WebSocket is open (checked in onMicrophoneData).
    try {
      toggleRecording(true);
      activeRef.current = true;
      setVoiceState('listening');
    } catch (err) {
      activeRef.current = false;
      setVoiceState('error');
      const message = safeVoiceErrorMessage(err);
      setError('Failed to start microphone');
      safeError('[VoiceSession] Failed to start recorder', err);
      logger.error('[VoiceSession] Failed to start recorder', {
        component: 'useVoiceSession',
        action: 'toggle-recording-start',
        error: message,
      });
      return;
    }

    let sessionToken = '';
    try {
      const ticket = await aiService.createVoiceSessionToken();
      sessionToken = ticket.token;
    } catch (err) {
      activeRef.current = false;
      try {
        toggleRecording(false);
      } catch {}
      setError('Failed to start secure voice session');
      setVoiceState('error');
      logger.error('[VoiceSession] Failed to create session ticket', {
        component: 'useVoiceSession',
        action: 'voice-session-ticket',
        error: safeVoiceErrorMessage(err),
      });
      return;
    }

    if (!sessionToken) {
      activeRef.current = false;
      try {
        toggleRecording(false);
      } catch {}
      setError('Failed to start secure voice session');
      setVoiceState('error');
      return;
    }

    const httpBase = API_CONFIG.baseURL;
    const wsBase = httpBase.replace(/^http/, 'ws');
    const url = `${wsBase}/v1/ai/voice/session?voice_session_token=${encodeURIComponent(sessionToken)}`;

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
