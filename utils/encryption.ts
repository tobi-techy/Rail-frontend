import CryptoJS from 'crypto-js';

// Simple encryption for sensitive data (use a proper key in production)
const ENCRYPTION_KEY = process.env.EXPO_PUBLIC_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error('EXPO_PUBLIC_ENCRYPTION_KEY environment variable is required');
}

export const encryptData = (data: string): string => {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
};

export const decryptData = (encryptedData: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const encryptObject = (obj: any): string => {
  return encryptData(JSON.stringify(obj));
};

export const decryptObject = (encryptedData: string): any => {
  const decrypted = decryptData(encryptedData);
  return JSON.parse(decrypted);
};
