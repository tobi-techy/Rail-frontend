import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { logger } from '@/lib/logger';

/**
 * Lightweight one-shot sound effects for the Miriam chat, in the spirit of
 * iMessage's send/receive tones. Players are created lazily and reused.
 *
 * Sounds intentionally respect the iOS mute switch (we do not force playback in
 * silent mode), exactly like Messages.
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

const players: Partial<Record<ChatSound, AudioPlayer>> = {};
let enabled = true;

export function setChatSoundsEnabled(value: boolean) {
  enabled = value;
}

function getPlayer(name: ChatSound): AudioPlayer | null {
  if (players[name]) return players[name] ?? null;
  try {
    const player = createAudioPlayer(SOURCES[name]);
    player.volume = name === 'receive' ? 0.85 : 0.75;
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
  try {
    player.seekTo(0);
    player.play();
  } catch (error) {
    logger.warn('chatSounds: failed to play', { name, error });
  }
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
