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
  VerifyEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../types';

const AUTH_ENDPOINTS = {
  LOGIN: '/v1/auth/login',
  REGISTER: '/v1/auth/register',
  LOGOUT: '/v1/auth/logout',
  REFRESH: '/v1/auth/refresh',
  VERIFY_CODE: '/v1/auth/verify-code',
  RESEND_CODE: '/v1/auth/resend-code',
  VERIFY_EMAIL: '/v1/auth/verify-email',
  FORGOT_PASSWORD: '/v1/auth/forgot-password',
  RESET_PASSWORD: '/v1/auth/reset-password',
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
    return apiClient.post<RefreshTokenResponse>(AUTH_ENDPOINTS.REFRESH, data);
  },

  /**
   * Verify email with token (from email link)
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<void> {
    return apiClient.post(AUTH_ENDPOINTS.VERIFY_EMAIL, data);
  },

  /**
   * Verify email or phone with 6-digit code
   * Returns user info and JWT tokens upon successful verification
   * @returns User info with access and refresh tokens
   */
  async verifyCode(data: VerifyCodeRequest): Promise<VerifyCodeResponse> {
    return apiClient.post<VerifyCodeResponse>(AUTH_ENDPOINTS.VERIFY_CODE, data);
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
    return apiClient.get('/v1/auth/me');
  },
};

export default authService;
