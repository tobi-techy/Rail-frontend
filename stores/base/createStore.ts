import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '@/utils/secureStorage';

interface StoreOptions {
  persist?: boolean;
  encrypt?: boolean;
  partialize?: (state: any) => any;
}

export function createDomainStore<State extends object, Actions extends object>(
  name: string,
  initialState: State,
  actions: (set: any, get: any) => Actions,
  options?: StoreOptions
) {
  const storeCreator = (set: any, get: any) => ({
    ...initialState,
    ...actions(set, get),
  });

  if (!options?.persist) {
    return create<State & Actions>()(storeCreator);
  }

  const storage = options.encrypt ? createSecureStorage(name) : createJSONStorage(() => AsyncStorage);

  return create<State & Actions>()(
    persist(storeCreator, {
      name: `${name}-storage`,
      storage,
      partialize: options.partialize,
    })
  );
}

function createSecureStorage(name: string) {
  return {
    getItem: async (key: string) => {
      try {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.accessToken) {
            parsed.accessToken = await secureStorage.getItem(`${key}_accessToken`);
          }
          if (parsed.refreshToken) {
            parsed.refreshToken = await secureStorage.getItem(`${key}_refreshToken`);
          }
          return parsed;
        }
        return null;
      } catch {
        return null;
      }
    },
    setItem: async (key: string, value: any) => {
      try {
        if (value.accessToken) {
          await secureStorage.setItem(`${key}_accessToken`, value.accessToken);
          delete value.accessToken;
        }
        if (value.refreshToken) {
          await secureStorage.setItem(`${key}_refreshToken`, value.refreshToken);
          delete value.refreshToken;
        }
        await AsyncStorage.setItem(key, JSON.stringify(value));
      } catch {}
    },
    removeItem: async (key: string) => {
      await AsyncStorage.removeItem(key);
      await secureStorage.deleteItem(`${key}_accessToken`);
      await secureStorage.deleteItem(`${key}_refreshToken`);
    },
  };
}
