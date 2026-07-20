import { create } from 'zustand';

/**
 * Controls the "Meet Miriam on iMessage" intro sheet. The Miriam tab-bar button
 * opens it; the sheet is hosted once in the tabs layout.
 */
interface MiriamIntroState {
  visible: boolean;
  open: () => void;
  close: () => void;
}

export const useMiriamIntro = create<MiriamIntroState>((set) => ({
  visible: false,
  open: () => set({ visible: true }),
  close: () => set({ visible: false }),
}));
