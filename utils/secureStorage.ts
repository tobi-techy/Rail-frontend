import * as SecureStore from 'expo-secure-store';

export const secureStorage = {
  async setItem(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
      throw error;
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStore getItem error:', error);
      return null;
    }
  },

  async deleteItem(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStore deleteItem error:', error);
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
