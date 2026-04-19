import AsyncStorage from '@react-native-async-storage/async-storage';
import { userService } from '@/api/services';
import { logger } from '@/lib/logger';
import { ROUTES } from '@/constants/routes';
import { isOnboardingAppReady, isProfileCompletionRequired } from '@/utils/onboardingFlow';
import { isAuthSessionInvalidError } from '@/utils/authErrorClassifier';
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
    const isSessionInvalid = isAuthSessionInvalidError(error);

    logger.warn('[Auth] Token validation failed', {
      component: 'routeHelpers',
      action: isSessionInvalid ? 'token-validation-auth-invalid' : 'token-validation-transient',
      error: error instanceof Error ? error.message : String(error),
      isSessionInvalid,
    });

    // Preserve session on transient/network/server errors.
    return !isSessionInvalid;
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
    pathname === normalizeRoutePath(ROUTES.AUTH.SIGNUP) ||
    pathname === normalizeRoutePath(ROUTES.AUTH.SIGNIN) ||
    pathname === normalizeRoutePath(ROUTES.AUTH.VERIFY_EMAIL) ||
    pathname === normalizeRoutePath(ROUTES.AUTH.FORGOT_PASSWORD) ||
    pathname === normalizeRoutePath(ROUTES.AUTH.CREATE_PASSCODE) ||
    pathname === normalizeRoutePath(ROUTES.AUTH.CONFIRM_PASSCODE) ||
    pathname === normalizeRoutePath(ROUTES.AUTH.CREATE_RAILTAG) ||
    pathname.startsWith('/complete-profile/'),
  inTabsGroup: segments[0] === '(tabs)',
  inAppGroup:
    segments[0] === '(tabs)' ||
    segments[0] === 'market-explore' ||
    segments[0] === 'market-asset' ||
    segments[0] === 'spending-stash' ||
    segments[0] === 'investment-stash' ||
    segments[0] === 'withdraw' ||
    segments[0] === 'virtual-account' ||
    segments[0] === 'settings-notifications' ||
    segments[0] === 'notifications' ||
    segments[0] === 'kyc' ||
    segments[0] === 'card' ||
    segments[0] === 'fund-crosschain' ||
    segments[0] === 'fund-naira' ||
    segments[0] === 'withdraw-naira' ||
    segments[0] === 'paj-verify' ||
    segments[0] === 'ai-chat' ||
    segments[0] === 'voice-mode' ||
    segments[0] === 'tap-to-pay' ||
    pathname.startsWith('/spending-stash') ||
    pathname.startsWith('/investment-stash') ||
    pathname.startsWith('/withdraw') ||
    pathname.startsWith('/market-explore') ||
    pathname.startsWith('/market-asset') ||
    pathname.startsWith('/virtual-account') ||
    pathname.startsWith('/settings-notifications') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/authorize-transaction') ||
    pathname.startsWith('/passkey-settings') ||
    pathname.startsWith('/receive') ||
    pathname.startsWith('/fund-crosschain') ||
    pathname.startsWith('/fund-naira') ||
    pathname.startsWith('/withdraw-naira') ||
    pathname.startsWith('/paj-verify') ||
    pathname.startsWith('/ai-chat') ||
    pathname.startsWith('/voice-mode') ||
    pathname.startsWith('/tap-to-pay') ||
    pathname.startsWith('/kyc') ||
    pathname.startsWith('/card') ||
    pathname.startsWith('/gameplay') ||
    pathname.startsWith('/subscription') ||
    pathname.startsWith('/complete-profile'),
  isOnWelcomeScreen: pathname === '/' || pathname === normalizeRoutePath(ROUTES.INTRO),
  isOnLoginPasscode: pathname === '/login-passcode',
  isOnVerifyEmail: pathname === normalizeRoutePath(ROUTES.AUTH.VERIFY_EMAIL),
  isOnCreatePasscode: pathname === normalizeRoutePath(ROUTES.AUTH.CREATE_PASSCODE),
  isOnConfirmPasscode: pathname === normalizeRoutePath(ROUTES.AUTH.CONFIRM_PASSCODE),
  isOnCreateRailTag: pathname === normalizeRoutePath(ROUTES.AUTH.CREATE_RAILTAG),
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
    config.isOnConfirmPasscode ||
    config.isOnCreateRailTag ||
    config.isOnCompleteProfile
  );
};

/**
 * Handles routing for authenticated users
 * Requires passcode session validation for app access whenever passcode is enabled
 */
const handleAuthenticatedUser = (
  authState: AuthState,
  config: RouteConfig,
  hasValidPasscodeSession: boolean
): string | null => {
  const { user, onboardingStatus, hasPasscode } = authState;
  const userOnboardingStatus = onboardingStatus || user?.onboardingStatus;
  const needsProfile = isProfileCompletionRequired(userOnboardingStatus);
  // Don't redirect to create-passcode if user has a valid passcode session.
  // This means they just logged in and syncPasscodeStatus hasn't completed yet.
  const needsPasscodeSetup =
    !hasPasscode && !needsProfile && Boolean(userOnboardingStatus) && !hasValidPasscodeSession;

  if (needsProfile) {
    if (
      config.isOnCompleteProfile ||
      config.isOnCreatePasscode ||
      config.isOnConfirmPasscode ||
      config.isOnCreateRailTag
    ) {
      return null;
    }
    return ROUTES.AUTH.COMPLETE_PROFILE.PERSONAL_INFO;
  }

  if (needsPasscodeSetup) {
    if (config.isOnCreatePasscode || config.isOnConfirmPasscode || config.isOnCreateRailTag) {
      return null;
    }
    return ROUTES.AUTH.CREATE_PASSCODE;
  }

  // If on passcode screen and session is valid -> go to dashboard
  if (config.isOnLoginPasscode) {
    if (hasValidPasscodeSession) {
      return ROUTES.TABS;
    }
    return null;
  }

  // SECURITY: Completed users must present a valid passcode session before app access.
  const shouldRequirePasscode = hasPasscode;
  if (
    shouldRequirePasscode &&
    !hasValidPasscodeSession &&
    !config.isOnLoginPasscode &&
    !config.isOnCreatePasscode &&
    !config.isOnConfirmPasscode &&
    !config.isOnCreateRailTag &&
    !config.isOnCompleteProfile
  ) {
    logger.info('[RouteHelpers] Passcode session missing/expired, redirecting to login-passcode', {
      component: 'routeHelpers',
      action: 'passcode-expired-redirect',
    });
    return '/login-passcode';
  }

  if (isInCriticalAuthFlow(config)) return null;

  if (isOnboardingAppReady(userOnboardingStatus) && config.inAppGroup) return null;

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
  const { user, hasPasscode, onboardingStatus } = authState;
  const resolvedOnboardingStatus = onboardingStatus || user?.onboardingStatus;

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

  if (!hasSeenWelcome && !config.isOnWelcomeScreen) return ROUTES.INTRO;

  if (config.inTabsGroup || (!config.inAuthGroup && !config.isOnWelcomeScreen)) {
    return ROUTES.INTRO;
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
