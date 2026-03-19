/**
 * @deprecated This storage implementation is kept for test coverage only.
 * Production code uses the createSecureStorage defined inline in stores/authStore.ts,
 * which includes retry logic. Do not use this in new code.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '../../utils/secureStorage';
import { logger } from '../../lib/logger';

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
    } catch (error) {
      logger.error('[SecureStorage] setItem failed — tokens may not be persisted', {
        component: 'SecureStorage',
        action: 'setItem-error',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
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
