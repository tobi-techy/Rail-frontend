/**
 * Routing and authentication types
 */

export interface RouteConfig {
  inAuthGroup: boolean;
  inTabsGroup: boolean;
  isOnWelcomeScreen: boolean;
  isOnLoginPasscode: boolean;
  isOnVerifyEmail: boolean;
  isOnKycScreen: boolean;
  isOnCreatePasscode: boolean;
  isOnConfirmPasscode: boolean;
  isOnCompleteProfile: boolean;
}

export interface AuthState {
  user: any;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  hasPasscode: boolean;
  onboardingStatus: string | null;
  pendingVerificationEmail: string | null;
}
