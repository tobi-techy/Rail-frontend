import type { User as ApiUser } from '../../api/types';

export interface User extends Omit<ApiUser, 'phone'> {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface RegistrationData {
  firstName: string;
  lastName: string;
  dob: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  lastActivityAt: string | null;
  tokenIssuedAt: string | null;
  tokenExpiresAt: string | null;
  hasCompletedOnboarding: boolean;
  onboardingStatus: string | null;
  currentOnboardingStep: string | null;
  registrationData: RegistrationData;
  pendingVerificationEmail: string | null;
  hasPasscode: boolean;
  isBiometricEnabled: boolean;
  passcodeSessionToken?: string;
  passcodeSessionExpiresAt?: string;
  loginAttempts: number;
  lockoutUntil: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  updateLastActivity: () => void;
  checkTokenExpiry: () => boolean;
  clearExpiredSession: () => void;
  clearPasscodeSession: () => void;
  checkPasscodeSessionExpiry: () => boolean;
  setPasscodeSession: (token: string, expiresAt: string) => void;
  setPasscode: (passcode: string) => Promise<void>;
  verifyPasscode: (passcode: string) => Promise<boolean>;
  enableBiometric: () => void;
  disableBiometric: () => void;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setPendingEmail: (email: string | null) => void;
  setOnboardingStatus: (status: string, step?: string) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  setHasPasscode: (hasPasscode: boolean) => void;
  updateRegistrationData: (data: Partial<RegistrationData>) => void;
  clearRegistrationData: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

export type AuthStore = AuthState & AuthActions;
