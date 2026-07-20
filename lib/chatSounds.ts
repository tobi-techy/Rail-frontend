import { Platform } from 'react-native';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { logger } from '@/lib/logger';

/**
 * Lightweight one-shot sound effects for the Miriam chat, in the spirit of
 * iMessage's send/receive tones. Players are created lazily and reused.
 *
 * Platform notes:
 *   - iOS: Respects the mute/silent switch (we do not force playback in silent
 *     mode), exactly like Messages.
 *   - Android: Uses slightly higher volumes to match iOS perceived loudness due
 *     to Android's system-level audio attenuation on UI sounds. Playback delay
 *     is bumped to 16ms (one frame) to avoid first-tap clipping on lower-end
 *     devices where AudioTrack has higher startup latency.
 */
export type ChatSound = 'send' | 'receive' | 'confirm' | 'celebrate';

const SOURCES: Record<ChatSound, number> = {
  send: require('../assets/sounds/send.wav'),
  receive: require('../assets/sounds/receive.wav'),
  confirm: require('../assets/sounds/confirm.wav'),
  // No dedicated celebration tone yet — reuse confirm. Drop a `celebrate.wav`
  // into assets/sounds/ and point this there for the full payoff.
  celebrate: require('../assets/sounds/confirm.wav'),
};

/**
 * Platform-specific volumes.
 * iOS cues are calibrated at 0.75-0.85. Android gets a ~15% boost to match
 * perceived loudness across OEMs.
 */
const VOLUME: Record<ChatSound, number> = Platform.select({
  ios: { send: 0.75, receive: 0.85, confirm: 0.75, celebrate: 0.75 },
  default: { send: 0.85, receive: 0.95, confirm: 0.85, celebrate: 0.85 },
})!;

/** Android needs a small delay to avoid first-tap audio clipping. */
const PLAYBACK_DELAY = Platform.OS === 'android' ? 16 : 0;

const players: Partial<Record<ChatSound, AudioPlayer>> = {};
let enabled = true;

export function setChatSoundsEnabled(value: boolean) {
  enabled = value;
}

function getPlayer(name: ChatSound): AudioPlayer | null {
  if (players[name]) return players[name] ?? null;
  try {
    const player = createAudioPlayer(SOURCES[name]);
    player.volume = VOLUME[name];
    players[name] = player;
    return player;
  } catch (error) {
    logger.warn('chatSounds: failed to create player', { name, error });
    return null;
  }
}

export function playChatSound(name: ChatSound) {
  if (!enabled) return;
  const player = getPlayer(name);
  if (!player) return;
  setTimeout(() => {
    try {
      player.seekTo(0);
      player.play();
    } catch (error) {
      logger.warn('chatSounds: failed to play', { name, error });
    }
  }, PLAYBACK_DELAY);
}

export function releaseChatSounds() {
  (Object.keys(players) as ChatSound[]).forEach((name) => {
    try {
      players[name]?.remove();
    } catch {
      /* noop */
    }
    delete players[name];
  });
}
