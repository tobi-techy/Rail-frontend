import AsyncStorage from '@react-native-async-storage/async-storage';
import { userService } from '@/api/services';
import { logger } from '@/lib/logger';
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
    logger.debug('[Auth] Token validated successfully', {
      component: 'routeHelpers',
      action: 'token-validated',
    });
    return true;
  } catch (error) {
    logger.warn('[Auth] Token validation failed', {
      component: 'routeHelpers',
      action: 'token-validation-failed',
      error: error instanceof Error ? error.message : String(error),
    });
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
    logger.error(
      '[Auth] Error checking welcome status',
      error instanceof Error ? error : new Error(String(error))
    );
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
  inAppGroup:
    segments[0] === '(tabs)' ||
    pathname.startsWith('/spending-stash') ||
    pathname.startsWith('/investment-stash') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/authorize-transaction'),
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
 * BUT: Only enforces passcode session requirement after app backgrounding, not on fresh login
 */
const handleAuthenticatedUser = (
  authState: AuthState,
  config: RouteConfig,
  hasValidPasscodeSession: boolean
): string | null => {
  const { user, onboardingStatus, hasPasscode } = authState;
  const userOnboardingStatus = user?.onboardingStatus || onboardingStatus;
  const needsKYC =
    userOnboardingStatus === 'kyc_pending' || userOnboardingStatus === 'kyc_rejected';
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

  // If on passcode screen but passcode not enabled OR session is valid -> go to dashboard
  if (config.isOnLoginPasscode) {
    if (!hasPasscode || hasValidPasscodeSession) {
      return ROUTES.TABS;
    }
    return null;
  }

  // SECURITY FIX: Only require passcode session if:
  // 1. Passcode is enabled AND
  // 2. Session is invalid AND
  // 3. User is NOT coming from fresh email/password login (detected by absence of recent activity)
  // This prevents blocking users who just logged in via email/password
  if (hasPasscode && !hasValidPasscodeSession && !config.isOnLoginPasscode) {
    // Check if this is a fresh login (lastActivityAt was just set)
    // Fresh logins from email/password should have isAuthenticated=true with valid access token
    // Allow access to dashboard for fresh logins; only enforce passcode on re-entry after backgrounding
    const timeSinceLastActivity = authState.lastActivityAt
      ? Date.now() - new Date(authState.lastActivityAt).getTime()
      : null;

    // If last activity is within last 30 seconds, this is a fresh login - allow dashboard access
    const isFreshLogin = timeSinceLastActivity !== null && timeSinceLastActivity < 30 * 1000;

    if (!isFreshLogin) {
      logger.info('[RouteHelpers] Passcode session expired, redirecting to login-passcode', {
        component: 'routeHelpers',
        action: 'passcode-expired-redirect',
      });
      return '/login-passcode';
    }
  }

  if (isInCriticalAuthFlow(config)) return null;

  if (userOnboardingStatus === 'completed' && config.inAppGroup) return null;

  if (!config.inAppGroup) return ROUTES.TABS;

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
    logger.info('[RouteHelpers] Session token expired (7 days), redirecting to signin', {
      component: 'routeHelpers',
      action: 'session-expired-redirect',
    });
    if (config.inAuthGroup && !config.isOnWelcomeScreen) return null;
    return ROUTES.AUTH.SIGNIN;
  }

  // If already on login-passcode screen, stay there
  if (config.isOnLoginPasscode) return null;

  // CRITICAL FIX: User has passcode and stored credentials but not authenticated
  // This happens when app backgrounded and passcode session expired
  // OLD USERS: After closing the app, they must enter passcode to re-auth, not signin
  if (user && hasPasscode) {
    logger.info(
      '[RouteHelpers] User has stored credentials with passcode, routing to passcode login',
      {
        component: 'routeHelpers',
        action: 'stored-credentials-with-passcode',
        userId: user.id,
      }
    );
    return '/login-passcode';
  }

  // User has stored credentials but no passcode set - route to signin
  // This is for users who signed up but haven't set up passcode yet
  if (user && !hasPasscode) {
    logger.info('[RouteHelpers] User has stored credentials without passcode, routing to signin', {
      component: 'routeHelpers',
      action: 'stored-credentials-no-passcode',
      userId: user.id,
    });
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
const handleGuestUser = (hasSeenWelcome: boolean, config: RouteConfig): string | null => {
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
