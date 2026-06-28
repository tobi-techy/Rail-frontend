import { useCallback, useEffect, useRef } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from '@jamsch/expo-speech-recognition';
import { logger } from '@/lib/logger';

interface UseHeyMiriamOptions {
  /** Run the on-device wake-word engine (homescreen + foreground + setting on). */
  enabled: boolean;
  /** Fired once when "Hey Miriam" is detected. The caller takes the mic from here. */
  onWake: () => void;
}

// Tolerant of common mishearings ("hey meriam", "hey, miriam").
const WAKE_RE = /\bhey[\s,]*m[ei]ri?am\b/i;
const RESTART_DELAY_MS = 500;
const WAKE_COOLDOWN_MS = 3000;

/**
 * Always-on "Hey Miriam" wake-word listener. Uses on-device speech recognition
 * so raw audio never leaves the phone until the user calls her. Continuous mode
 * auto-stops periodically (esp. iOS); we transparently restart while enabled.
 * On a match we stop so the live voice session can claim the mic.
 */
export function useHeyMiriam({ enabled, onWake }: UseHeyMiriamOptions) {
  const enabledRef = useRef(enabled);
  const runningRef = useRef(false);
  const lastWakeRef = useRef(0);
  const restartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const start = useCallback(async () => {
    if (runningRef.current || !enabledRef.current) return;
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted || !enabledRef.current) return;
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: true,
        requiresOnDeviceRecognition: true,
        contextualStrings: ['Hey Miriam', 'Miriam'],
      });
      runningRef.current = true;
    } catch (e) {
      runningRef.current = false;
      logger.debug?.('[HeyMiriam] start failed', { error: String(e) });
    }
  }, []);

  const stop = useCallback(() => {
    runningRef.current = false;
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // already stopped
    }
  }, []);

  const scheduleRestart = useCallback(() => {
    if (restartTimer.current) clearTimeout(restartTimer.current);
    restartTimer.current = setTimeout(() => {
      if (enabledRef.current) start();
    }, RESTART_DELAY_MS);
  }, [start]);

  useSpeechRecognitionEvent('result', (event) => {
    if (!runningRef.current) return;
    const transcript = event.results?.[0]?.transcript ?? '';
    if (!transcript || !WAKE_RE.test(transcript)) return;
    const now = Date.now();
    if (now - lastWakeRef.current < WAKE_COOLDOWN_MS) return;
    lastWakeRef.current = now;
    stop();
    onWake();
  });

  useSpeechRecognitionEvent('end', () => {
    runningRef.current = false;
    if (enabledRef.current) scheduleRestart();
  });

  useSpeechRecognitionEvent('error', () => {
    runningRef.current = false;
    if (enabledRef.current) scheduleRestart();
  });

  useEffect(() => {
    if (enabled) start();
    else stop();
    return () => {
      if (restartTimer.current) clearTimeout(restartTimer.current);
      stop();
    };
  }, [enabled, start, stop]);
}
