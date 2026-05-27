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
import * as Speech from 'expo-speech';
import { requireNativeModule } from 'expo-modules-core';
import { Buffer } from 'buffer';
import { API_CONFIG } from '@/api/config';
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
const SAMPLE_RATE = 24000;
const BYTES_PER_SAMPLE = 2;
const PRE_BUFFER_MS = 220;
const PRE_BUFFER_BYTES = Math.ceil((SAMPLE_RATE * BYTES_PER_SAMPLE * PRE_BUFFER_MS) / 1000);
const DRAIN_INTERVAL_MS = 30;
const DRAIN_CHUNK_MS = 80;
const DRAIN_CHUNK_BYTES = Math.ceil((SAMPLE_RATE * BYTES_PER_SAMPLE * DRAIN_CHUNK_MS) / 1000);
const TTS_FALLBACK_DELAY_MS = 3000;
const DEVICE_TTS_OPTIONS = {
  language: 'en-US',
  pitch: 1.0,
  rate: 0.88,
};
const INTERRUPT_ENERGY_THRESHOLD = 0.15;
const MAX_JITTER_BUFFER_BYTES = 1024 * 1024;
const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 15000;
const MAX_RECONNECT_ATTEMPTS = 5;
const HEARTBEAT_INTERVAL_MS = 15000;
const HEARTBEAT_TIMEOUT_MS = 5000;

function base64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(Buffer.from(b64, 'base64'));
}

function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

