import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { InsightCard } from '@/api/types/ai';

export interface HubAction {
  id: string;
  type: string;
  description: string;
  status: 'pending' | 'confirmed' | 'failed' | 'scheduled';
  createdAt: string;
  completedAt?: string;
  params?: Record<string, any>;
}

export interface PinnedInsight {
  id: string;
  card: InsightCard;
  conversationId?: string;
  messageId?: string;
  pinnedAt: string;
  note?: string;
}

interface MiriamHubState {
  pinnedInsights: PinnedInsight[];
  activeActions: HubAction[];
  archivedActions: HubAction[];
  unreadInsights: number;
  lastVisitedAt: string | null;
}

interface MiriamHubActions {
  pinInsight: (insight: PinnedInsight) => void;
  unpinInsight: (id: string) => void;
  addAction: (action: HubAction) => void;
  updateActionStatus: (id: string, status: HubAction['status']) => void;
  archiveAction: (id: string) => void;
  markVisited: () => void;
  incrementUnread: () => void;
  clearUnread: () => void;
  reset: () => void;
}

const initialState: MiriamHubState = {
  pinnedInsights: [],
  activeActions: [],
  archivedActions: [],
  unreadInsights: 0,
  lastVisitedAt: null,
};

export const useMiriamHubStore = create<MiriamHubState & MiriamHubActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      pinInsight: (insight) => {
        set((s) => {
          // Prevent duplicates
          if (s.pinnedInsights.some((p) => p.id === insight.id)) return s;
          return {
            pinnedInsights: [insight, ...s.pinnedInsights].slice(0, 20),
            unreadInsights: s.unreadInsights + 1,
          };
        });
      },

      unpinInsight: (id) => {
        set((s) => ({
          pinnedInsights: s.pinnedInsights.filter((p) => p.id !== id),
        }));
      },

      addAction: (action) => {
        set((s) => ({
          activeActions: [action, ...s.activeActions].slice(0, 50),
        }));
      },

      updateActionStatus: (id, status) => {
        set((s) => ({
          activeActions: s.activeActions.map((a) =>
            a.id === id
              ? { ...a, status, completedAt: status === 'confirmed' || status === 'failed' ? new Date().toISOString() : a.completedAt }
              : a
          ),
        }));
      },

      archiveAction: (id) => {
        set((s) => {
          const action = s.activeActions.find((a) => a.id === id);
          if (!action) return s;
          return {
            activeActions: s.activeActions.filter((a) => a.id !== id),
            archivedActions: [action, ...s.archivedActions].slice(0, 100),
          };
        });
      },

      markVisited: () => {
        set({ lastVisitedAt: new Date().toISOString() });
      },

      incrementUnread: () => {
        set((s) => ({ unreadInsights: s.unreadInsights + 1 }));
      },

      clearUnread: () => {
        set({ unreadInsights: 0 });
      },

      reset: () => set(initialState),
    }),
    {
      name: 'miriam-hub-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);
