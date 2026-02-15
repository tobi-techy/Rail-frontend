import * as SecureStore from 'expo-secure-store';
import { logger } from '@/lib/logger';

/**
 * Secure Storage Wrapper
 * SECURITY: Uses expo-secure-store which provides:
 * - Android: EncryptedSharedPreferences (hardware-backed when available)
 * - iOS: Keychain (hardware-backed via Secure Enclave on compatible devices)
 *
 * IMPORTANT: Biometric authentication (Face ID, Touch ID, fingerprint) is NOT stored here.
 * Instead, only biometric CREDENTIALS/TOKENS are stored, and device biometric is used
 * as a gateway to access those tokens. The actual biometric matching is handled by the OS.
 *
 * Data stored here should be SENSITIVE and NOT recoverable from device backups.
 */

export const secureStorage = {
  async setItem(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      logger.error('SecureStore setItem error', { component: 'SecureStorage', key, error });
      throw error;
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      logger.error('SecureStore getItem error', { component: 'SecureStorage', key, error });
      return null;
    }
  },

  async deleteItem(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      logger.error('SecureStore deleteItem error', { component: 'SecureStorage', key, error });
    }
  },

  // For complex objects, serialize/deserialize
  async setObject(key: string, value: any) {
    await this.setItem(key, JSON.stringify(value));
  },

  async getObject(key: string): Promise<any | null> {
    const item = await this.getItem(key);
    return item ? JSON.parse(item) : null;
  },
};