function computeRMS(pcmData: Uint8Array): number {
  let sumSquares = 0;
  const view = new DataView(pcmData.buffer, pcmData.byteOffset, pcmData.byteLength);
  const sampleCount = Math.floor(pcmData.byteLength / 2);
  if (sampleCount === 0) return 0;
  for (let i = 0; i < sampleCount; i++) {
    const sample = view.getInt16(i * 2, true);
    sumSquares += sample * sample;
  }
  const meanSquare = sumSquares / sampleCount;
  return Math.sqrt(meanSquare) / 32768;
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
    if (this.totalBytes + chunk.byteLength > MAX_JITTER_BUFFER_BYTES) {
      logger.warn('[VoiceSession] Jitter buffer overflow, dropping chunk', {
        component: 'useVoiceSession',
        action: 'jitter-buffer-push',
        totalBytes: this.totalBytes,
        chunkSize: chunk.byteLength,
        maxBytes: MAX_JITTER_BUFFER_BYTES,
      });
      return;
    }
    this.buffer.push(chunk);
    this.totalBytes += chunk.byteLength;
  }

  private drain() {
    if (!this.playing) return;

    if (!this.preBufferReached) {
      if (this.totalBytes >= PRE_BUFFER_BYTES) {
        this.preBufferReached = true;
      } else {
        return;
      }
    }

    if (this.buffer.length === 0) return;

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

  clear() {
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
  const hasSettledRef = useRef(false);
  const isTornDownRef = useRef(false);
  const canPlayReplyAudioRef = useRef(false);
  const captionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speakingSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ttsFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replyAudioStartedAtRef = useRef(0);
  const replyAudioDurationMsRef = useRef(0);
  const replyAudioMissingRef = useRef(false);
  const repliedAudioArrivedRef = useRef(false);
  const deviceTtsActiveRef = useRef(false);
  const jitterBufferRef = useRef(new AudioJitterBuffer());
  const micMutedRef = useRef(false);
  const reconnectAttemptRef = useRef(0);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatPendingRef = useRef(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleReconnectRef = useRef<() => void>(() => {});
  const wsGenerationRef = useRef(0);

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

  const clearTtsFallbackTimer = useCallback(() => {
    if (ttsFallbackTimerRef.current) {
      clearTimeout(ttsFallbackTimerRef.current);
      ttsFallbackTimerRef.current = null;
    }
  }, []);

  const stopDeviceSpeech = useCallback(() => {
    clearTtsFallbackTimer();
    deviceTtsActiveRef.current = false;
    void Speech.stop();
  }, [clearTtsFallbackTimer]);

  const flushPlayback = useCallback(() => {
    canPlayReplyAudioRef.current = false;
    stopDeviceSpeech();
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
    unmuteMic();
  }, [stopDeviceSpeech, unmuteMic]);

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

  const speakWithDeviceTts = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !activeRef.current) return;

      deviceTtsActiveRef.current = true;
      muteMic();
      setVoiceState('speaking');
      void Speech.stop();
      Speech.speak(trimmed, {
        ...DEVICE_TTS_OPTIONS,
        onStart: () => {
          deviceTtsActiveRef.current = true;
          setOutputVolume(0.45);
          setVoiceState('speaking');
        },
        onDone: () => {
          deviceTtsActiveRef.current = false;
          setOutputVolume(0);
          unmuteMic();
          if (stateRef.current === 'speaking') setVoiceState('listening');
        },
        onStopped: () => {
          deviceTtsActiveRef.current = false;
          setOutputVolume(0);
          unmuteMic();
        },
        onError: (err) => {
          deviceTtsActiveRef.current = false;
          setOutputVolume(0);
          unmuteMic();
          const message = safeVoiceErrorMessage(err);
          safeError('[VoiceSession] Device TTS failed', err);
          logger.error('[VoiceSession] Device TTS failed', {
            component: 'useVoiceSession',
            action: 'device-tts',
            error: message,
          });
          if (stateRef.current === 'speaking') setVoiceState('listening');
        },
      });
    },
    [muteMic, setVoiceState, unmuteMic]
  );

  const scheduleDeviceTtsFallback = useCallback(
    (text: string) => {
      clearTtsFallbackTimer();
      if (!text.trim()) return;

      ttsFallbackTimerRef.current = setTimeout(() => {
        ttsFallbackTimerRef.current = null;

        if (repliedAudioArrivedRef.current) return;

        const hasReplyAudio =
          replyAudioDurationMsRef.current > 0 || replyAudioStartedAtRef.current > 0;
        if (!replyAudioMissingRef.current && hasReplyAudio) return;

        canPlayReplyAudioRef.current = false;
        jitterBufferRef.current.stop();
        speakWithDeviceTts(text);
      }, TTS_FALLBACK_DELAY_MS);
    },
    [clearTtsFallbackTimer, speakWithDeviceTts]
  );

  const finishPcmPlayback = useCallback(() => {
    canPlayReplyAudioRef.current = false;
    const elapsedPlaybackMs = replyAudioStartedAtRef.current
      ? Date.now() - replyAudioStartedAtRef.current
      : 0;
    const remainingPlaybackMs = Math.min(
      Math.max(replyAudioDurationMsRef.current - elapsedPlaybackMs, 0),
      5000
    );
    const bufferDrainMs = jitterBufferRef.current.bufferedMs;
    const totalSettleMs = remainingPlaybackMs + bufferDrainMs + 80;

    if (speakingSettleTimerRef.current) clearTimeout(speakingSettleTimerRef.current);
    speakingSettleTimerRef.current = setTimeout(() => {
      speakingSettleTimerRef.current = null;
      jitterBufferRef.current.stop();
      unmuteMic();
      if (stateRef.current === 'speaking') setVoiceState('listening');
    }, totalSettleMs);
  }, [setVoiceState, unmuteMic]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    heartbeatPendingRef.current = false;
  }, []);

  const startHeartbeat = useCallback(
    (ws: WebSocket) => {
      stopHeartbeat();
      heartbeatPendingRef.current = false;

      heartbeatTimerRef.current = setInterval(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          stopHeartbeat();
          return;
        }
        heartbeatPendingRef.current = true;
        try {
          ws.send(JSON.stringify({ type: 'ping' }));
        } catch {}
        setTimeout(() => {
          if (heartbeatPendingRef.current) {
            heartbeatPendingRef.current = false;
            logger.warn('[VoiceSession] Heartbeat timeout, closing connection', {
              component: 'useVoiceSession',
              action: 'heartbeat-timeout',
            });
            ws.close();
          }
        }, HEARTBEAT_TIMEOUT_MS);
      }, HEARTBEAT_INTERVAL_MS);
    },
    [stopHeartbeat]
  );

  // Stream mic PCM to backend — duck mic during playback but detect interruption energy
  useExpoTwoWayAudioEventListener(
    'onMicrophoneData',
    useCallback<MicrophoneDataCallback>((event) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN || !activeRef.current) return;

      if (micMutedRef.current) {
        const energy = computeRMS(event.data);
        if (energy > INTERRUPT_ENERGY_THRESHOLD) {
          try {
            ws.send(JSON.stringify({ type: 'input.interrupt' }));
          } catch {}
        }
        return;
      }

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
    if (!hasSettledRef.current) return;
    hasSettledRef.current = false;
    activeRef.current = false;
    canPlayReplyAudioRef.current = false;
    micMutedRef.current = false;
    replyAudioMissingRef.current = false;
    repliedAudioArrivedRef.current = false;
    stopHeartbeat();
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    stopDeviceSpeech();
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
    if (isTornDownRef.current) {
      isTornDownRef.current = false;
      try {
        toggleRecording(false);
      } catch {}
      try {
        tearDown();
      } catch {}
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setVoiceState('idle');
    setTranscript('');
    setResponseText('');
    setInputVolume(0);
    setOutputVolume(0);
  }, [setVoiceState, stopDeviceSpeech, stopHeartbeat]);

  const handleEvent = useCallback(
    (event: VoiceEvent) => {
      switch (event.type) {
        case 'session.ready':
          setVoiceState('listening');
          activeRef.current = true;
          break;

        case 'input.speech.started':
        case 'rail.playback.flush':
          flushPlayback();
          setVoiceState('listening');
          break;

        case 'input.speech.stopped':
          setVoiceState('thinking');
          break;

        case 'rail.voice.interrupt_detected':
          flushPlayback();
          setVoiceState('listening');
          break;

        case 'transcript.user':
        case 'transcript.user.delta':
          setTranscript(event.text ?? '');
          break;

        case 'pong':
          heartbeatPendingRef.current = false;
          break;

        case 'reply.started':
          canPlayReplyAudioRef.current = true;
          replyAudioStartedAtRef.current = 0;
          replyAudioDurationMsRef.current = 0;
          replyAudioMissingRef.current = false;
          repliedAudioArrivedRef.current = false;
          stopDeviceSpeech();
          if (captionTimerRef.current) {
            clearInterval(captionTimerRef.current);
            captionTimerRef.current = null;
          }
          setResponseText('');
          setVoiceState('speaking');
          muteMic();
          jitterBufferRef.current.start();
          break;

        case 'reply.audio':
          if (event.data && canPlayReplyAudioRef.current) {
            try {
              repliedAudioArrivedRef.current = true;
              clearTtsFallbackTimer();
              replyAudioMissingRef.current = false;
              const audioBytes = base64ToBytes(event.data);
              if (!replyAudioStartedAtRef.current) replyAudioStartedAtRef.current = Date.now();
              replyAudioDurationMsRef.current +=
                (audioBytes.byteLength / BYTES_PER_SAMPLE / SAMPLE_RATE) * 1000;
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
            scheduleDeviceTtsFallback(text);
          }
          break;

        case 'rail.transcript.agent.sync':
          if (event.text) {
            if (captionTimerRef.current) break;
            revealAgentCaption(event.text, event.duration_ms ?? event.estimated_duration_ms);
            scheduleDeviceTtsFallback(event.text);
          }
          break;

        case 'rail.voice.audio_missing':
          replyAudioMissingRef.current = true;
          canPlayReplyAudioRef.current = true;
          setVoiceState('speaking');
          break;

        case 'reply.done':
          if (event.status === 'interrupted') {
            flushPlayback();
            setVoiceState('listening');
          } else if (deviceTtsActiveRef.current || ttsFallbackTimerRef.current) {
            canPlayReplyAudioRef.current = false;
          } else if (replyAudioDurationMsRef.current <= 0 && replyAudioMissingRef.current) {
            canPlayReplyAudioRef.current = false;
            jitterBufferRef.current.stop();
          } else {
            finishPcmPlayback();
          }
          break;

        case 'rail.session.ended':
          canPlayReplyAudioRef.current = false;
          jitterBufferRef.current.stop();
          stopDeviceSpeech();
          setVoiceState('idle');
          break;

        case 'session.error':
          setError(event.message ?? 'Voice error');
          setVoiceState('error');
          break;
      }
    },
    [
      clearTtsFallbackTimer,
      finishPcmPlayback,
      flushPlayback,
      muteMic,
      revealAgentCaption,
      scheduleDeviceTtsFallback,
      setVoiceState,
      stopDeviceSpeech,
    ]
  );

  const scheduleReconnect = useCallback(() => {
    if (!hasSettledRef.current) return;
    if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
      logger.error('[VoiceSession] Max reconnect attempts reached', {
        component: 'useVoiceSession',
        action: 'reconnect-limit',
        attempts: reconnectAttemptRef.current,
      });
      setVoiceState('error');
      setError('Voice connection lost');
      return;
    }
    const delay = Math.min(
      RECONNECT_BASE_DELAY_MS * Math.pow(2, reconnectAttemptRef.current),
      RECONNECT_MAX_DELAY_MS
    );
    reconnectAttemptRef.current += 1;

    logger.info('[VoiceSession] Scheduling reconnect attempt', {
      component: 'useVoiceSession',
      action: 'reconnect-schedule',
      attempt: reconnectAttemptRef.current,
      delayMs: delay,
    });

    reconnectTimerRef.current = setTimeout(async () => {
      reconnectTimerRef.current = null;
      if (!hasSettledRef.current) return;

      let sessionToken = '';
      try {
        const ticket = await aiService.createVoiceSessionToken();
        sessionToken = ticket.token;
      } catch (err) {
        logger.error('[VoiceSession] Reconnect failed to get token', {
          component: 'useVoiceSession',
          action: 'reconnect-token',
          error: safeVoiceErrorMessage(err),
        });
        if (!hasSettledRef.current) return;
        setVoiceState('error');
        setError('Voice connection lost');
        return;
      }

      if (!hasSettledRef.current) return;

      const httpBase = API_CONFIG.baseURL;
      const wsBase = httpBase.replace(/^http/, 'ws');
      const url = `${wsBase}/v1/ai/voice/session?voice_session_token=${encodeURIComponent(sessionToken)}`;

      const ws = new WebSocket(url);
      wsRef.current = ws;
      const thisGen = ++wsGenerationRef.current;

      ws.onmessage = (e) => {
        try {
          handleEvent(JSON.parse(e.data));
        } catch (err) {
          logger.error('[VoiceSession] Failed to parse WS event', {
            component: 'useVoiceSession',
            action: 'reconnect-onmessage',
            data: typeof e.data === 'string' ? e.data.substring(0, 200) : 'non-text',
          });
        }
      };
      ws.onerror = (err) => {
        logger.error('[VoiceSession] Reconnect WS error', {
          component: 'useVoiceSession',
          action: 'reconnect-onerror',
        });
      };
      ws.onopen = () => {
        reconnectAttemptRef.current = 0;
        startHeartbeat(ws);
        setVoiceState('listening');
      };
      ws.onclose = () => {
        if (!hasSettledRef.current) return;
        if (wsGenerationRef.current !== thisGen) return;
        scheduleReconnectRef.current();
      };
    }, delay);
  }, [handleEvent, startHeartbeat]);

  scheduleReconnectRef.current = scheduleReconnect;

  const connect = useCallback(async () => {
    cleanup();
    hasSettledRef.current = true;
    isTornDownRef.current = false;
    reconnectAttemptRef.current = 0;

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
      isTornDownRef.current = true;
    } catch {
      setError('Failed to initialize audio');
      setVoiceState('error');
      return;
    }

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
    let tokenExpiresAt = '';
    try {
      const ticket = await aiService.createVoiceSessionToken();
      sessionToken = ticket.token;
      tokenExpiresAt = ticket.expires_at;
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

    if (tokenExpiresAt) {
      const expiryMs = new Date(tokenExpiresAt).getTime();
      const graceMs = 10000;
      if (expiryMs - Date.now() < graceMs) {
        activeRef.current = false;
        try {
          toggleRecording(false);
        } catch {}
        setError('Voice session token expired, please try again');
        setVoiceState('error');
        return;
      }
    }

    const httpBase = API_CONFIG.baseURL;
    const wsBase = httpBase.replace(/^http/, 'ws');
    const url = `${wsBase}/v1/ai/voice/session?voice_session_token=${encodeURIComponent(sessionToken)}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;
    const thisGen = ++wsGenerationRef.current;

    ws.onmessage = (e) => {
      try {
        handleEvent(JSON.parse(e.data));
      } catch (err) {
        logger.error('[VoiceSession] Failed to parse WS event', {
          component: 'useVoiceSession',
          action: 'connect-onmessage',
          data: typeof e.data === 'string' ? e.data.substring(0, 200) : 'non-text',
        });
      }
    };

    ws.onopen = () => {
      reconnectAttemptRef.current = 0;
      startHeartbeat(ws);
    };

    ws.onerror = (err) => {
      logger.error('[VoiceSession] Connect WS error', {
        component: 'useVoiceSession',
        action: 'connect-onerror',
      });
      setError('Connection failed');
      setVoiceState('error');
    };

    ws.onclose = () => {
      if (wsGenerationRef.current !== thisGen) return;
      activeRef.current = false;
      try {
        toggleRecording(false);
      } catch {}
      stopHeartbeat();
      if (stateRef.current !== 'error') {
        scheduleReconnectRef.current();
      } else {
        setVoiceState('idle');
      }
    };
  }, [cleanup, handleEvent, setVoiceState, startHeartbeat]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    cleanup();
  }, [cleanup]);

  useEffect(
    () => () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
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
