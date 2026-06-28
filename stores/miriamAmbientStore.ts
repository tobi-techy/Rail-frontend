import { create } from 'zustand';

/**
 * Ambient "Hey Miriam" state. Miriam lives in the background of the app: when
 * enabled, an on-device wake-word engine listens for "Hey Miriam" and, on a
 * match, a live voice session starts in place — no navigation to a chat screen.
 * The status drives the global AmbientGlow (edge shimmer while listening,
 * pulse while speaking).
 */
export type AmbientStatus =
  | 'dormant' // wake-word engine listening, no glow
  | 'waking' // wake word heard, session spinning up
  | 'listening' // session live, user can speak
  | 'thinking' // a tool is running
  | 'speaking'; // Miriam is talking

interface MiriamAmbientState {
  /** Whether the wake-word engine should be running (homescreen + foreground + user setting). */
  enabled: boolean;
  status: AmbientStatus;
  setEnabled: (v: boolean) => void;
  setStatus: (s: AmbientStatus) => void;
  /** Convenience: is a live session active (anything past dormant). */
  isActive: () => boolean;
}

export const useMiriamAmbientStore = create<MiriamAmbientState>((set, get) => ({
  enabled: false,
  status: 'dormant',
  setEnabled: (v) => set({ enabled: v, status: v ? get().status : 'dormant' }),
  setStatus: (status) => set({ status }),
  isActive: () => get().status !== 'dormant',
}));

export function setAmbientStatus(status: AmbientStatus) {
  useMiriamAmbientStore.getState().setStatus(status);
}
