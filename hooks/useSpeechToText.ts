import { useState, useCallback, useRef } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from '@jamsch/expo-speech-recognition';
import * as Haptics from '@/utils/platformHaptics';

interface UseSpeechToTextOptions {
  onResult: (transcript: string) => void;
  lang?: string;
}

export function useSpeechToText({ onResult, lang = 'en-US' }: UseSpeechToTextOptions) {
  const [isListening, setIsListening] = useState(false);
  const resultRef = useRef('');

  useSpeechRecognitionEvent('result', (event) => {
    const result = event.results[0];
    const transcript = result?.transcript ?? '';
    if (transcript) {
      resultRef.current = transcript;
      onResult(transcript);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent('error', () => {
    setIsListening(false);
  });

  const startListening = useCallback(async () => {
    try {
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) return;
      resultRef.current = '';
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      ExpoSpeechRecognitionModule.start({ lang, interimResults: true, continuous: true });
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  }, [lang]);

  const stopListening = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // Module may already be stopped
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsListening(false);
  }, []);

  return { isListening, startListening, stopListening };
}
