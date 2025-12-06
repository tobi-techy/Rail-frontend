import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UIState {
  isBalanceVisible: boolean;
}

interface UIActions {
  toggleBalanceVisibility: () => void;
  setBalanceVisibility: (visible: boolean) => void;
}

const initialState: UIState = {
  isBalanceVisible: true,
};

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      ...initialState,

      toggleBalanceVisibility: () => {
        set((state) => ({ isBalanceVisible: !state.isBalanceVisible }));
      },

      setBalanceVisibility: (visible: boolean) => {
        set({ isBalanceVisible: visible });
      },
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isBalanceVisible: state.isBalanceVisible,
      }),
    }
  )
);

