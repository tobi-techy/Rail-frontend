import { Platform } from 'react-native';
import { Passkey } from 'react-native-passkey';
import type {
  PasskeyCreateRequest,
  PasskeyCreateResult,
  PasskeyGetRequest,
  PasskeyGetResult,
} from 'react-native-passkey';

export const createNativePasskey = async (
  request: PasskeyCreateRequest
): Promise<PasskeyCreateResult> => {
  if (Platform.OS !== 'ios') {
    return Passkey.create(request);
  }

  return Passkey.createPlatformKey(request);
};

export const getNativePasskey = async (request: PasskeyGetRequest): Promise<PasskeyGetResult> => {
  if (Platform.OS !== 'ios') {
    return Passkey.get(request);
  }

  return Passkey.getPlatformKey(request);
};

export const isPasskeyCancelledError = (err: unknown): boolean => {
  const code = String((err as any)?.code || (err as any)?.error || '').toLowerCase();
  const msg = String((err as any)?.message || '').toLowerCase();
  return (
    code.includes('usercancel') ||
    code.includes('cancel') ||
    code.includes('abort') ||
    msg.includes('cancelled') ||
    msg.includes('canceled')
  );
};

export const getPasskeyFallbackMessage = (err: unknown): string => {
  const code = String((err as any)?.code || (err as any)?.error || '').toUpperCase();
  const msg = String((err as any)?.message || '').toLowerCase();

  if (code === 'NOCREDENTIALS' || msg.includes('no credentials')) {
    return 'No passkey found for this account on this device. Enter your PIN.';
  }
  if (code === 'INVALID_SESSION') {
    return 'Passkey session expired. Please try again or enter your PIN.';
  }
  if (code === 'NETWORK_ERROR' || code === 'NETWORK_TIMEOUT' || (err as any)?.status === 0) {
    return 'Network issue during passkey sign-in. Enter your PIN.';
  }
  if (
    code === 'PASSCODE_SESSION_UNAVAILABLE' ||
    code === 'PASSCODE_SESSION_UNAVAILABLE_AFTER_PASSKEY'
  ) {
    return 'Authorization session was not created. Enter your PIN to continue.';
  }
  return 'Passkey sign-in failed. Enter your PIN to continue.';
};
