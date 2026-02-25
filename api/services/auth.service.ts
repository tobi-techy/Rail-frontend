/**
 * Authentication API Service
 * Handles all authentication-related API calls
 * SECURITY: Includes rate limiting and validation
 */

import apiClient from '../client';
import { loginRateLimiter, passwordResetRateLimiter } from '../../utils/rateLimiter';
import { validateEmail, validatePassword } from '../../utils/inputValidator';
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
  WebAuthnLoginBeginRequest,
  WebAuthnLoginBeginResponse,
  WebAuthnLoginFinishRequest,
  WebAuthnLoginFinishResponse,
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
  WEBAUTHN_LOGIN_BEGIN: '/v1/auth/webauthn/login/begin',
  WEBAUTHN_LOGIN_FINISH: '/v1/auth/webauthn/login/finish',
  DELETE_ACCOUNT: '/v1/users/me',
};

const isRetriableNetworkError = (error: any): boolean => {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  return (
    error?.status === 0 ||
    code === 'NETWORK_ERROR' ||
    code === 'NETWORK_TIMEOUT' ||
    code.startsWith('ECONN') ||
    code.startsWith('ETIMEDOUT') ||
    message.includes('network error') ||
    message.includes('timeout')
  );
};

const withNetworkRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  initialDelayMs: number = 600
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetriableNetworkError(error) || attempt === maxRetries) {
        throw error;
      }

      const delayMs = initialDelayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
};

export const authService = {
  /**
   * Login user with email and password
   * SECURITY: Rate limited to prevent brute force attacks
   * @returns User info with access and refresh tokens
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    // SECURITY: Rate limiting
    if (!(await loginRateLimiter.isAllowed('login'))) {
      const resetTime = await loginRateLimiter.getResetTime('login');
      throw new Error(
        `Too many login attempts. Try again in ${Math.ceil(resetTime / 1000)} seconds`
      );
    }

    // SECURITY: Validate email input only when provided (phone-only logins are allowed)
    if (data.email && data.email.trim() !== '') {
      const emailValidation = validateEmail(data.email);
      if (!emailValidation.isValid) {
        const errorMessage =
          emailValidation.errors && emailValidation.errors.length > 0
            ? emailValidation.errors[0]
            : 'Invalid email format';
        throw new Error(errorMessage);
      }
    }

    return apiClient.post<LoginResponse>(AUTH_ENDPOINTS.LOGIN, data);
  },

  /**
   * Register new user with email or phone and password
   * Sends verification code to provided email/phone
   * @returns Message and identifier (email or phone)
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return withNetworkRetry(() => apiClient.post<RegisterResponse>(AUTH_ENDPOINTS.REGISTER, data));
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
    const sessionExpiresAt = payload?.sessionExpiresAt ?? payload?.session_expires_at;
    const csrfToken = payload?.csrfToken ?? payload?.csrf_token;

    if (!accessToken) {
      throw new Error('Refresh token response missing access token');
    }

    return {
      accessToken,
      refreshToken,
      expiresAt: sessionExpiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      csrfToken,
    };
  },

  /**
   * Verify email or phone with 6-digit code
   * Returns user info and JWT tokens upon successful verification
   * @returns User info with access and refresh tokens
   */
  async verifyCode(data: VerifyCodeRequest): Promise<VerifyCodeResponse> {
    return withNetworkRetry(() => apiClient.post<VerifyCodeResponse>(AUTH_ENDPOINTS.VERIFY, data));
  },

  /**
   * Resend verification code to email or phone
   * Rate limited to prevent abuse
   * @returns Message and identifier
   */
  async resendCode(data: ResendCodeRequest): Promise<ResendCodeResponse> {
    return withNetworkRetry(() =>
      apiClient.post<ResendCodeResponse>(AUTH_ENDPOINTS.RESEND_CODE, data)
    );
  },

  /**
   * Send forgot password email
   * SECURITY: Rate limited and validated
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    // SECURITY: Rate limiting - 3 requests per hour
    if (!(await passwordResetRateLimiter.isAllowed('forgot-password'))) {
      const resetTime = await passwordResetRateLimiter.getResetTime('forgot-password');
      throw new Error(
        `Too many password reset requests. Try again in ${Math.ceil(resetTime / 60000)} minutes`
      );
    }

    // SECURITY: Validate email input
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.errors[0] || 'Invalid email format');
    }

    return apiClient.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, data);
  },

  /**
   * Reset password with token
   * SECURITY: Validates password strength
   */
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    // SECURITY: Validate password strength
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors[0] || 'Password does not meet requirements');
    }

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

  /**
   * Begin passkey login ceremony.
   * Returns WebAuthn options and a temporary sessionId required for finish.
   */
  async beginPasskeyLogin(data: WebAuthnLoginBeginRequest): Promise<WebAuthnLoginBeginResponse> {
    return withNetworkRetry(() =>
      apiClient.post<WebAuthnLoginBeginResponse>(AUTH_ENDPOINTS.WEBAUTHN_LOGIN_BEGIN, data)
    );
  },

  /**
   * Finish passkey login ceremony and exchange assertion for auth tokens.
   */
  async finishPasskeyLogin(data: WebAuthnLoginFinishRequest): Promise<WebAuthnLoginFinishResponse> {
    return withNetworkRetry(() =>
      apiClient.post<WebAuthnLoginFinishResponse>(AUTH_ENDPOINTS.WEBAUTHN_LOGIN_FINISH, data)
    );
  },

  /**
   * Delete user account permanently
   * Sweeps any remaining funds to company treasury before deletion
   * @returns Deletion result with funds swept info
   */
  async deleteAccount(
    reason?: string
  ): Promise<{ message: string; funds_swept: string; sweep_tx_hash?: string }> {
    return apiClient.delete(AUTH_ENDPOINTS.DELETE_ACCOUNT, { data: { reason } });
  },
};

export default authService;
