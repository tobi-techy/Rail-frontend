import { useCallback } from 'react';
import { Presets } from 'react-native-pulsar';

/** Centralized haptic feedback for the AI chat experience. */
export function useAIHaptics() {
  const onSend = useCallback(() => Presets.propel(), []);
  const onReceive = useCallback(() => Presets.bloom(), []);
  const onTap = useCallback(() => Presets.peck(), []);
  const onLike = useCallback(() => Presets.chirp(), []);
  const onDelete = useCallback(() => Presets.cleave(), []);
  const onSwipe = useCallback(() => Presets.flick(), []);
  const onError = useCallback(() => Presets.wobble(), []);
  const onNewThread = useCallback(() => Presets.dewdrop(), []);

  return { onSend, onReceive, onTap, onLike, onDelete, onSwipe, onError, onNewThread };
}
