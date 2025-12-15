import { checkWelcomeStatus, validateAccessToken, determineRoute } from '../../utils/routeHelpers';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('routeHelpers', () => {
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
    it('returns welcome route for unauthenticated user', () => {
      const config = {
        isAuthenticated: false,
        hasSeenWelcome: false,
        onboardingStatus: null,
        pendingVerificationEmail: null,
        currentSegment: '',
      };
      const route = determineRoute(config);
      expect(route).toBe('/');
    });

    it('returns verify-email for pending verification', () => {
      const config = {
        isAuthenticated: false,
        hasSeenWelcome: true,
        onboardingStatus: null,
        pendingVerificationEmail: 'test@example.com',
        currentSegment: '',
      };
      const route = determineRoute(config);
      expect(route).toBe('/(auth)/verify-email');
    });

    it('returns tabs for authenticated user with completed onboarding', () => {
      const config = {
        isAuthenticated: true,
        hasSeenWelcome: true,
        onboardingStatus: 'completed',
        pendingVerificationEmail: null,
        currentSegment: '',
      };
      const route = determineRoute(config);
      expect(route).toBe('/(tabs)');
    });
  });
});
