import CryptoJS from 'crypto-js';

/**
 * Encryption utilities for sensitive data
 * Uses AES-256 encryption with environment-based key
 */

const ENCRYPTION_KEY = process.env.EXPO_PUBLIC_ENCRYPTION_KEY;

// Validate encryption key at startup (production only)
if (!__DEV__ && !ENCRYPTION_KEY) {
  throw new Error(
    'EXPO_PUBLIC_ENCRYPTION_KEY environment variable is required in production. ' +
    'Generate a secure 256-bit key and add it to your environment.'
  );
}

// Use a fallback key only in development
const getEncryptionKey = (): string => {
  if (ENCRYPTION_KEY) return ENCRYPTION_KEY;
  if (__DEV__) {
    console.warn('[Encryption] Using development fallback key - DO NOT use in production');
    return 'dev-only-fallback-key-not-for-production';
  }
  throw new Error('Encryption key not configured');
};

export const encryptData = (data: string): string => {
  return CryptoJS.AES.encrypt(data, getEncryptionKey()).toString();
};

export const decryptData = (encryptedData: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, getEncryptionKey());
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const encryptObject = (obj: any): string => {
  return encryptData(JSON.stringify(obj));
};

export const decryptObject = (encryptedData: string): any => {
  const decrypted = decryptData(encryptedData);
  return JSON.parse(decrypted);
};
