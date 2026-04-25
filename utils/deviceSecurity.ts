/**
 * Device Security Utilities
 * Detects compromised devices (jailbroken/rooted) and enforces security policies
 *
 * In production, app will block launch on compromised devices
 * In development, warnings are logged but app continues
 */

import JailMonkey from 'jail-monkey';
import { Alert, BackHandler, Platform } from 'react-native';
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
  try {
    const safeCallBoolean = async (
      fn: () => boolean | Promise<boolean> | unknown,
      fallback = true
    ): Promise<boolean> => {
      try {
        const value = fn();
        const resolved =
          value && typeof (value as Promise<unknown>).then === 'function'
            ? await (value as Promise<unknown>)
            : value;

        if (typeof resolved === 'boolean') return resolved;
        if (typeof resolved === 'number') return resolved !== 0;
        if (typeof resolved === 'string') return resolved.toLowerCase() === 'true';
        // SECURITY FIX (NEW-H1): Non-boolean return → assume compromised
        return fallback;
      } catch {
        // SECURITY FIX (NEW-H1): Per-method hook throwing → assume compromised
        return fallback;
      }
    };

    const isJailbroken = await safeCallBoolean(() => JailMonkey.isJailBroken());
    const isDebuggedMode = await safeCallBoolean(() => JailMonkey.isDebuggedMode());
    const hookDetected = await safeCallBoolean(() => JailMonkey.hookDetected());
    const isRooted =
      Platform.OS === 'android' ? await safeCallBoolean(() => JailMonkey.isJailBroken()) : false;
    const isOnExternalStorage =
      Platform.OS === 'android'
        ? await safeCallBoolean(() => JailMonkey.isOnExternalStorage())
        : false;

    const isSecure = !isJailbroken && !isRooted && !isDebuggedMode && !hookDetected;

    return { isSecure, isJailbroken, isRooted, isDebuggedMode, isOnExternalStorage, hookDetected };
  } catch (error) {
    logger.error(
      '[deviceSecurity] Security check failed',
      error instanceof Error ? error : new Error(String(error))
    );
    // SECURITY FIX (C-4): Fail CLOSED — treat device as compromised when
    // the native security module is unavailable or throws. An attacker can
    // hook JailMonkey to throw, so returning isSecure:true here would be a bypass.
    return {
      isSecure: false,
      isJailbroken: false,
      isRooted: false,
      isDebuggedMode: false,
      isOnExternalStorage: false,
      hookDetected: true, // Assume tampering when check itself fails
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

    const logContext = {
      component: 'DeviceSecurity',
      action: 'security-check-failed',
      issues,
      isProduction: !__DEV__,
      ...result,
    };

    const message = `This device appears to be ${issues.join(', ')}. For your security, the app cannot continue.`;

    const shouldAllowInThisBuild = __DEV__ || options?.allowContinue === true;

    if (shouldAllowInThisBuild) {
      // In development, just log — don't interrupt with an alert
      logger.warn('[DeviceSecurity] Dev/override build on potentially compromised device', {
        component: 'DeviceSecurity',
        action: 'dev-override',
        issues,
      });
      logger.warn('[DeviceSecurity] Device security check failed', logContext);
      return true;
    } else {
      // In production, BLOCK the app
      logger.error('[DeviceSecurity] Device security check failed', logContext);
      Alert.alert('🔒 Security Alert', message, [
        {
          text: 'Close App',
          style: 'destructive',
          onPress: () => {
            if (options?.onCompromised) {
              options.onCompromised();
            }
            // SECURITY FIX (NEW-L2): Force exit — Alert alone is dismissable on Android
            BackHandler.exitApp();
          },
        },
      ],
      // SECURITY FIX (NEW-L2): Prevent dismissal by tapping outside
      { cancelable: false }
      );

      // Prevent app from launching
      return false;
    }
  }

  return true;
}

/**
 * Quick check if device is compromised (no UI)
 * SECURITY FIX (L-4): Fails closed — returns true (compromised) on error
 */
export function isDeviceCompromised(): boolean {
  if (__DEV__) return false;
  try {
    return JailMonkey.isJailBroken() || JailMonkey.hookDetected();
  } catch {
    // SECURITY: If the check itself fails, assume compromised
    return true;
  }
}
