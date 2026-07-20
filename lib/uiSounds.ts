import { Platform } from 'react-native';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { logger } from '@/lib/logger';

/**
 * App-wide UI sound effects (distinct from the Miriam chat tones in
 * `chatSounds.ts`). Players are created lazily and reused so taps stay snappy.
 *
 * Platform notes:
 *   - iOS: Respects the mute/silent switch — we never force playback in silent
 *     mode. Audio uses the "Playback" category so it plays through the speaker
 *     even when headphones are connected.
 *   - Android: Uses the "Sonification" audio attribute so sounds mix with other
 *     media and respect Do Not Disturb. We bump the deferred-playback delay to
 *     ~16ms (one frame) because Android's AudioTrack pipeline has higher startup
 *     latency than iOS's AVAudioEngine, and the 0ms setTimeout sometimes
 *     produces a clipped or silent first tap on lower-end devices.
 */
/**
 * The Cuelume interaction palette (MIT, © Daniel Belyi —
 * https://cuelume-site.pages.dev). Cuelume synthesizes these live via Web Audio,
 * which doesn't exist in React Native, so we pre-render each cue to a normalized
 * .wav (see scripts/export-cuelume-sounds.mjs) and play them through expo-audio.
 */
export type CuelumeSound =
  | 'chime'
  | 'sparkle'
  | 'droplet'
  | 'bloom'
  | 'whisper'
  | 'tick'
  | 'press'
  | 'release'
  | 'toggle'
  | 'success'
  | 'error'
  | 'page'
  | 'loading'
  | 'ready';

const CUELUME_SOURCES: Record<CuelumeSound, number> = {
  chime: require('../assets/sounds/cuelume/chime.wav'),
  sparkle: require('../assets/sounds/cuelume/sparkle.wav'),
  droplet: require('../assets/sounds/cuelume/droplet.wav'),
  bloom: require('../assets/sounds/cuelume/bloom.wav'),
  whisper: require('../assets/sounds/cuelume/whisper.wav'),
  tick: require('../assets/sounds/cuelume/tick.wav'),
  press: require('../assets/sounds/cuelume/press.wav'),
  release: require('../assets/sounds/cuelume/release.wav'),
  toggle: require('../assets/sounds/cuelume/toggle.wav'),
  success: require('../assets/sounds/cuelume/success.wav'),
  error: require('../assets/sounds/cuelume/error.wav'),
  page: require('../assets/sounds/cuelume/page.wav'),
  loading: require('../assets/sounds/cuelume/loading.wav'),
  ready: require('../assets/sounds/cuelume/ready.wav'),
};

export type UISound =
  | 'keypress'
  | 'transactionSuccess'
  | 'buttonClick'
  | 'holdToSend'
  | 'toggle'
  | 'dismiss'
  | 'error'
  | 'pageTurn';

// Semantic UI events → Cuelume cues. Callers use these stable names; the cue
// behind each one is a one-line design decision that lives here.
const SEMANTIC_CUE: Record<UISound, CuelumeSound> = {
  // Crisp, instant tick for keypad / passcode entry.
  keypress: 'tick',
  // Short warm three-note "done" for completed transactions.
  transactionSuccess: 'success',
  // Muted tactile knock for button presses.
  buttonClick: 'press',
  // Soft ascending bell to confirm irreversible money movement.
  holdToSend: 'chime',
  // Mechanical click-clack for switches and tabs.
  toggle: 'toggle',
  // Single note gliding down for dismissals and back navigation.
  dismiss: 'droplet',
  // Calm knock + descending tones for recoverable errors.
  error: 'error',
  // Papery flick for page/carousel transitions.
  pageTurn: 'page',
};

const SOURCES: Record<UISound, number> = {
  keypress: CUELUME_SOURCES[SEMANTIC_CUE.keypress],
  transactionSuccess: CUELUME_SOURCES[SEMANTIC_CUE.transactionSuccess],
  buttonClick: CUELUME_SOURCES[SEMANTIC_CUE.buttonClick],
  holdToSend: CUELUME_SOURCES[SEMANTIC_CUE.holdToSend],
  toggle: CUELUME_SOURCES[SEMANTIC_CUE.toggle],
  dismiss: CUELUME_SOURCES[SEMANTIC_CUE.dismiss],
  error: CUELUME_SOURCES[SEMANTIC_CUE.error],
  pageTurn: CUELUME_SOURCES[SEMANTIC_CUE.pageTurn],
};

/**
 * Platform-specific volumes.
 *
 * iOS Cuelume cues are peak-normalized and play at full volume through the
 * speaker. Android's audio pipeline applies a system-level attenuation to UI
 * sounds on many OEMs, so we boost them slightly to match the perceived loudness
 * of iOS. The boost is conservative — +15% — to avoid clipping on devices with
 * aggressive loudness limiters (Pixel, Samsung).
 */
const VOLUME: Record<UISound, number> = Platform.select({
  ios: {
    keypress: 1,
    transactionSuccess: 1,
    buttonClick: 1,
    holdToSend: 1,
    toggle: 1,
    dismiss: 1,
    error: 1,
    pageTurn: 1,
  },
  default: {
    keypress: 1.15,
    transactionSuccess: 1.15,
    buttonClick: 1.15,
    holdToSend: 1.15,
    toggle: 1.15,
    dismiss: 1.15,
    error: 1.15,
    pageTurn: 1.15,
  },
})!;

/**
 * Deferred-playback delay (ms).
 *
 * On iOS, `setTimeout(0)` is enough — the native audio pipeline starts
 * synchronously and the UI commit happens in the same frame. On Android,
 * `AudioTrack` has a ~10-20ms setup cost that can cause the first few
 * milliseconds of audio to be clipped or entirely silent if we play
 * immediately. Bumping to 16ms (one frame at 60fps) gives the JS thread
 * enough room to finish the press handler commit before audio playback
 * begins, resulting in a crisp tap on all Android devices we tested.
 */
const PLAYBACK_DELAY = Platform.OS === 'android' ? 16 : 0;

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
  // Defer the actual playback off the interaction handler. seekTo/play touch the
  // native audio pipeline synchronously; running them inline makes the tap that
  // triggered the sound feel stuck. The platform-specific delay lets the press
  // handler and its state update commit first, so the UI stays responsive.
  setTimeout(() => {
    try {
      player.seekTo(0);
      player.play();
    } catch (error) {
      logger.warn('uiSounds: failed to play', { name, error });
    }
  }, PLAYBACK_DELAY);
}

/**
 * Eagerly create every UI sound player. Player creation is the expensive part
 * (it decodes the asset), so doing it once at startup keeps the first tap on the
 * keypad / a sheet / a button snappy instead of paying the cost on first press.
 */
export function warmUpUISounds() {
  (Object.keys(SOURCES) as UISound[]).forEach((name) => {
    try {
      getPlayer(name);
    } catch {
      /* noop — playback path re-attempts lazily */
    }
  });
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
