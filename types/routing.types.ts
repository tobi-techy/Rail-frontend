/**
 * Routing and authentication types
 */

export interface RouteConfig {
  inAuthGroup: boolean;
  inTabsGroup: boolean;
  inAppGroup: boolean;
  isOnWelcomeScreen: boolean;
  isOnLoginPasscode: boolean;
  isOnVerifyEmail: boolean;
  isOnCreatePasscode: boolean;
  isOnConfirmPasscode: boolean;
  isOnCreateRailTag: boolean;
  isOnEmploymentStatus: boolean;
  isOnAccountPurpose: boolean;
  isOnSourceOfFunds: boolean;
  isOnCompleteProfile: boolean;
  isOnCompleteKyc: boolean;
  isOnFirstJob: boolean;
}

export interface AuthState {
  user: any;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  hasPasscode: boolean;
  onboardingStatus: string | null;
  pendingVerificationEmail: string | null;
  pendingVerificationMode?: 'signin' | 'signup' | null;
  lastActivityAt?: string | null;
  passcodeSessionExpiresAt?: string;
  appLockExpiresAt?: string;
}
