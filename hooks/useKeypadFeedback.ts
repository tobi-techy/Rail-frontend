import { useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

const popSound = require('@/assets/sounds/pop.mp3');

let sharedSound: Audio.Sound | null = null;
let soundLoading = false;
let audioModeSet = false;

async function ensureAudioMode() {
  if (audioModeSet) return;
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
  });
  audioModeSet = true;
}

async function getSound() {
  if (sharedSound) return sharedSound;
  if (soundLoading) return null;

  soundLoading = true;
  try {
    await ensureAudioMode();
    const { sound } = await Audio.Sound.createAsync(popSound, { volume: 0.6 });
    sharedSound = sound;
    return sound;
  } catch {
    soundLoading = false;
    return null;
  }
}

export function useKeypadFeedback() {
  const trigger = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const sound = await getSound();
    if (sound) {
      await sound.setPositionAsync(0);
      await sound.playAsync();
    }
  }, []);

  return trigger;
}
