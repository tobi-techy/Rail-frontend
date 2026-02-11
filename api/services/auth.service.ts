/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

import apiClient from '../client';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  VerifyCodeRequest,
  VerifyCodeResponse,
  ResendCodeRequest,
  ResendCodeResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  SocialLoginRequest,
  SocialLoginResponse,
} from '../types';

const AUTH_ENDPOINTS = {
  LOGIN: '/v1/auth/login',
  REGISTER: '/v1/auth/register',
  LOGOUT: '/v1/auth/logout',
  REFRESH: '/v1/auth/refresh',
  VERIFY: '/v1/auth/verify',
  RESEND_CODE: '/v1/auth/resend-code',
  FORGOT_PASSWORD: '/v1/auth/forgot-password',
  RESET_PASSWORD: '/v1/auth/reset-password',
  SOCIAL_LOGIN: '/v1/auth/social/login',
};

export const authService = {
  /**
   * Login user with email and password
   * @returns User info with access and refresh tokens
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>(AUTH_ENDPOINTS.LOGIN, data);
  },

  /**
   * Register new user with email or phone and password
   * Sends verification code to provided email/phone
   * @returns Message and identifier (email or phone)
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return apiClient.post<RegisterResponse>(AUTH_ENDPOINTS.REGISTER, data);
  },

  /**
   * Logout current user
   * Invalidates session and refresh token
   */
  async logout(): Promise<void> {
    return apiClient.post(AUTH_ENDPOINTS.LOGOUT);
  },

  /**
   * Refresh access token using refresh token
   * @returns New access token, refresh token, and expiration
   */
  async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const rawResponse = await apiClient.post<any>(AUTH_ENDPOINTS.REFRESH, data);
    const payload =
      rawResponse &&
      typeof rawResponse === 'object' &&
      'data' in rawResponse &&
      rawResponse.data &&
      typeof rawResponse.data === 'object'
        ? rawResponse.data
        : rawResponse;

    const accessToken = payload?.accessToken ?? payload?.access_token;
    const refreshToken = payload?.refreshToken ?? payload?.refresh_token ?? data.refreshToken;
    const expiresAt = payload?.expiresAt ?? payload?.expires_at;

    if (!accessToken) {
      throw new Error('Refresh token response missing access token');
    }

    return {
      accessToken,
      refreshToken,
      expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  },

  /**
   * Verify email or phone with 6-digit code
   * Returns user info and JWT tokens upon successful verification
   * @returns User info with access and refresh tokens
   */
  async verifyCode(data: VerifyCodeRequest): Promise<VerifyCodeResponse> {
    return apiClient.post<VerifyCodeResponse>(AUTH_ENDPOINTS.VERIFY, data);
  },

  /**
   * Resend verification code to email or phone
   * Rate limited to prevent abuse
   * @returns Message and identifier
   */
  async resendCode(data: ResendCodeRequest): Promise<ResendCodeResponse> {
    return apiClient.post<ResendCodeResponse>(AUTH_ENDPOINTS.RESEND_CODE, data);
  },

  /**
   * Send forgot password email
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    return apiClient.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, data);
  },

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    return apiClient.post(AUTH_ENDPOINTS.RESET_PASSWORD, data);
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<any> {
    return apiClient.get('/v1/users/me?include=onboarding,kyc');
  },

  /**
   * Social login (Apple, etc.)
   * @returns User info with access and refresh tokens
   */
  async socialLogin(data: SocialLoginRequest): Promise<SocialLoginResponse> {
    return apiClient.post<SocialLoginResponse>(AUTH_ENDPOINTS.SOCIAL_LOGIN, data);
  },
};

export default authService;
