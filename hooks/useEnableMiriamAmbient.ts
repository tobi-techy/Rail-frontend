import { useCallback } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useMiriamAmbientStore } from '@/stores/miriamAmbientStore';

/**
 * Enables the "Hey Miriam" wake-word engine while the calling screen is focused
 * and the app is foregrounded. Drop into any screen where voice feels natural.
 * The homescreen uses this via `useAmbientHomescreen`.
 */
export function useEnableMiriamAmbient() {
  const setEnabled = useMiriamAmbientStore((s) => s.setEnabled);

  useFocusEffect(
    useCallback(() => {
      setEnabled(AppState.currentState === 'active');
      const sub = AppState.addEventListener('change', (s) => setEnabled(s === 'active'));
      return () => {
        sub.remove();
        setEnabled(false);
      };
    }, [setEnabled])
  );
}
