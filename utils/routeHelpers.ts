import AsyncStorage from '@react-native-async-storage/async-storage';
import { userService } from '@/api/services';
import type { RouteConfig, AuthState } from '@/types/routing.types';

/**
 * Validates the current access token by making an API call
 */
export const validateAccessToken = async (): Promise<boolean> => {
  try {
    await userService.getProfile();
    console.log('[Auth] Token validated successfully');
    return true;
  } catch (error) {
    console.warn('[Auth] Token validation failed:', error);
    return false;
  }
};

/**
 * Checks if user has seen the welcome screen
 */
export const checkWelcomeStatus = async (): Promise<boolean> => {
  try {
    const welcomed = await AsyncStorage.getItem('hasSeenWelcome');
    return welcomed === 'true';
  } catch (error) {
    console.error('[Auth] Error checking welcome status:', error);
    return false;
  }
};

/**
 * Builds route configuration from segments and pathname
 */
export const buildRouteConfig = (segments: string[], pathname: string): RouteConfig => ({
  inAuthGroup: segments[0] === '(auth)',
  inTabsGroup: segments[0] === '(tabs)',
  isOnWelcomeScreen: pathname === '/',
  isOnLoginPasscode: pathname === '/login-passcode',
  isOnVerifyEmail: pathname === '/(auth)/verify-email',
  isOnCreatePasscode: pathname === '/(auth)/create-passcode',
  isOnConfirmPasscode: pathname === '/(auth)/confirm-passcode',
});

/**
 * Checks if user is in a critical auth flow that shouldn't be interrupted
 */
export const isInCriticalAuthFlow = (config: RouteConfig): boolean => {
  return (
    config.isOnLoginPasscode ||
    config.isOnVerifyEmail ||
    config.isOnCreatePasscode ||
    config.isOnConfirmPasscode
  );
};

/**
 * Handles routing for authenticated users
 * Requires passcode session validation for app access after backgrounding/inactivity
 */
const handleAuthenticatedUser = (
  authState: AuthState,
  config: RouteConfig,
  hasValidPasscodeSession: boolean
): string | null => {
  const { user, onboardingStatus } = authState;
  
  if (isInCriticalAuthFlow(config)) return null;
  
  // If passcode session is invalid/expired, route to login-passcode
  if (!hasValidPasscodeSession && !config.isOnLoginPasscode) {
    console.log('[RouteHelpers] Passcode session expired, redirecting to login-passcode');
    return '/login-passcode';
  }
  
  // If user has valid session and is trying to access auth screens, redirect to main app
  if (hasValidPasscodeSession && config.inAuthGroup) {
    console.log('[RouteHelpers] Authenticated user trying to access auth screens, redirecting to main app');
    return '/(tabs)';
  }
  
  const userOnboardingStatus = user?.onboardingStatus || onboardingStatus;
  if (userOnboardingStatus === 'completed' && config.inTabsGroup) return null;
  
  if (!config.inTabsGroup) return '/(tabs)';
  
  return null;
};

/**
 * Handles routing for users with stored credentials but no active session
 * Routes to login-passcode if user data exists (passcode session expired)
 * Routes to signin if no user data exists (full session token expired after 7 days)
 */
const handleStoredCredentials = (
  authState: AuthState,
  config: RouteConfig,
  hasSessionExpired: boolean
): string | null => {
  const { user } = authState;
  
  // If full 7-day session has expired (no tokens, user data cleared by SessionManager)
  // Route to signin for full re-authentication
  if (hasSessionExpired && !user) {
    console.log('[RouteHelpers] Session token expired (7 days), redirecting to signin');
    if (config.inAuthGroup && !config.isOnWelcomeScreen) return null;
    return '/(auth)/signin';
  }
  
  // If already on login-passcode screen, stay there
  if (config.isOnLoginPasscode) return null;
  
  // If user data still exists but not authenticated (passcode session expired)
  // Route to login-passcode for quick re-auth
  if (user) {
    console.log('[RouteHelpers] Passcode session expired, redirecting to login-passcode');
    return '/login-passcode';
  }
  
  return null;
};

/**
 * Handles routing for users in email verification flow
 */
const handleEmailVerification = (config: RouteConfig): string | null => {
  if (config.isOnVerifyEmail) return null;
  
  if (!config.isOnVerifyEmail && !config.isOnWelcomeScreen) {
    return '/(auth)/verify-email';
  }
  
  return null;
};

/**
 * Handles routing for guest users
 */
const handleGuestUser = (
  hasSeenWelcome: boolean,
  config: RouteConfig
): string | null => {
  if (hasSeenWelcome && config.inAuthGroup) return null;
  
  if (!hasSeenWelcome && !config.isOnWelcomeScreen) return '/';
  
  if (config.inTabsGroup || (!config.inAuthGroup && !config.isOnWelcomeScreen)) {
    return '/';
  }
  
  return null;
};

/**
 * Determines the appropriate route based on complete auth state
 */
export const determineRoute = (
  authState: AuthState,
  config: RouteConfig,
  hasSeenWelcome: boolean,
  hasValidPasscodeSession: boolean = true
): string | null => {
  const { user, isAuthenticated, accessToken, refreshToken, pendingVerificationEmail } = authState;
  
  // User is fully authenticated with valid session
  if (isAuthenticated && user && accessToken) {
    return handleAuthenticatedUser(authState, config, hasValidPasscodeSession);
  }
  
  // User data exists but not authenticated - could be passcode session expired OR full session expired
  if (!isAuthenticated && user) {
    // If no refresh token, the 7-day session has fully expired
    const hasSessionExpired = !refreshToken;
    return handleStoredCredentials(authState, config, hasSessionExpired);
  }
  
  // No user data, but pending email verification
  if (!isAuthenticated && !user && pendingVerificationEmail) {
    return handleEmailVerification(config);
  }
  
  // Guest user - no authentication at all
  if (!isAuthenticated && !user) {
    return handleGuestUser(hasSeenWelcome, config);
  }
  
  return null;
};

