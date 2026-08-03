import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { router, useSegments, usePathname, useGlobalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { authService, passcodeService, userService } from '@/api/services';
import { logger } from '@/lib/logger';
import type { AuthState } from '@/types/routing.types';
import {
  buildRouteConfig,
  determineRoute,
  checkWelcomeStatus,
  normalizeRoutePath,
} from '@/utils/routeHelpers';
import { SessionManager } from '@/utils/sessionManager';
import { setReturnRoute } from '@/utils/returnRoute';
import { isAuthSessionInvalidError } from '@/utils/authErrorClassifier';
import { BACKGROUND_LOCK_GRACE_MS } from '@/utils/sessionConstants';

const LOCAL_ADVANCED_STATUSES = new Set(['kyc_pending', 'kyc_approved', 'completed']);

/**
 * Protected route hook that manages authentication-based navigation
 * Handles token validation, welcome screen status, and routing logic
 * Re-validates routing when app comes to foreground
 */
export function useProtectedRoute() {
  const segments = useSegments();
  const pathname = usePathname();
  const globalParams = useGlobalSearchParams<Record<string, string>>();

  const authState: AuthState = {
    user: useAuthStore((state) => state.user),
    isAuthenticated: useAuthStore((state) => state.isAuthenticated),
    accessToken: useAuthStore((state) => state.accessToken),
    refreshToken: useAuthStore((state) => state.refreshToken),
    hasPasscode: useAuthStore((state) => state.hasPasscode),
    onboardingStatus: useAuthStore((state) => state.onboardingStatus),
    pendingVerificationEmail: useAuthStore((state) => state.pendingVerificationEmail),
    lastActivityAt: useAuthStore((state) => state.lastActivityAt),
    passcodeSessionExpiresAt: useAuthStore((state) => state.passcodeSessionExpiresAt),
    appLockExpiresAt: useAuthStore((state) => state.appLockExpiresAt),
  };

  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const appState = useRef(AppState.currentState);
  const lastForegroundRefresh = useRef(0);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const paramsRef = useRef(globalParams);
  paramsRef.current = globalParams;

  const refreshBackendAuthState = useCallback(
    async (prefetchedProfile?: any, prefetchedPasscode?: any) => {
      const state = useAuthStore.getState();
      if (!state.isAuthenticated || !state.accessToken) return;

      // Reuse pre-fetched results when available (cold start path via initializeApp).
      // Only make live network calls on the foreground-resume path where no data
      // was pre-fetched. This eliminates one full round-trip on every cold start.
      const [userResult, passcodeResult] = await Promise.allSettled([
        prefetchedProfile ? Promise.resolve(prefetchedProfile) : authService.getCurrentUser(),
        prefetchedPasscode ? Promise.resolve(prefetchedPasscode) : passcodeService.getStatus(),
      ]);

      // Re-check auth state — session may have been cleared while requests were in flight
      const currentState = useAuthStore.getState();
      if (!currentState.isAuthenticated || !currentState.accessToken) return;

      if (userResult.status === 'fulfilled') {
        const currentUserResponse = userResult.value;
        const backendUser = currentUserResponse?.user ?? currentUserResponse;
        const backendOnboardingStatus =
          currentUserResponse?.onboarding?.onboardingStatus ?? backendUser?.onboardingStatus;

        if (backendUser) {
          const localStatus = currentState.onboardingStatus;
          const resolvedStatus =
            localStatus &&
            LOCAL_ADVANCED_STATUSES.has(localStatus) &&
            !LOCAL_ADVANCED_STATUSES.has(backendOnboardingStatus ?? '')
              ? localStatus
              : (backendOnboardingStatus ?? currentState.onboardingStatus);

          useAuthStore.setState({
            user: backendUser,
            onboardingStatus: resolvedStatus,
          });
        }
      } else {
        logger.warn('[Auth] Failed to refresh user profile state', {
          component: 'useProtectedRoute',
          action: 'refresh-user-profile',
          error:
            userResult.reason instanceof Error
              ? userResult.reason.message
              : String(userResult.reason),
        });
      }

      if (passcodeResult.status === 'fulfilled') {
        useAuthStore.setState({
          hasPasscode: Boolean(passcodeResult.value.enabled),
        });
      } else {
        logger.warn('[Auth] Failed to refresh passcode status', {
          component: 'useProtectedRoute',
          action: 'refresh-passcode-status',
          error:
            passcodeResult.reason instanceof Error
              ? passcodeResult.reason.message
              : String(passcodeResult.reason),
        });
      }
    },
    []
  );

  // Initialize app: validate token and check welcome status
  // Runs on every mount (app reload) and re-validates routing
  useEffect(() => {
    let isMounted = true;

    const initializeApp = async () => {
      logger.debug('[Auth] App initializing - checking routing...', {
        component: 'useProtectedRoute',
        action: 'initialize-app',
      });

      try {
        const freshState = useAuthStore.getState();
        const hasValidAuthData = freshState.isAuthenticated && freshState.accessToken;
        const shouldValidate = hasValidAuthData && (__DEV__ ? freshState.lastActivityAt : true);

        // Fire all three requests in parallel to avoid serial round-trips:
        //   1. welcome status (AsyncStorage, fast)
        //   2. user profile (validates token + fetches user data)
        //   3. passcode status (avoids a second serial call in refreshBackendAuthState)
        // Previously: welcome → profile → (getCurrentUser + passcode) = 2 serial hops + 1 extra fetch
        // Now:        all three fire simultaneously = 1 hop for everything
        const [welcomed, profileResult, passcodeResult] = await Promise.all([
          checkWelcomeStatus(),
          shouldValidate
            ? userService.getProfile().then(
                (data) => ({ ok: true as const, data }),
                (err) => ({ ok: false as const, err })
              )
            : Promise.resolve(null),
          shouldValidate
            ? passcodeService.getStatus().then(
                (data) => ({ ok: true as const, data }),
                () => ({ ok: false as const, data: null })
              )
            : Promise.resolve(null),
        ]);

        if (isMounted) setHasSeenWelcome(welcomed);

        logger.debug('[Auth] State after hydration (DETAILED)', {
          component: 'useProtectedRoute',
          action: 'hydration-complete',
          hasUser: !!freshState.user,
          userId: freshState.user?.id,
          isAuthenticated: freshState.isAuthenticated,
          hasPasscode: freshState.hasPasscode,
          hasAccessToken: !!freshState.accessToken,
          hasRefreshToken: !!freshState.refreshToken,
          onboardingStatus: freshState.onboardingStatus,
          hasValidAuthData,
          welcomed,
        });

        if (hasValidAuthData) {
          let profileData: any = undefined;
          // Extract pre-fetched passcode result to pass through (avoids re-fetch)
          const prefetchedPasscodeData = passcodeResult?.ok ? passcodeResult.data : undefined;

          if (profileResult) {
            if (profileResult.ok) {
              profileData = profileResult.data;
              if (!profileData) {
                logger.info('[Auth] Token invalid on app load', {
                  component: 'useProtectedRoute',
                  action: 'token-validation-failed',
                });
                SessionManager.handleSessionExpired();
                return;
              }
            } else {
              const isSessionInvalid = isAuthSessionInvalidError(profileResult.err);
              if (isSessionInvalid) {
                SessionManager.handleSessionExpired();
                return;
              }
              logger.warn('[Auth] Token validation failed, continuing', {
                component: 'useProtectedRoute',
                action: 'token-validation-error',
                error:
                  profileResult.err instanceof Error
                    ? profileResult.err.message
                    : String(profileResult.err),
              });
            }
          }

          // Pass both pre-fetched results — refreshBackendAuthState will use them
          // directly instead of making additional network calls.
          await refreshBackendAuthState(profileData, prefetchedPasscodeData);
        } else if (freshState.user) {
          // CRITICAL: User has stored credentials but no valid auth tokens
          // This is the case for old users after app backgrounding
          logger.info('[Auth] User has stored credentials but tokens invalid/missing', {
            component: 'useProtectedRoute',
            action: 'stored-credentials-detected',
            userId: freshState.user.id,
            hasPasscode: freshState.hasPasscode,
          });
        }

        // SECURITY: On cold start (app killed and relaunched), ALWAYS force-expire
        // the passcode lock so users must re-authenticate via passcode/biometrics.
        // This must run unconditionally (no expiry check) because SessionManager
        // initialize() → updateLastActivity() may have already extended the lock
        // to a future time before we get here. Setting it to now overrides that.
        // The routing effect (Effect 3) will see the expired lock and redirect.
        if (isMounted) {
          const freshState2 = useAuthStore.getState();
          if (freshState2.isAuthenticated && freshState2.hasPasscode) {
            useAuthStore.setState({
              appLockExpiresAt: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        logger.error(
          '[Auth] Error initializing app',
          error instanceof Error ? error : new Error(String(error))
        );
      } finally {
        if (isMounted) setIsReady(true);
      }
    };

    // Subscribe BEFORE checking hasHydrated to close the TOCTOU race where
    // hydration could complete in the gap between the check and the subscribe.
    // onFinishHydration is a no-op if already hydrated — it just won't fire again,
    // so we do a synchronous check immediately after subscribing.
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      void initializeApp();
    });

    if (useAuthStore.persist.hasHydrated()) {
      unsubscribe(); // Don't need the listener — hydration already done
      void initializeApp();
      return () => {
        isMounted = false;
      };
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [refreshBackendAuthState]);

  // Listen for app state changes (foreground/background)
  // Reset passcode session timer on foreground (activity-based timeout)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      async (nextAppState: AppStateStatus) => {
        if (nextAppState === 'background') {
          const state = useAuthStore.getState();
          if (state.isAuthenticated && state.hasPasscode) {
            // Grant a 1-minute grace period before locking instead of locking
            // immediately. This lets users briefly leave the app (e.g. to check
            // an account number for a transfer) and return without needing to
            // re-enter their PIN. The routing effect will navigate to
            // /login-passcode when the app returns to foreground after expiry.
            // We do NOT call router.replace here — navigating during background
            // transition can corrupt navigation state and crash on next launch.
            useAuthStore.setState({
              appLockExpiresAt: new Date(Date.now() + BACKGROUND_LOCK_GRACE_MS).toISOString(),
            });
          }
        }

        if (appState.current === 'background' && nextAppState === 'active') {
          const freshState = useAuthStore.getState();

          logger.debug('[Auth] App came to foreground', {
            component: 'useProtectedRoute',
            action: 'app-foreground',
          });

          // If session was expired on background, redirect to passcode immediately
          if (
            freshState.isAuthenticated &&
            freshState.hasPasscode &&
            SessionManager.isAppUnlockExpired()
          ) {
            // Don't redirect if already on the passcode screen
            if (pathnameRef.current !== '/login-passcode') {
              setReturnRoute(pathnameRef.current, paramsRef.current as Record<string, string>);
              router.replace('/login-passcode' as any);
            }
            appState.current = nextAppState;
            return;
          }

          // Passcode screen is already showing (navigated on background).
          // Just check if the full auth token has expired.
          if (freshState.isAuthenticated && freshState.accessToken) {
            if (freshState.checkTokenExpiry()) {
              logger.info('[Auth] 7-day token expired after app resume', {
                component: 'useProtectedRoute',
                action: 'token-expired-on-resume',
              });
              SessionManager.handleSessionExpired();
              appState.current = nextAppState;
              return;
            }

            freshState.updateLastActivity();

            // Cooldown: skip refresh if last call was < 30s ago
            if (Date.now() - lastForegroundRefresh.current > 30_000) {
              lastForegroundRefresh.current = Date.now();
              try {
                await refreshBackendAuthState();
              } catch (error) {
                logger.warn('[Auth] Failed to refresh auth state on resume', {
                  component: 'useProtectedRoute',
                  action: 'foreground-refresh-failed',
                  error: error instanceof Error ? error.message : String(error),
                });
              }
            }
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
      passcodeSessionExpiresAt: freshAuthState.passcodeSessionExpiresAt,
      appLockExpiresAt: freshAuthState.appLockExpiresAt,
    };

    const hasValidPasscodeSession = currentAuthState.isAuthenticated
      ? !SessionManager.isAppUnlockExpired()
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
      if (targetRoute === '/login-passcode') {
        setReturnRoute(pathname, globalParams as Record<string, string>);
      }
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
    authState.lastActivityAt,
    authState.passcodeSessionExpiresAt,
    authState.appLockExpiresAt,
    pathname,
    segments,
    hasSeenWelcome,
    isReady,
  ]);
}
