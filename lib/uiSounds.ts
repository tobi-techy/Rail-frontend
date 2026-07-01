import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { logger } from '@/lib/logger';

/**
 * App-wide UI sound effects (distinct from the Miriam chat tones in
 * `chatSounds.ts`). Players are created lazily and reused so taps stay snappy.
 *
 * Like the system keyboard, these respect the iOS mute switch — we never force
 * playback in silent mode.
 */
export type UISound = 'keypress' | 'transactionSuccess';

const SOURCES: Record<UISound, number> = {
  // Soft typing tick for keypad / passcode entry.
  keypress: require('../assets/sounds/keypress.wav'),
  // Celebratory chime for completed transactions.
  transactionSuccess: require('../assets/sounds/transaction-success.wav'),
};

const VOLUME: Record<UISound, number> = {
  keypress: 0.4,
  transactionSuccess: 0.8,
};

const players: Partial<Record<UISound, AudioPlayer>> = {};
let enabled = true;

export function setUISoundsEnabled(value: boolean) {
  enabled = value;
}

function getPlayer(name: UISound): AudioPlayer | null {
  if (players[name]) return players[name] ?? null;
  try {
    const player = createAudioPlayer(SOURCES[name]);
    player.volume = VOLUME[name];
    players[name] = player;
    return player;
  } catch (error) {
    logger.warn('uiSounds: failed to create player', { name, error });
    return null;
  }
}

export function playUISound(name: UISound) {
  if (!enabled) return;
  const player = getPlayer(name);
  if (!player) return;
  try {
    player.seekTo(0);
    player.play();
  } catch (error) {
    logger.warn('uiSounds: failed to play', { name, error });
  }
}

export function releaseUISounds() {
  (Object.keys(players) as UISound[]).forEach((name) => {
    try {
      players[name]?.remove();
    } catch {
      /* noop */
    }
    delete players[name];
  });
}
