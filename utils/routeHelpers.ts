import AsyncStorage from '@react-native-async-storage/async-storage';
import { userService } from '@/api/services';
import { ROUTES } from '@/constants/routes';
import type { RouteConfig, AuthState } from '@/types/routing.types';

export const normalizeRoutePath = (route: string): string =>
  route.replace(/\/\([^/]+\)/g, '') || '/';

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
  // Auth screens should be recognized by both segment and pathname to avoid false negatives.
  // useSegments keeps route-group info e.g. "(auth)" while pathname strips it e.g. "/verify-email"
  inAuthGroup:
    segments[0] === '(auth)' ||
    pathname.startsWith('/(auth)') ||
    pathname === normalizeRoutePath(ROUTES.AUTH.SIGNIN) ||
    pathname === normalizeRoutePath(ROUTES.AUTH.VERIFY_EMAIL) ||
    pathname === normalizeRoutePath(ROUTES.AUTH.FORGOT_PASSWORD) ||
    pathname === normalizeRoutePath(ROUTES.AUTH.RESET_PASSWORD) ||
    pathname === normalizeRoutePath(ROUTES.AUTH.KYC) ||
    pathname === normalizeRoutePath(ROUTES.AUTH.CREATE_PASSCODE) ||
    pathname === normalizeRoutePath(ROUTES.AUTH.CONFIRM_PASSCODE) ||
    pathname.startsWith('/complete-profile/'),
  inTabsGroup: segments[0] === '(tabs)',
  isOnWelcomeScreen: pathname === '/',
  isOnLoginPasscode: pathname === '/login-passcode',
  isOnVerifyEmail: pathname === normalizeRoutePath(ROUTES.AUTH.VERIFY_EMAIL),
  isOnKycScreen: pathname === normalizeRoutePath(ROUTES.AUTH.KYC),
  isOnCreatePasscode: pathname === normalizeRoutePath(ROUTES.AUTH.CREATE_PASSCODE),
  isOnConfirmPasscode: pathname === normalizeRoutePath(ROUTES.AUTH.CONFIRM_PASSCODE),
  isOnCompleteProfile: pathname.startsWith('/complete-profile/'),
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
  const { user, onboardingStatus, hasPasscode } = authState;
  const userOnboardingStatus = user?.onboardingStatus || onboardingStatus;
  const needsKYC = userOnboardingStatus === 'kyc_pending' || userOnboardingStatus === 'kyc_rejected';
  const needsProfile =
    userOnboardingStatus === 'started' || userOnboardingStatus === 'wallets_pending';
  
  if (needsProfile) {
    if (config.isOnCompleteProfile || config.isOnCreatePasscode || config.isOnConfirmPasscode) {
      return null;
    }
    return ROUTES.AUTH.COMPLETE_PROFILE.PERSONAL_INFO;
  }

  if (needsKYC) {
    if (config.isOnKycScreen) return null;
    return ROUTES.AUTH.KYC;
  }

  if (config.isOnLoginPasscode) {
    if (!hasPasscode || hasValidPasscodeSession) {
      return ROUTES.TABS;
    }
    return null;
  }

  if (hasPasscode && !hasValidPasscodeSession && !config.isOnLoginPasscode) {
    console.log('[RouteHelpers] Passcode session expired, redirecting to login-passcode');
    return '/login-passcode';
  }

  if (isInCriticalAuthFlow(config)) return null;

  if (userOnboardingStatus === 'completed' && config.inTabsGroup) return null;

  if (!config.inTabsGroup) return ROUTES.TABS;

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
  const { user, hasPasscode } = authState;
  
  // If full 7-day session has expired (no tokens, user data cleared by SessionManager)
  // Route to signin for full re-authentication
  if (hasSessionExpired && !user) {
    console.log('[RouteHelpers] Session token expired (7 days), redirecting to signin');
    if (config.inAuthGroup && !config.isOnWelcomeScreen) return null;
    return ROUTES.AUTH.SIGNIN;
  }
  
  // If already on login-passcode screen, stay there
  if (config.isOnLoginPasscode) return null;
  
  // If user data still exists but not authenticated (passcode session expired)
  // Route to login-passcode for quick re-auth
  if (user && hasPasscode) {
    console.log('[RouteHelpers] Passcode session expired, redirecting to login-passcode');
    return '/login-passcode';
  }

  if (user && !hasPasscode) {
    return ROUTES.AUTH.SIGNIN;
  }
  
  return null;
};

/**
 * Handles routing for users in email verification flow
 */
const handleEmailVerification = (config: RouteConfig): string | null => {
  if (config.isOnVerifyEmail) return null;
  
  if (!config.isOnVerifyEmail && !config.isOnWelcomeScreen) {
    return ROUTES.AUTH.VERIFY_EMAIL;
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
  // Guests should always be able to access auth screens (signin/signup/verify/password reset).
  if (config.inAuthGroup) return null;
  
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
  const {
    user,
    isAuthenticated,
    accessToken,
    refreshToken,
    pendingVerificationEmail,
  } = authState;
  
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
