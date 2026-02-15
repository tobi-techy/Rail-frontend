import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { router, useSegments, usePathname } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { authService, passcodeService } from '@/api/services';
import { logger } from '@/lib/logger';
import type { AuthState } from '@/types/routing.types';
import {
  buildRouteConfig,
  determineRoute,
  validateAccessToken,
  checkWelcomeStatus,
  normalizeRoutePath,
} from '@/utils/routeHelpers';
import { SessionManager } from '@/utils/sessionManager';

/**
 * Protected route hook that manages authentication-based navigation
 * Handles token validation, welcome screen status, and routing logic
 * Re-validates routing when app comes to foreground
 */
export function useProtectedRoute() {
  const segments = useSegments();
  const pathname = usePathname();

  const authState: AuthState = {
    user: useAuthStore((state) => state.user),
    isAuthenticated: useAuthStore((state) => state.isAuthenticated),
    accessToken: useAuthStore((state) => state.accessToken),
    refreshToken: useAuthStore((state) => state.refreshToken),
    hasPasscode: useAuthStore((state) => state.hasPasscode),
    onboardingStatus: useAuthStore((state) => state.onboardingStatus),
    pendingVerificationEmail: useAuthStore((state) => state.pendingVerificationEmail),
    lastActivityAt: useAuthStore((state) => state.lastActivityAt),
  };

  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const appState = useRef(AppState.currentState);

  const refreshBackendAuthState = useCallback(async () => {
    const state = useAuthStore.getState();
    if (!state.isAuthenticated || !state.accessToken) return;

    try {
      const currentUserResponse = await authService.getCurrentUser();
      const backendUser = currentUserResponse?.user ?? currentUserResponse;
      const backendOnboardingStatus =
        currentUserResponse?.onboarding?.onboardingStatus ?? backendUser?.onboardingStatus;

      if (backendUser) {
        useAuthStore.setState({
          user: backendUser,
          onboardingStatus: backendOnboardingStatus ?? state.onboardingStatus,
        });
      }
    } catch (error) {
      logger.warn('[Auth] Failed to refresh user profile state', {
        component: 'useProtectedRoute',
        action: 'refresh-user-profile',
        error: error instanceof Error ? error.message : String(error),
      });
    }

    try {
      const passcodeStatus = await passcodeService.getStatus();
      useAuthStore.setState({
        hasPasscode: Boolean(passcodeStatus.enabled),
      });
    } catch (error) {
      logger.warn('[Auth] Failed to refresh passcode status', {
        component: 'useProtectedRoute',
        action: 'refresh-passcode-status',
        error: error instanceof Error ? error.message : String(error),
      });
      useAuthStore.setState({ hasPasscode: false });
    }
  }, []);

  // Initialize app: validate token and check welcome status
  // Runs on every mount (app reload) and re-validates routing
  useEffect(() => {
    // Removed artificial delays - let the app initialize naturally

    const initializeApp = async () => {
      logger.debug('[Auth] App initializing - checking routing...', {
        component: 'useProtectedRoute',
        action: 'initialize-app',
      });

      try {
        const welcomed = await checkWelcomeStatus();
        setHasSeenWelcome(welcomed);

        const freshState = useAuthStore.getState();
        const hasValidAuthData = freshState.isAuthenticated && freshState.accessToken;

        logger.debug('[Auth] State after hydration', {
          component: 'useProtectedRoute',
          action: 'hydration-complete',
          hasUser: !!freshState.user,
          isAuthenticated: freshState.isAuthenticated,
        });

        if (hasValidAuthData) {
          const shouldValidate = __DEV__ ? freshState.lastActivityAt : true;
          if (shouldValidate) {
            try {
              const isValid = await validateAccessToken();
              if (!isValid) {
                logger.info('[Auth] Token invalid on app load', {
                  component: 'useProtectedRoute',
                  action: 'token-validation-failed',
                });
                SessionManager.handleSessionExpired();
                return;
              }
            } catch (validationError) {
              logger.warn('[Auth] Token validation failed, continuing', {
                component: 'useProtectedRoute',
                action: 'token-validation-error',
                error:
                  validationError instanceof Error
                    ? validationError.message
                    : String(validationError),
              });
            }
          }

          await refreshBackendAuthState();
        }
      } catch (error) {
        logger.error(
          '[Auth] Error initializing app',
          error instanceof Error ? error : new Error(String(error))
        );
      } finally {
        setIsReady(true);
      }
    };

    initializeApp();
  }, [refreshBackendAuthState]); // Run once on mount (which happens on every app reload)

  // Listen for app state changes (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      async (nextAppState: AppStateStatus) => {
        if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
          logger.debug('[Auth] App going to background - clearing passcode session for security', {
            component: 'useProtectedRoute',
            action: 'app-background',
          });

          const { isAuthenticated, clearPasscodeSession } = useAuthStore.getState();
          if (isAuthenticated) {
            clearPasscodeSession();
          }
        }

        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
          logger.debug('[Auth] App came to foreground - re-validating routing', {
            component: 'useProtectedRoute',
            action: 'app-foreground',
          });

          const freshState = useAuthStore.getState();

          if (freshState.isAuthenticated && SessionManager.isPasscodeSessionExpired()) {
            logger.info('[Auth] Passcode session expired - need to re-authenticate with passcode', {
              component: 'useProtectedRoute',
              action: 'passcode-session-expired',
            });
            SessionManager.handlePasscodeSessionExpired();
            return;
          }

          if (freshState.isAuthenticated) {
            if (freshState.checkTokenExpiry()) {
              logger.info('[Auth] 7-day token expired after app resume', {
                component: 'useProtectedRoute',
                action: 'token-expired-on-resume',
              });
              SessionManager.handleSessionExpired();
              return;
            }

            freshState.updateLastActivity();
            await refreshBackendAuthState();
          }
        }

        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [refreshBackendAuthState]);

  useEffect(() => {
    if (!isReady) {
      logger.debug('[Auth] Routing check skipped - app not ready', {
        component: 'useProtectedRoute',
        action: 'routing-check-skipped',
      });
      return;
    }

    const freshAuthState = useAuthStore.getState();
    const currentAuthState: AuthState = {
      user: freshAuthState.user,
      isAuthenticated: freshAuthState.isAuthenticated,
      accessToken: freshAuthState.accessToken,
      refreshToken: freshAuthState.refreshToken,
      onboardingStatus: freshAuthState.onboardingStatus,
      hasPasscode: freshAuthState.hasPasscode,
      pendingVerificationEmail: freshAuthState.pendingVerificationEmail,
      lastActivityAt: freshAuthState.lastActivityAt,
    };

    const hasValidPasscodeSession = currentAuthState.isAuthenticated
      ? !SessionManager.isPasscodeSessionExpired()
      : false;

    const config = buildRouteConfig(segments, pathname);
    const targetRoute = determineRoute(
      currentAuthState,
      config,
      hasSeenWelcome,
      hasValidPasscodeSession
    );

    logger.debug('[Auth] Routing check', {
      component: 'useProtectedRoute',
      action: 'routing-check',
      currentPath: pathname,
      targetRoute,
      isAuthenticated: currentAuthState.isAuthenticated,
      hasUser: !!currentAuthState.user,
      hasPasscode: currentAuthState.hasPasscode,
      hasValidPasscodeSession,
    });

    if (targetRoute) {
      const normalizedTargetRoute = normalizeRoutePath(targetRoute);
      if (normalizedTargetRoute === pathname) {
        logger.debug('[Auth] Target route already active', {
          component: 'useProtectedRoute',
          action: 'route-already-active',
        });
        return;
      }

      logger.debug(`[Auth] Navigating to: ${targetRoute}`, {
        component: 'useProtectedRoute',
        action: 'navigate',
        targetRoute,
      });
      router.replace(targetRoute as any);
    } else {
      logger.debug('[Auth] No navigation needed - user is in correct place', {
        component: 'useProtectedRoute',
        action: 'no-navigation-needed',
      });
    }
  }, [
    authState.user,
    authState.isAuthenticated,
    authState.accessToken,
    authState.hasPasscode,
    authState.onboardingStatus,
    authState.pendingVerificationEmail,
    pathname,
    segments,
    hasSeenWelcome,
    isReady,
  ]);
}
