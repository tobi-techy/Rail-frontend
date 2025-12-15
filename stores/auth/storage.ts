import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '../../utils/secureStorage';

const SECURE_KEYS = ['accessToken', 'refreshToken', 'passcodeSessionToken'] as const;

export const createSecureStorage = () => ({
  getItem: async (name: string) => {
    try {
      const data = await AsyncStorage.getItem(name);
      if (!data) return null;

      const parsed = JSON.parse(data);
      
      for (const key of SECURE_KEYS) {
        if (parsed[key]) {
          parsed[key] = await secureStorage.getItem(`${name}_${key}`);
        }
      }
      return parsed;
    } catch {
      return null;
    }
  },

  setItem: async (name: string, value: Record<string, unknown>) => {
    try {
      const toStore = { ...value };
      
      for (const key of SECURE_KEYS) {
        if (toStore[key]) {
          await secureStorage.setItem(`${name}_${key}`, toStore[key] as string);
          delete toStore[key];
        }
      }
      await AsyncStorage.setItem(name, JSON.stringify(toStore));
    } catch {
      // Silent fail
    }
  },

  removeItem: async (name: string) => {
    try {
      await AsyncStorage.removeItem(name);
      for (const key of SECURE_KEYS) {
        await secureStorage.deleteItem(`${name}_${key}`);
      }
    } catch {
      // Silent fail
    }
  },
});
