import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Dynamic config layered on top of app.json. Its only job is to inject secrets
 * from the environment (kept out of git) and add Android perms needed at build:
 *  - GOOGLE_MAPS_API_KEY → Android Google Maps (react-native-maps). Never commit
 *    this; it lives in .env. iOS uses Apple Maps (no key). The real protection is
 *    restricting the key in Google Cloud (Android package + SHA-1, Maps SDK only).
 *  - ACCESS_FINE/COARSE_LOCATION → expo-location geocoding for the places card.
 *
 * `config` is the fully-resolved app.json, so spreading it preserves everything.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const android = config.android ?? {};
  const existingPerms = android.permissions ?? [];
  const locationPerms = [
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION',
  ];

  return {
    ...(config as ExpoConfig),
    android: {
      ...android,
      permissions: Array.from(new Set([...existingPerms, ...locationPerms])),
      config: {
        ...(android.config ?? {}),
        googleMaps: {
          ...(android.config?.googleMaps ?? {}),
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },
  };
};
