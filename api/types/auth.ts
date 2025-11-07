// ============= Authentication Types =============

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface RegisterRequest {
  email?: string;  // Optional: required if phone not provided
  phone?: string;  // Optional: required if email not provided
  password: string;
}

export interface RegisterResponse {
  message: string;
  identifier: string;
}

export interface VerifyCodeRequest {
  email?: string;  // Optional: required if phone not provided
  phone?: string;  // Optional: required if phone not provided
  code: string;
}

export interface VerifyCodeResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface ResendCodeRequest {
  email?: string;  // Optional: required if phone not provided
  phone?: string;  // Optional: required if email not provided
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
}

export interface User {
  id: string;
  email: string;
  phone?: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  kycStatus: 'pending' | 'processing' | 'approved' | 'rejected' | 'expired';
  onboardingStatus: 'started' | 'wallets_pending' | 'kyc_pending' | 'kyc_approved' | 'kyc_rejected' | 'completed';
  hasPasscode?: boolean;
  createdAt: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface DeleteAccountRequest {
  password?: string;
  reason?: string;
}
