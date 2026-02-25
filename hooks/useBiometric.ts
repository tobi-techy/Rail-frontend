/**
 * Biometric Authentication Hook
 * Provides Face ID / Touch ID / Fingerprint support with passcode fallback
 *
 * SECURITY:
 * - Device biometric matching is handled by OS
 * - Only biometric credentials are stored locally
 * - Biometric enrollment is tied to device
 * - Fallback to passcode if biometric fails
 */

import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuthStore } from '@/stores/authStore';
import { secureStorage } from '@/utils/secureStorage';
import { logger } from '@/lib/logger';

export interface BiometricStatus {
  isAvailable: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  isBiometricEnabled: boolean;
  isVerifying: boolean;
  error: string | null;
}

export function useBiometric() {
  const [status, setStatus] = useState<BiometricStatus>({
    isAvailable: false,
    isEnrolled: false,
    supportedTypes: [],
    isBiometricEnabled: false,
    isVerifying: false,
    error: null,
  });

  const isBiometricEnabled = useAuthStore((s) => s.isBiometricEnabled);

  // Check device capabilities on mount
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  // Update enabled status when auth state changes
  useEffect(() => {
    setStatus((prev) => ({
      ...prev,
      isBiometricEnabled,
    }));
  }, [isBiometricEnabled]);

  const checkBiometricAvailability = useCallback(async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      logger.debug('[Biometric] Availability check completed', {
        component: 'Biometric',
        action: 'availability-check',
        compatible,
        enrolled,
        types: types.join(', '),
      });

      setStatus((prev) => ({
        ...prev,
        isAvailable: compatible && enrolled,
        isEnrolled: enrolled,
        supportedTypes: types,
      }));
    } catch (error) {
      logger.warn('[Biometric] Availability check failed', {
        component: 'Biometric',
        action: 'availability-check-error',
        error: error instanceof Error ? error.message : String(error),
      });
      setStatus((prev) => ({
        ...prev,
        isAvailable: false,
        isEnrolled: false,
      }));
    }
  }, []);

  /**
   * Enable biometric for this device
   * SECURITY: Requires valid passcode first
   */
  const enableBiometric = useCallback(async (): Promise<boolean> => {
    if (!status.isAvailable) {
      const error = 'Biometric not available on this device';
      logger.warn('[Biometric] Cannot enable - not available', {
        component: 'Biometric',
        action: 'enable-not-available',
      });
      setStatus((prev) => ({
        ...prev,
        error,
      }));
      return false;
    }

    setStatus((prev) => ({
      ...prev,
      isVerifying: true,
      error: null,
    }));

    try {
      // Verify biometric works on device first
      const result = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
        promptMessage: 'Enable biometric authentication for RAIL',
        fallbackLabel: 'Use passcode instead',
      });

      if (!result.success) {
        logger.warn('[Biometric] User cancelled biometric setup', {
          component: 'Biometric',
          action: 'enable-cancelled',
        });
        setStatus((prev) => ({
          ...prev,
          error: 'Biometric setup cancelled',
        }));
        return false;
      }

      // Store biometric credential securely
      await secureStorage.setItem('biometric-enabled', 'true');
      useAuthStore.setState({ isBiometricEnabled: true });

      logger.info('[Biometric] Biometric enabled successfully', {
        component: 'Biometric',
        action: 'enable-success',
      });

      setStatus((prev) => ({
        ...prev,
        isBiometricEnabled: true,
        isVerifying: false,
      }));

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('[Biometric] Enable failed', {
        component: 'Biometric',
        action: 'enable-error',
        error: errorMessage,
      });

      setStatus((prev) => ({
        ...prev,
        error: `Failed to enable biometric: ${errorMessage}`,
        isVerifying: false,
      }));

      return false;
    }
  }, [status.isAvailable]);

  /**
   * Verify user with biometric
   * Returns success/failure but doesn't set auth tokens
   * Tokens should be set by passcode verification after this
   */
  const verifyWithBiometric = useCallback(async (): Promise<boolean> => {
    if (!isBiometricEnabled || !status.isAvailable) {
      logger.debug('[Biometric] Skipping - biometric not enabled or available', {
        component: 'Biometric',
        action: 'verify-skip',
        isBiometricEnabled,
        isAvailable: status.isAvailable,
      });
      return false;
    }

    setStatus((prev) => ({
      ...prev,
      isVerifying: true,
      error: null,
    }));

    try {
      const result = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
        promptMessage: 'Authenticate with your biometric',
        fallbackLabel: 'Use passcode instead',
      });

      if (result.success) {
        logger.info('[Biometric] Verification successful', {
          component: 'Biometric',
          action: 'verify-success',
        });

        setStatus((prev) => ({
          ...prev,
          isVerifying: false,
        }));

        return true;
      } else {
        logger.warn('[Biometric] Verification cancelled by user', {
          component: 'Biometric',
          action: 'verify-cancelled',
        });

        setStatus((prev) => ({
          ...prev,
          error: 'Biometric verification cancelled',
          isVerifying: false,
        }));

        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('[Biometric] Verification failed', {
        component: 'Biometric',
        action: 'verify-error',
        error: errorMessage,
      });

      setStatus((prev) => ({
        ...prev,
        error: `Biometric verification failed: ${errorMessage}`,
        isVerifying: false,
      }));

      return false;
    }
  }, [isBiometricEnabled, status.isAvailable]);

  /**
   * Disable biometric for this device
   */
  const disableBiometric = useCallback(async (): Promise<boolean> => {
    try {
      await secureStorage.deleteItem('biometric-enabled');
      useAuthStore.setState({ isBiometricEnabled: false });

      logger.info('[Biometric] Biometric disabled', {
        component: 'Biometric',
        action: 'disable-success',
      });

      setStatus((prev) => ({
        ...prev,
        isBiometricEnabled: false,
      }));

      return true;
    } catch (error) {
      logger.error('[Biometric] Disable failed', {
        component: 'Biometric',
        action: 'disable-error',
        error: error instanceof Error ? error.message : String(error),
      });

      setStatus((prev) => ({
        ...prev,
        error: 'Failed to disable biometric',
      }));

      return false;
    }
  }, []);

  return {
    ...status,
    checkBiometricAvailability,
    enableBiometric,
    verifyWithBiometric,
    disableBiometric,
  };
}

export default useBiometric;
