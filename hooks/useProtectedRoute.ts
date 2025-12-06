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
    const HYDRATION_DELAY_MS = 500;
    const TOKEN_FRESHNESS_THRESHOLD_MS = 10000; // 10 seconds

    const initializeApp = async () => {
      console.log('[Auth] App initializing - checking routing...');
      
      try {
        const welcomed = await checkWelcomeStatus();
        setHasSeenWelcome(welcomed);
        
        // Wait for auth store to fully hydrate from AsyncStorage
        // This prevents race condition where tokens aren't loaded yet
        await new Promise(resolve => setTimeout(resolve, HYDRATION_DELAY_MS));
        
        // Get fresh state after hydration
        const freshState = useAuthStore.getState();
        const hasValidAuthData = freshState.isAuthenticated && freshState.accessToken;
        
        console.log('[Auth] State after hydration:', {
          hasUser: !!freshState.user,
          hasAccessToken: !!freshState.accessToken,
          hasRefreshToken: !!freshState.refreshToken,
          isAuthenticated: freshState.isAuthenticated,
        });
        
        if (hasValidAuthData) {
          // Calculate token age to determine if validation is needed
          const { lastActivityAt } = freshState;
          const tokenAge = lastActivityAt 
            ? Date.now() - new Date(lastActivityAt).getTime() 
            : Infinity;
          
          const isTokenFresh = tokenAge <= TOKEN_FRESHNESS_THRESHOLD_MS;
          
          // Only validate if token is older than threshold (not just issued)
          if (!isTokenFresh) {
            const isValid = await validateAccessToken();
            if (!isValid) {
              console.log('[Auth] Token invalid on app load');
              SessionManager.handleSessionExpired();
            }
          } else {
            console.log('[Auth] Token recently issued, skipping validation');
          }
        }
        
        // Reset navigation flag to allow routing to run on reload
        hasNavigatedRef.current = false;
      } catch (error) {
        console.error('[Auth] Error initializing app:', error);
      } finally {
        setIsReady(true);
        isInitialMount.current = false;
      }
    };
    
    initializeApp();
  }, []); // Run once on mount (which happens on every app reload)

  // Listen for app state changes (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      // App is going to background - clear passcode session for security
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        console.log('[Auth] App going to background - clearing passcode session for security');
        
        // Clear ONLY passcode session tokens, NOT the full session
        const { isAuthenticated, clearPasscodeSession } = useAuthStore.getState();
        if (isAuthenticated) {
          clearPasscodeSession();
        }
      }
      
      // App has come to foreground
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[Auth] App came to foreground - re-validating routing');
        
        // Reset navigation ref to allow routing logic to run again
        hasNavigatedRef.current = false;
        
        // Get fresh state from store to avoid stale closure values
        const freshState = useAuthStore.getState();
        
        // Check if passcode session expired/cleared
        if (freshState.isAuthenticated && SessionManager.isPasscodeSessionExpired()) {
          console.log('[Auth] Passcode session expired - need to re-authenticate with passcode');
          SessionManager.handlePasscodeSessionExpired();
          // Navigation will happen automatically in the routing effect
          return;
        }
        
        // Update last activity since user is now active
        if (freshState.isAuthenticated) {
          freshState.updateLastActivity();
        }
        
        // Check if 7-day token has expired
        if (freshState.isAuthenticated && freshState.checkTokenExpiry()) {
          console.log('[Auth] 7-day token expired after app resume');
          SessionManager.handleSessionExpired();
          return;
        }
      }
      
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []); // No dependencies needed - we fetch fresh state inside the handler

  // Handle routing based on auth state
  // Runs on mount, auth changes, and when app comes to foreground
  useEffect(() => {
    if (!isReady) {
      console.log('[Auth] Routing check skipped - app not ready');
      return;
    }
    
    if (hasNavigatedRef.current) {
      console.log('[Auth] Routing check skipped - already navigated in this session');
      return;
    }

    // Get fresh state from store to ensure we have latest values after hydration
    const freshAuthState = useAuthStore.getState();
    const currentAuthState: AuthState = {
      user: freshAuthState.user,
      isAuthenticated: freshAuthState.isAuthenticated,
      accessToken: freshAuthState.accessToken,
      refreshToken: freshAuthState.refreshToken,
      onboardingStatus: freshAuthState.onboardingStatus,
      pendingVerificationEmail: freshAuthState.pendingVerificationEmail,
    };
    
    // Check if passcode session is valid for authenticated users
    const hasValidPasscodeSession = currentAuthState.isAuthenticated 
      ? !SessionManager.isPasscodeSessionExpired() 
      : false;

    const config = buildRouteConfig(segments, pathname);
    const targetRoute = determineRoute(currentAuthState, config, hasSeenWelcome, hasValidPasscodeSession);
    
    console.log('[Auth] Routing check:', {
      currentPath: pathname,
      targetRoute,
      isAuthenticated: currentAuthState.isAuthenticated,
      hasUser: !!currentAuthState.user,
      hasToken: !!currentAuthState.accessToken,
      hasRefreshToken: !!currentAuthState.refreshToken,
      hasValidPasscodeSession,
    });
    
    if (targetRoute) {
      console.log(`[Auth] Navigating to: ${targetRoute}`);
      hasNavigatedRef.current = true;
      router.replace(targetRoute as any);
    } else {
      console.log('[Auth] No navigation needed - user is in correct place');
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

