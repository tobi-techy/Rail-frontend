/**
 * Device Security Utilities
 * Detects compromised devices (jailbroken/rooted) and enforces security policies
 *
 * In production, app will block launch on compromised devices
 * In development, warnings are logged but app continues
 */

import JailMonkey from 'jail-monkey';
import { Alert, Platform } from 'react-native';
import { logger } from '../lib/logger';

export interface SecurityCheckResult {
  isSecure: boolean;
  isJailbroken: boolean;
  isRooted: boolean;
  isDebuggedMode: boolean;
  isOnExternalStorage: boolean;
  hookDetected: boolean;
}

/**
 * Perform comprehensive device security check
 */
export async function checkDeviceSecurity(): Promise<SecurityCheckResult> {
  // Skip on iOS to avoid TurboModule crash
  if (Platform.OS === 'ios') {
    return {
      isSecure: true,
      isJailbroken: false,
      isRooted: false,
      isDebuggedMode: false,
      isOnExternalStorage: false,
      hookDetected: false,
    };
  }

  try {
    const isJailbroken = JailMonkey.isJailBroken();
    const isDebuggedMode = JailMonkey.isDebuggedMode();
    const hookDetected = JailMonkey.hookDetected();

    const isRooted = Platform.OS === 'android' ? JailMonkey.isJailBroken() : false;
    const isOnExternalStorage =
      Platform.OS === 'android' ? JailMonkey.isOnExternalStorage() : false;

    const isSecure = !isJailbroken && !isRooted && !isDebuggedMode && !hookDetected;

    return {
      isSecure,
      isJailbroken,
      isRooted,
      isDebuggedMode,
      isOnExternalStorage,
      hookDetected,
    };
  } catch (error) {
    logger.error(
      '[deviceSecurity] Security check failed',
      error instanceof Error ? error : new Error(String(error))
    );
    return {
      isSecure: true,
      isJailbroken: false,
      isRooted: false,
      isDebuggedMode: false,
      isOnExternalStorage: false,
      hookDetected: false,
    };
  }
}

/**
 * Enforce device security checks
 * In production: BLOCKS app on compromised device
 * In development: Logs warning but allows continuation
 *
 * CRITICAL: Must be called during app initialization
 */
export async function enforceDeviceSecurity(options?: {
  allowContinue?: boolean;
  onCompromised?: () => void;
}): Promise<boolean> {
  const result = await checkDeviceSecurity();

  if (!result.isSecure) {
    const issues: string[] = [];
    if (result.isJailbroken) issues.push('jailbroken');
    if (result.isRooted) issues.push('rooted');
    if (result.isDebuggedMode) issues.push('debugger attached');
    if (result.hookDetected) issues.push('tampering detected');

    logger.error('[DeviceSecurity] Device security check failed', {
      component: 'DeviceSecurity',
      action: 'security-check-failed',
      issues,
      isProduction: !__DEV__,
      ...result,
    });

    const message = `This device appears to be ${issues.join(', ')}. For your security, the app cannot continue.`;

    if (__DEV__) {
      // In development, allow user to continue with warning
      logger.warn('[DeviceSecurity] Allowing dev build to continue on compromised device', {
        component: 'DeviceSecurity',
        action: 'dev-override',
        issues,
      });

      Alert.alert(
        '⚠️ Development: Security Warning',
        `${message}\n\nThis device is not secure, but the app is in development mode.`,
        [{ text: 'Continue Anyway', style: 'default' }]
      );
      return true;
    } else {
      // In production, BLOCK the app
      Alert.alert('🔒 Security Alert', message, [
        {
          text: 'Close App',
          style: 'destructive',
          onPress: () => {
            // Exit the app
            if (options?.onCompromised) {
              options.onCompromised();
            }
          },
        },
      ]);

      // Prevent app from launching
      return false;
    }
  }

  return true;
}

/**
 * Quick check if device is compromised (no UI)
 */
export function isDeviceCompromised(): boolean {
  if (__DEV__ || Platform.OS === 'ios') return false;
  try {
    return JailMonkey.isJailBroken() || JailMonkey.hookDetected();
  } catch {
    return false;
  }
}
