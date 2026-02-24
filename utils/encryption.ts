import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.EXPO_PUBLIC_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY && !__DEV__) {
  throw new Error(
    'EXPO_PUBLIC_ENCRYPTION_KEY environment variable is required in production. ' +
      'Generate a secure 256-bit key and add it to your environment variables.'
  );
}

const getEncryptionKey = (): string => {
  if (ENCRYPTION_KEY) return ENCRYPTION_KEY;
  if (__DEV__) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomValues = new Uint32Array(32);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < 32; i++) {
      result += chars[randomValues[i] % chars.length];
    }
    console.warn('[Encryption] Using generated development key');
    return result;
  }
  throw new Error('Encryption key not configured');
};

export const encryptData = (data: string): string => {
  if (!data) throw new Error('Data to encrypt cannot be empty');
  return CryptoJS.AES.encrypt(data, getEncryptionKey()).toString();
};

export const decryptData = (encryptedData: string): string => {
  if (!encryptedData) throw new Error('Encrypted data cannot be empty');
  const bytes = CryptoJS.AES.decrypt(encryptedData, getEncryptionKey());
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
