import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { router, useSegments, usePathname } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import type { AuthState } from '@/types/routing.types';
import {
  buildRouteConfig,
  determineRoute,
  validateAccessToken,
  checkWelcomeStatus,
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
    onboardingStatus: useAuthStore((state) => state.onboardingStatus),
    pendingVerificationEmail: useAuthStore((state) => state.pendingVerificationEmail),
  };

  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const hasNavigatedRef = useRef(false);
  const appState = useRef(AppState.currentState);
  const isInitialMount = useRef(true);

  // Initialize app: validate token and check welcome status
  // Runs on every mount (app reload) and re-validates routing
  useEffect(() => {
    // Removed artificial delays - let the app initialize naturally

    const initializeApp = async () => {
      if (__DEV__) {
        console.log('[Auth] App initializing - checking routing...');
      }

      try {
        const welcomed = await checkWelcomeStatus();
        setHasSeenWelcome(welcomed);

        const freshState = useAuthStore.getState();
        const hasValidAuthData = freshState.isAuthenticated && freshState.accessToken;

        if (__DEV__) {
          console.log('[Auth] State after hydration:', {
            hasUser: !!freshState.user,
            hasAccessToken: !!freshState.accessToken,
            hasRefreshToken: !!freshState.refreshToken,
            isAuthenticated: freshState.isAuthenticated,
          });
        }

        if (hasValidAuthData) {
          const shouldValidate = __DEV__ ? freshState.lastActivityAt : true;
          if (shouldValidate) {
            try {
              const isValid = await validateAccessToken();
              if (!isValid) {
                if (__DEV__) {
                  console.log('[Auth] Token invalid on app load');
                }
                SessionManager.handleSessionExpired();
              }
            } catch (validationError) {
              if (__DEV__) {
                console.warn('[Auth] Token validation failed, continuing:', validationError);
              }
            }
          }
        }

        hasNavigatedRef.current = false;
      } catch (error) {
        if (__DEV__) {
          console.error('[Auth] Error initializing app:', error);
        }
      } finally {
        setIsReady(true);
        isInitialMount.current = false;
      }
    };

    initializeApp();
  }, []); // Run once on mount (which happens on every app reload)

  // Listen for app state changes (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      async (nextAppState: AppStateStatus) => {
        if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
          if (__DEV__) {
            console.log('[Auth] App going to background - clearing passcode session for security');
          }

          const { isAuthenticated, clearPasscodeSession } = useAuthStore.getState();
          if (isAuthenticated) {
            clearPasscodeSession();
          }
        }

        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
          if (__DEV__) {
            console.log('[Auth] App came to foreground - re-validating routing');
          }

          hasNavigatedRef.current = false;

          const freshState = useAuthStore.getState();

          if (freshState.isAuthenticated && SessionManager.isPasscodeSessionExpired()) {
            if (__DEV__) {
              console.log(
                '[Auth] Passcode session expired - need to re-authenticate with passcode'
              );
            }
            SessionManager.handlePasscodeSessionExpired();
            return;
          }

          if (freshState.isAuthenticated) {
            freshState.updateLastActivity();
          }

          if (freshState.isAuthenticated && freshState.checkTokenExpiry()) {
            if (__DEV__) {
              console.log('[Auth] 7-day token expired after app resume');
            }
            SessionManager.handleSessionExpired();
            return;
          }
        }

        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!isReady) {
      if (__DEV__) {
        console.log('[Auth] Routing check skipped - app not ready');
      }
      return;
    }

    if (hasNavigatedRef.current) {
      if (__DEV__) {
        console.log('[Auth] Routing check skipped - already navigated in this session');
      }
      return;
    }

    const freshAuthState = useAuthStore.getState();
    const currentAuthState: AuthState = {
      user: freshAuthState.user,
      isAuthenticated: freshAuthState.isAuthenticated,
      accessToken: freshAuthState.accessToken,
      refreshToken: freshAuthState.refreshToken,
      onboardingStatus: freshAuthState.onboardingStatus,
      pendingVerificationEmail: freshAuthState.pendingVerificationEmail,
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

    if (__DEV__) {
      console.log('[Auth] Routing check:', {
        currentPath: pathname,
        targetRoute,
        isAuthenticated: currentAuthState.isAuthenticated,
        hasUser: !!currentAuthState.user,
        hasToken: !!currentAuthState.accessToken,
        hasRefreshToken: !!currentAuthState.refreshToken,
        hasValidPasscodeSession,
      });
    }

    if (targetRoute) {
      if (__DEV__) {
        console.log(`[Auth] Navigating to: ${targetRoute}`);
      }
      hasNavigatedRef.current = true;
      router.replace(targetRoute as any);
    } else {
      if (__DEV__) {
        console.log('[Auth] No navigation needed - user is in correct place');
      }
    }
  }, [
    authState.user,
    authState.isAuthenticated,
    authState.accessToken,
    authState.onboardingStatus,
    authState.pendingVerificationEmail,
    pathname,
    segments,
    hasSeenWelcome,
    isReady,
  ]);
}
