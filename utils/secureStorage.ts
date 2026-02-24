import * as SecureStore from 'expo-secure-store';
import { logger } from '@/lib/logger';

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
