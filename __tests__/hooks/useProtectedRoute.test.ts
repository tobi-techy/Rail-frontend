import { checkWelcomeStatus, determineRoute } from '../../utils/routeHelpers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ROUTES } from '../../constants/routes';
import type { AuthState, RouteConfig } from '../../types/routing.types';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('routeHelpers', () => {
  const baseConfig: RouteConfig = {
    inAuthGroup: false,
    inTabsGroup: false,
    inAppGroup: false,
    isOnWelcomeScreen: false,
    isOnLoginPasscode: false,
    isOnVerifyEmail: false,
    isOnKycScreen: false,
    isOnCreatePasscode: false,
    isOnConfirmPasscode: false,
    isOnCompleteProfile: false,
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

  describe('determineRoute', () => {
    it('returns intro route for first-time unauthenticated user', () => {
      const route = determineRoute(baseAuthState, baseConfig, false);
      expect(route).toBe(ROUTES.INTRO);
    });

    it('routes persisted completed user without active auth session to login-passcode', () => {
      const route = determineRoute(
        {
          ...baseAuthState,
          user: { id: 'u1', onboardingStatus: 'completed' },
          hasPasscode: false,
        },
        baseConfig,
        true,
        false
      );
      expect(route).toBe('/login-passcode');
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

    it('prefers latest onboardingStatus over stale user.onboardingStatus', () => {
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
      expect(route).toBe(ROUTES.AUTH.KYC);
    });

    it('uses latest onboardingStatus for stored credentials fallback', () => {
      const route = determineRoute(
        {
          ...baseAuthState,
          user: { id: 'u1', onboardingStatus: 'started' },
          onboardingStatus: 'completed',
          isAuthenticated: false,
          hasPasscode: false,
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
