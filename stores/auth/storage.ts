import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '../../utils/secureStorage';

const SECURE_KEYS = ['accessToken', 'refreshToken', 'passcodeSessionToken'] as const;
const SECURE_VALUE_PLACEHOLDER = '__secure__';

export const createSecureStorage = () => ({
  getItem: async (name: string) => {
    try {
      const data = await AsyncStorage.getItem(name);
      if (!data) return null;

      const parsed = JSON.parse(data);

      const shouldHydrateAuthTokens = Boolean(parsed?.isAuthenticated);

      for (const key of SECURE_KEYS) {
        const shouldHydrateKey =
          key === 'passcodeSessionToken'
            ? shouldHydrateAuthTokens && !!parsed?.passcodeSessionExpiresAt
            : shouldHydrateAuthTokens;

        if (!shouldHydrateKey) {
          parsed[key] = key === 'passcodeSessionToken' ? undefined : null;
          continue;
        }

        const secureValue = await secureStorage.getItem(`${name}_${key}`);
        if (secureValue) {
          parsed[key] = secureValue;
          continue;
        }

        const currentValue = parsed[key];
        const hasLegacyPlainValue = typeof currentValue === 'string';
        const isPlaceholder = currentValue === SECURE_VALUE_PLACEHOLDER;
        if (isPlaceholder || !hasLegacyPlainValue) {
          parsed[key] = key === 'passcodeSessionToken' ? undefined : null;
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
        const secureKey = `${name}_${key}`;
        const keyValue = toStore[key];

        if (typeof keyValue === 'string' && keyValue.length > 0) {
          await secureStorage.setItem(secureKey, keyValue);
          toStore[key] = SECURE_VALUE_PLACEHOLDER;
        } else {
          await secureStorage.deleteItem(secureKey);
          if (key === 'passcodeSessionToken') {
            delete toStore[key];
          } else {
            toStore[key] = null;
          }
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
