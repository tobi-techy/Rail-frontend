/**
 * Device Security Utilities
 * Detects compromised devices (jailbroken/rooted) and enforces security policies
 */

import JailMonkey from 'jail-monkey';
import { Alert, Platform } from 'react-native';

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
    if (__DEV__) {
      console.error('[deviceSecurity] Security check failed:', error);
    }
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
 * Check device security and show warning if compromised
 * Returns true if device is secure, false if compromised
 */
export async function enforceDeviceSecurity(options?: {
  allowContinue?: boolean;
  onCompromised?: () => void;
}): Promise<boolean> {
  // Skip in development
  if (__DEV__) {
    return true;
  }

  const result = await checkDeviceSecurity();

  if (!result.isSecure) {
    const issues: string[] = [];
    if (result.isJailbroken) issues.push('jailbroken');
    if (result.isRooted) issues.push('rooted');
    if (result.isDebuggedMode) issues.push('debugger attached');
    if (result.hookDetected) issues.push('tampering detected');

    const message = `This device appears to be ${issues.join(', ')}. For your security, some features may be restricted.`;

    if (options?.allowContinue) {
      Alert.alert('Security Warning', message, [{ text: 'I Understand', style: 'default' }]);
    } else {
      Alert.alert('Security Warning', message, [
        { text: 'OK', style: 'default', onPress: options?.onCompromised },
      ]);
    }

    return false;
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
