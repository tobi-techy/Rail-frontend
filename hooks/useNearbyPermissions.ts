import { useCallback, useEffect, useState } from 'react';
import { Linking, PermissionsAndroid, Platform } from 'react-native';

function getAndroidPermissions(): string[] {
  if (Platform.OS !== 'android') return [];
  const version = typeof Platform.Version === 'number' ? Platform.Version : 0;
  const perms: string[] = [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
  if (version >= 31) {
    perms.push(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    );
  }
  if (version >= 33) {
    perms.push(PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES);
  }
  return perms;
}

const ANDROID_PERMISSIONS = getAndroidPermissions();

export type PermissionStatus = 'undetermined' | 'granted' | 'denied' | 'blocked';

export function useNearbyPermissions() {
  const [status, setStatus] = useState<PermissionStatus>(
    Platform.OS === 'ios' ? 'granted' : 'undetermined'
  );

  useEffect(() => {
    if (Platform.OS !== 'android' || ANDROID_PERMISSIONS.length === 0) return;
    (async () => {
      const results = await Promise.all(
        ANDROID_PERMISSIONS.map((p) => PermissionsAndroid.check(p))
      );
      setStatus(results.every(Boolean) ? 'granted' : 'undetermined');
    })();
  }, []);

  const request = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'ios') return true;
    if (ANDROID_PERMISSIONS.length === 0) return true;

    const result = await PermissionsAndroid.requestMultiple(ANDROID_PERMISSIONS);
    const allGranted = Object.values(result).every(
      (v) => v === PermissionsAndroid.RESULTS.GRANTED
    );
    const anyBlocked = Object.values(result).some(
      (v) => v === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
    );

    setStatus(allGranted ? 'granted' : anyBlocked ? 'blocked' : 'denied');
    return allGranted;
  }, []);

  const openSettings = useCallback(() => Linking.openSettings(), []);

  return { status, request, openSettings };
}
