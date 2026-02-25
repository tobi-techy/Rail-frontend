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
