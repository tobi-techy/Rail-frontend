import CryptoJS from 'crypto-js';
import * as SecureStore from 'expo-secure-store';
import * as ExpoCrypto from 'expo-crypto';
import { logger } from '../lib/logger';

const SECURE_STORE_KEY = 'rail_encryption_key';
// Fixed salt — not secret, just domain-separates the derived key.
const KEY_SALT = CryptoJS.enc.Hex.parse('7261696c6d6f6e657961707076310000');

let _cachedKey: CryptoJS.lib.WordArray | null = null;

function deriveKey(rawKey: string): CryptoJS.lib.WordArray {
  // `rawKey` is already a 256-bit CSPRNG value from SecureStore (or an ephemeral
  // random dev key). Heavy PBKDF2 stretching exists to harden LOW-entropy
  // passwords — applied to an already full-entropy key it adds no security while
  // running 100k SHA-256 rounds synchronously on the JS thread, which froze the
  // app for seconds at startup (blocking touches, passcode entry, and biometric
  // prompts). A single domain-separated SHA-256 is sufficient here and instant.
  return CryptoJS.algo.SHA256.create().finalize(
    KEY_SALT.clone().concat(CryptoJS.enc.Utf8.parse(rawKey))
  );
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

/**
 * SECURITY FIX (NEW-H2): Zeroize the cached encryption key from memory.
 * Must be called on logout to prevent key extraction via Frida/debugger.
 */
export function clearEncryptionKey(): void {
  if (_cachedKey && _cachedKey.words) {
    for (let i = 0; i < _cachedKey.words.length; i++) {
      _cachedKey.words[i] = 0;
    }
    _cachedKey.sigBytes = 0;
  }
  _cachedKey = null;
}

export const encryptData = (data: string): string => {
  if (!data) throw new Error('Data to encrypt cannot be empty');
  // Use passphrase-mode (string key) which auto-generates random IV in OpenSSL format
  // This is secure — CryptoJS uses random salt + PBKDF2 + CBC internally
  return CryptoJS.AES.encrypt(data, getKey().toString()).toString();
};

export const decryptData = (encryptedData: string): string => {
  if (!encryptedData) throw new Error('Encrypted data cannot be empty');
  const bytes = CryptoJS.AES.decrypt(encryptedData, getKey().toString());
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
