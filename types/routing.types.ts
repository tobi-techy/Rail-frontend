/**
 * Routing and authentication types
 */

export interface RouteConfig {
  inAuthGroup: boolean;
  inTabsGroup: boolean;
  isOnWelcomeScreen: boolean;
  isOnLoginPasscode: boolean;
  isOnVerifyEmail: boolean;
  isOnCreatePasscode: boolean;
  isOnConfirmPasscode: boolean;
}

export interface AuthState {
  user: any;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  onboardingStatus: string | null;
  pendingVerificationEmail: string | null;
}

