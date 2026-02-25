import type { OnboardingStatusResponse } from './onboarding';

// ============= Authentication Types =============

export interface LoginRequest {
  email?: string; // Optional: required if phone not provided
  phone?: string; // Optional: required if email not provided
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  sessionExpiresAt?: string;
  csrfToken?: string;
}

export interface RegisterRequest {
  email?: string; // Optional: required if phone not provided
  phone?: string; // Optional: required if email not provided
}

export interface RegisterResponse {
  message: string;
  identifier: string;
}

export interface VerifyCodeRequest {
  email?: string; // Optional: required if phone not provided
  phone?: string; // Optional: required if phone not provided
  code: string;
}

export interface VerifyCodeResponse {
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  sessionExpiresAt?: string;
  onboarding_status?: string;
  next_step?: string;
  onboarding?: OnboardingStatusResponse;
  message?: string;
  verified?: boolean;
}

export interface ResendCodeRequest {
  email?: string; // Optional: required if phone not provided
  phone?: string; // Optional: required if email not provided
}

export interface ResendCodeResponse {
  message: string;
  identifier: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  csrfToken?: string;
}

export interface User {
  id: string;
  email: string;
  phone?: string | null;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  kycStatus: 'pending' | 'processing' | 'approved' | 'rejected' | 'expired';
  onboardingStatus:
    | 'started'
    | 'wallets_pending'
    | 'kyc_pending'
    | 'kyc_approved'
    | 'kyc_rejected'
    | 'completed';
  createdAt: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface DeleteAccountRequest {
  password?: string;
  reason?: string;
}

// ============= Social Authentication Types =============

export type SocialProvider = 'apple';

export interface SocialLoginRequest {
  provider: SocialProvider;
  idToken: string;
  givenName?: string;
  familyName?: string;
}

export interface SocialLoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  sessionExpiresAt?: string;
  csrfToken?: string;
  isNewUser: boolean;
}

// ============= Passkey Authentication Types =============

export interface WebAuthnLoginBeginRequest {
  email: string;
}

export interface WebAuthnLoginBeginResponse {
  options: Record<string, any>;
  sessionId: string;
}

export interface WebAuthnLoginFinishRequest {
  sessionId: string;
  response: Record<string, any>;
}

export interface WebAuthnLoginFinishResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  sessionExpiresAt?: string;
  csrfToken?: string;
  passcodeSessionToken?: string;
  passcodeSessionExpiresAt?: string;
}
