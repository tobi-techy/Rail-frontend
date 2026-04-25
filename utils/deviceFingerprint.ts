/**
 * Device Fingerprint Utility
 *
 * Generates a stable, privacy-respecting device fingerprint sent as
 * X-Device-Fingerprint on every API request. The backend uses this to
 * correlate accounts opened from the same physical device — the primary
 * signal for detecting fraud rings using purchased KYC identities.
 *
 * Fingerprint is a SHA-256 hash of device attributes that are:
 * - Stable across app restarts (not random per session)
 * - Unique enough to distinguish devices (not just "iPhone")
 * - Not PII (no IDFA, no serial numbers)
 *
 * A persistent installation ID is stored in SecureStore as a fallback
 * and to add entropy when device attributes alone aren't distinctive.
 */

import * as Device from 'expo-device';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { secureStorage } from './secureStorage';
import { logger } from '@/lib/logger';

const INSTALL_ID_KEY = 'rail_install_id';

let cachedFingerprint: string | null = null;

/**
 * Get or create a persistent installation ID.
 * Survives app restarts but not reinstalls (stored in Keychain/EncryptedPrefs).
 */
async function getInstallId(): Promise<string> {
  let id = await secureStorage.getItem(INSTALL_ID_KEY);
  if (!id) {
    id = Crypto.randomUUID();
    await secureStorage.setItem(INSTALL_ID_KEY, id);
  }
  return id;
}

/**
 * Collect stable device attributes for fingerprinting.
 */
function collectDeviceAttributes(): string {
  const parts: string[] = [
    Platform.OS,
    Platform.Version?.toString() ?? '',
    Device.brand ?? '',
    Device.modelName ?? '',
    Device.osName ?? '',
    Device.osVersion ?? '',
    Device.deviceYearClass?.toString() ?? '',
    Device.totalMemory?.toString() ?? '',
    Application.applicationId ?? '',
    Constants.expoConfig?.version ?? '',
  ];

  return parts.join('|');
}

/**
 * Generate the device fingerprint. Result is cached for the app session.
 *
 * Returns a 64-char hex SHA-256 hash.
 */
export async function getDeviceFingerprint(): Promise<string> {
  if (cachedFingerprint) return cachedFingerprint;

  try {
    const installId = await getInstallId();
    const attrs = collectDeviceAttributes();
    const raw = `${installId}:${attrs}`;

    cachedFingerprint = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      raw
    );

    return cachedFingerprint;
  } catch (error) {
    logger.error('[DeviceFingerprint] Generation failed', {
      component: 'DeviceFingerprint',
      error: error instanceof Error ? error.message : String(error),
    });
    // Fallback: return a hash of just the install ID so we still send something
    try {
      const installId = await getInstallId();
      cachedFingerprint = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        installId
      );
      return cachedFingerprint;
    } catch {
      return '';
    }
  }
}
