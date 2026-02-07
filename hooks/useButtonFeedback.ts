import { useCallback } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

const tapSound = require('@/assets/sounds/tap.mp3');

let sharedSound: Audio.Sound | null = null;
let soundLoading = false;

async function getSound() {
  if (sharedSound) return sharedSound;
  if (soundLoading) return null;

  soundLoading = true;
  try {
    const { sound } = await Audio.Sound.createAsync(tapSound, { volume: 0.5 });
    sharedSound = sound;
    return sound;
  } catch {
    soundLoading = false;
    return null;
  }
}

export function useButtonFeedback(enableSound = true, enableHaptics = true) {
  const trigger = useCallback(async () => {
    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (enableSound) {
      const sound = await getSound();
      if (sound) {
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    }
  }, [enableSound, enableHaptics]);

  return trigger;
}
