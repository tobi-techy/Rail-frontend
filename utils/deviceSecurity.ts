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
  const isJailbroken = JailMonkey.isJailBroken();
  const isDebuggedMode = JailMonkey.isDebuggedMode();
  const hookDetected = JailMonkey.hookDetected();
  
  // Android-specific checks
  const isRooted = Platform.OS === 'android' ? JailMonkey.isJailBroken() : false;
  const isOnExternalStorage = Platform.OS === 'android' ? JailMonkey.isOnExternalStorage() : false;

  const isSecure = !isJailbroken && !isRooted && !isDebuggedMode && !hookDetected;

  return {
    isSecure,
    isJailbroken,
    isRooted,
    isDebuggedMode,
    isOnExternalStorage,
    hookDetected,
  };
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
      Alert.alert('Security Warning', message, [
        { text: 'I Understand', style: 'default' },
      ]);
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
  if (__DEV__) return false;
  return JailMonkey.isJailBroken() || JailMonkey.hookDetected();
}
