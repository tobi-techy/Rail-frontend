import { useRef, useState, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useAuthStore } from '@/stores/authStore';
import { API_CONFIG } from '@/api/config';

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

interface VoiceEvent {
  type: string;
  [key: string]: any;
}

export function useVoiceSession() {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [responseText, setResponseText] = useState('');
  const [error, setError] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const audioChunksRef = useRef<string[]>([]);

  const cleanup = useCallback(async () => {
    if (recordingRef.current) {
      try { await recordingRef.current.stopAndUnloadAsync(); } catch {}
      recordingRef.current = null;
    }
    if (soundRef.current) {
      try { await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setState('idle');
    setTranscript('');
    setResponseText('');
    audioChunksRef.current = [];
  }, []);

  const connect = useCallback(async () => {
    await cleanup();
    setState('connecting');
    setError('');

    // Request mic permission
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      setError('Microphone permission required');
      setState('error');
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    // Build WebSocket URL
    const httpBase = API_CONFIG.baseURL;
    const wsBase = httpBase.replace(/^http/, 'ws');
    const token = useAuthStore.getState().accessToken;
    const url = `${wsBase}/v1/ai/voice/session?token=${token}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setState('listening');
      startRecording();
    };

    ws.onmessage = (e) => {
      try {
        const event: VoiceEvent = JSON.parse(e.data);
        handleServerEvent(event);
      } catch {}
    };

    ws.onerror = () => {
      setError('Voice connection failed');
      setState('error');
    };

    ws.onclose = () => {
      if (state !== 'idle') setState('idle');
    };
  }, [cleanup]);

  const handleServerEvent = useCallback((event: VoiceEvent) => {
    switch (event.type) {
      case 'session.created':
      case 'session.updated':
        break;

      case 'input_audio_buffer.speech_started':
        setState('listening');
        setResponseText('');
        audioChunksRef.current = [];
        break;

      case 'input_audio_buffer.speech_stopped':
        setState('thinking');
        break;

      case 'conversation.item.input_audio_transcription.completed':
        setTranscript(event.transcript ?? '');
        break;

      case 'response.audio_transcript.delta':
        setResponseText((prev) => prev + (event.delta ?? ''));
        break;

      case 'response.audio.delta':
        // Collect audio chunks for playback
        if (event.delta) {
          audioChunksRef.current.push(event.delta);
          setState('speaking');
        }
        break;

      case 'response.audio.done':
        playAudioResponse();
        break;

      case 'response.done':
        setState('listening');
        break;

      case 'error':
        setError(event.error?.message ?? 'Voice error');
        setState('error');
        break;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 24000,
          numberOfChannels: 1,
          bitRate: 384000,
        },
        ios: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 24000,
          numberOfChannels: 1,
          bitRate: 384000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });

      // Stream audio chunks to WebSocket via status updates
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording && status.metering !== null) {
          // expo-av doesn't give raw PCM in status updates on RN
          // We use a polling approach instead
        }
      });

      await recording.startAsync();
      recordingRef.current = recording;

      // Poll and send audio chunks every 250ms
      pollAndSendAudio();
    } catch {
      setError('Failed to start recording');
      setState('error');
    }
  }, []);

  const pollAndSendAudio = useCallback(async () => {
    const sendChunk = async () => {
      const recording = recordingRef.current;
      const ws = wsRef.current;
      if (!recording || !ws || ws.readyState !== WebSocket.OPEN) return;

      try {
        // Stop current recording, get URI, send, restart
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();

        if (uri) {
          // Read file as base64 and send
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: 'base64',
          });

          ws.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64,
          }));
        }

        // Start new recording segment
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const newRecording = new Audio.Recording();
          await newRecording.prepareToRecordAsync({
            ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
            ios: {
              ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
              extension: '.wav',
              outputFormat: Audio.IOSOutputFormat.LINEARPCM,
              sampleRate: 24000,
              numberOfChannels: 1,
              bitRate: 384000,
              linearPCMBitDepth: 16,
              linearPCMIsBigEndian: false,
              linearPCMIsFloat: false,
            },
            android: {
              ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
              extension: '.wav',
              sampleRate: 24000,
              numberOfChannels: 1,
              bitRate: 384000,
            },
            web: {},
          });
          await newRecording.startAsync();
          recordingRef.current = newRecording;

          // Schedule next chunk
          setTimeout(sendChunk, 250);
        }
      } catch {
        // Recording may have been cleaned up
      }
    };

    setTimeout(sendChunk, 250);
  }, []);

  const playAudioResponse = useCallback(async () => {
    // For now, audio playback from base64 PCM chunks requires native module
    // The transcript is displayed as text fallback
    // TODO: Implement PCM16 base64 → audio playback
    audioChunksRef.current = [];
  }, []);

  const disconnect = useCallback(async () => {
    await cleanup();
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { cleanup(); };
  }, []);

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
