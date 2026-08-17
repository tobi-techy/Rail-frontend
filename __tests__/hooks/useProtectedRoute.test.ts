import { checkWelcomeStatus, determineRoute, validateAccessToken } from '../../utils/routeHelpers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userService } from '@/api/services';
import { ROUTES } from '../../constants/routes';
import type { AuthState, RouteConfig } from '../../types/routing.types';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('@/api/services', () => ({
  userService: {
    getProfile: jest.fn(),
  },
}));

describe('routeHelpers', () => {
  const baseConfig: RouteConfig = {
    inAuthGroup: false,
    inTabsGroup: false,
    inAppGroup: false,
    isOnWelcomeScreen: false,
    isOnLoginPasscode: false,
    isOnVerifyEmail: false,
    isOnCreatePasscode: false,
    isOnConfirmPasscode: false,
    isOnCreateRailTag: false,
    isOnCompleteProfile: false,
    isOnEmploymentStatus: false,
    isOnAccountPurpose: false,
    isOnSourceOfFunds: false,
    isOnCompleteKyc: false,
    isOnFirstJob: false,
  };

  const baseAuthState: AuthState = {
    user: null,
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    hasPasscode: false,
    onboardingStatus: null,
    pendingVerificationEmail: null,
    lastActivityAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkWelcomeStatus', () => {
    it('returns true when user has seen welcome', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
      const result = await checkWelcomeStatus();
      expect(result).toBe(true);
    });

    it('returns false when user has not seen welcome', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      const result = await checkWelcomeStatus();
      expect(result).toBe(false);
    });
  });

  describe('validateAccessToken', () => {
    it('returns true when profile fetch succeeds', async () => {
      (userService.getProfile as jest.Mock).mockResolvedValue({ id: 'u1' });

      const result = await validateAccessToken();
      expect(result).toBe(true);
    });

    it('returns false on auth-invalid errors', async () => {
      (userService.getProfile as jest.Mock).mockRejectedValue({
        status: 401,
        code: 'HTTP_401',
        message: 'Authentication required',
      });

      const result = await validateAccessToken();
      expect(result).toBe(false);
    });

    it('returns false when backend reports a revoked refresh/session token', async () => {
      (userService.getProfile as jest.Mock).mockRejectedValue({
        code: 'TOKEN_REVOKED',
        message: 'Session is no longer valid',
      });

      const result = await validateAccessToken();
      expect(result).toBe(false);
    });

    it('returns true on transient network errors', async () => {
      (userService.getProfile as jest.Mock).mockRejectedValue({
        status: 0,
        code: 'NETWORK_ERROR',
        message: 'Network error',
      });

      const result = await validateAccessToken();
      expect(result).toBe(true);
    });
  });

  describe('determineRoute', () => {
    it('returns intro route for first-time unauthenticated user', () => {
      const route = determineRoute(baseAuthState, baseConfig, false);
      expect(route).toBe(ROUTES.INTRO);
    });

    it('routes persisted completed user with refresh token to login-passcode', () => {
      const route = determineRoute(
        {
          ...baseAuthState,
          user: { id: 'u1', onboardingStatus: 'completed' },
          refreshToken: 'refresh-token',
          hasPasscode: true,
        },
        baseConfig,
        true,
        false
      );
      expect(route).toBe('/login-passcode');
    });

    it('routes persisted completed user without refresh token to signin', () => {
      const route = determineRoute(
        {
          ...baseAuthState,
          user: { id: 'u1', onboardingStatus: 'completed' },
          refreshToken: null,
          hasPasscode: true,
        },
        { ...baseConfig, isOnLoginPasscode: true },
        true,
        false
      );
      expect(route).toBe(ROUTES.AUTH.SIGNIN);
    });

    it('returns verify-email for pending verification', () => {
      const route = determineRoute(
        { ...baseAuthState, pendingVerificationEmail: 'test@example.com' },
        baseConfig,
        true
      );
      expect(route).toBe(ROUTES.AUTH.VERIFY_EMAIL);
    });

    it('returns tabs for authenticated user with completed onboarding', () => {
      const route = determineRoute(
        {
          ...baseAuthState,
          user: { id: 'u1', onboardingStatus: 'completed' },
          isAuthenticated: true,
          accessToken: 'token',
        },
        baseConfig,
        true,
        true
      );
      expect(route).toBe(ROUTES.TABS);
    });

    it('forces passcode login for authenticated users without a valid passcode session', () => {
      const route = determineRoute(
        {
          ...baseAuthState,
          user: { id: 'u1', onboardingStatus: 'completed' },
          isAuthenticated: true,
          accessToken: 'token',
          hasPasscode: true,
        },
        baseConfig,
        true,
        false
      );
      expect(route).toBe('/login-passcode');
    });

    it('lets started users into tabs instead of trapping them in profile forms', () => {
      const route = determineRoute(
        {
          ...baseAuthState,
          user: { id: 'u1', onboardingStatus: 'started' },
          onboardingStatus: 'started',
          isAuthenticated: true,
          accessToken: 'token',
        },
        { ...baseConfig, inAppGroup: false },
        true,
        true
      );
      expect(route).toBe(ROUTES.TABS);
    });

    it('prefers latest onboardingStatus over stale user.onboardingStatus', () => {
      const route = determineRoute(
        {
          ...baseAuthState,
          user: { id: 'u1', onboardingStatus: 'started' },
          onboardingStatus: 'kyc_rejected',
          isAuthenticated: true,
          accessToken: 'token',
        },
        baseConfig,
        true,
        true
      );
      expect(route).toBe(ROUTES.TABS);
    });

    it('allows authenticated kyc_pending users to continue to tabs', () => {
      const route = determineRoute(
        {
          ...baseAuthState,
          user: { id: 'u1', onboardingStatus: 'started' },
          onboardingStatus: 'kyc_pending',
          isAuthenticated: true,
          accessToken: 'token',
        },
        baseConfig,
        true,
        true
      );
      expect(route).toBe(ROUTES.TABS);
    });

    it('uses latest onboardingStatus for stored credentials fallback', () => {
      const route = determineRoute(
        {
          ...baseAuthState,
          user: { id: 'u1', onboardingStatus: 'started' },
          onboardingStatus: 'completed',
          isAuthenticated: false,
          hasPasscode: true,
          refreshToken: 'refresh-token',
        },
        baseConfig,
        true,
        false
      );
      expect(route).toBe('/login-passcode');
    });
  });
});
