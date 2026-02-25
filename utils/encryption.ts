import CryptoJS from 'crypto-js';
import * as SecureStore from 'expo-secure-store';
import * as ExpoCrypto from 'expo-crypto';
import { logger } from '../lib/logger';

const SECURE_STORE_KEY = 'rail_encryption_key';
// Fixed salt — not secret, just ensures the PBKDF2 output is domain-separated
const PBKDF2_SALT = CryptoJS.enc.Hex.parse('7261696c6d6f6e657961707076310000');
const PBKDF2_ITERATIONS = 10000;
const KEY_SIZE = 256 / 32; // 256-bit key

let _cachedKey: CryptoJS.lib.WordArray | null = null;

function deriveKey(rawKey: string): CryptoJS.lib.WordArray {
  return CryptoJS.PBKDF2(rawKey, PBKDF2_SALT, {
    keySize: KEY_SIZE,
    iterations: PBKDF2_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  });
}

/**
 * Initialize the encryption key from SecureStore.
 * Generates a new random key on first launch and persists it.
 * Must be called once at app startup (before any encrypt/decrypt calls).
 */
export async function initEncryption(): Promise<void> {
  if (_cachedKey) return;

  try {
    let rawKey = await SecureStore.getItemAsync(SECURE_STORE_KEY);
    if (!rawKey) {
      rawKey = ExpoCrypto.getRandomBytes(32).reduce(
        (hex, b) => hex + b.toString(16).padStart(2, '0'),
        ''
      );
      await SecureStore.setItemAsync(SECURE_STORE_KEY, rawKey);
      logger.debug('[Encryption] Generated and stored new device-bound key', {
        component: 'Encryption',
        action: 'key-generated',
      });
    }
    _cachedKey = deriveKey(rawKey);
  } catch (err) {
    logger.error('[Encryption] Failed to init encryption key from SecureStore', {
      component: 'Encryption',
      action: 'init-failed',
      error: err instanceof Error ? err.message : String(err),
    });
    if (__DEV__) {
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      const rawKey = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      _cachedKey = deriveKey(rawKey);
      logger.warn('[Encryption] Using ephemeral dev fallback key', {
        component: 'Encryption',
        action: 'dev-fallback-key',
      });
    } else {
      throw err;
    }
  }
}

function getKey(): CryptoJS.lib.WordArray {
  if (!_cachedKey) {
    throw new Error('[Encryption] Key not initialized. Call initEncryption() at app startup.');
  }
  return _cachedKey;
}

export const encryptData = (data: string): string => {
  if (!data) throw new Error('Data to encrypt cannot be empty');
  return CryptoJS.AES.encrypt(data, getKey()).toString();
};

export const decryptData = (encryptedData: string): string => {
  if (!encryptedData) throw new Error('Encrypted data cannot be empty');
  const bytes = CryptoJS.AES.decrypt(encryptedData, getKey());
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  if (!decrypted) throw new Error('Failed to decrypt data');
  return decrypted;
};

export const encryptObject = <T>(obj: T): string => {
  if (obj === null || obj === undefined)
    throw new Error('Object to encrypt cannot be null or undefined');
  return encryptData(JSON.stringify(obj));
};

export const decryptObject = <T>(encryptedData: string): T => {
  const decrypted = decryptData(encryptedData);
  try {
    return JSON.parse(decrypted) as T;
  } catch {
    throw new Error('Failed to parse decrypted data');
  }
};
