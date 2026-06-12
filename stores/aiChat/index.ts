import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialState, type AIChatStore } from './types';
import { createConversationSlice } from './conversations';
import { createStreamingSlice } from './streaming';
import { createStatementSlice } from './statements';

export type { AIChatState, AIChatActions, AIChatStore } from './types';

export const useAIChatStore = create<AIChatStore>()(
  persist(
    (set, get, api) => ({
      ...initialState,
      ...createConversationSlice(set, get, api),
      ...createStreamingSlice(set, get, api),
      ...createStatementSlice(set, get, api),
    }),
    {
      name: 'ai-chat-preferences',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ tonePreference: state.tonePreference }),
    }
  )
);
