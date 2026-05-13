import { useEffect } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import { logger } from '@/lib/logger';

const APP_STORE_URL = 'https://apps.apple.com/app/rail-money/id6740091562';
const TESTFLIGHT_URL = 'https://testflight.apple.com/join/RailMoney';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.railmoney.app';

/**
 * Checks if the running app version is below the minimum required version.
 * Shows an alert prompting the user to update.
 */
export function useForceUpdate() {
  useEffect(() => {
    checkForUpdate();
  }, []);
}

async function checkForUpdate() {
  try {
    const currentVersion = Constants.expoConfig?.version ?? '0.0.0';
    // Fetch minimum version from backend
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL?.replace('/api', '')}/health`);
    if (!res.ok) return;
    const data = await res.json();
    const minVersion = data?.min_app_version;
    if (!minVersion) return;

    if (isVersionBelow(currentVersion, minVersion)) {
      Alert.alert(
        'Update Available',
        'A new version of Rail is available with important improvements. Please update to continue.',
        [
          {
            text: 'Update Now',
            onPress: () => {
              const url = Platform.select({
                ios: TESTFLIGHT_URL,
                android: PLAY_STORE_URL,
                default: APP_STORE_URL,
              });
              Linking.openURL(url);
            },
          },
        ],
        { cancelable: false }
      );
    }
  } catch (error) {
    logger.debug('[ForceUpdate] Check failed', { error });
  }
}

function isVersionBelow(current: string, minimum: string): boolean {
  const c = current.split('.').map(Number);
  const m = minimum.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((c[i] ?? 0) < (m[i] ?? 0)) return true;
    if ((c[i] ?? 0) > (m[i] ?? 0)) return false;
  }
  return false;
}
