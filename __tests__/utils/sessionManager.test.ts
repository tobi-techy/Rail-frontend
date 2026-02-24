import { SessionManager } from '../../utils/sessionManager';
import { useAuthStore } from '../../stores/authStore';

jest.mock('../../stores/authStore');
jest.mock('../../api/services');

describe('SessionManager', () => {
  const mockGetState = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    SessionManager.cleanup();
    jest.useFakeTimers();
    (useAuthStore as any).getState = mockGetState;
  });

  afterEach(() => {
    jest.useRealTimers();
    SessionManager.cleanup();
  });

  describe('isTokenExpired', () => {
    it('should return false for future expiry', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      expect(SessionManager.isTokenExpired(futureDate)).toBe(false);
    });

    it('should return true for past expiry', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      expect(SessionManager.isTokenExpired(pastDate)).toBe(true);
    });

    it('should return true for current time', () => {
      const now = new Date().toISOString();
      expect(SessionManager.isTokenExpired(now)).toBe(true);
    });
  });

  describe('getTimeUntilExpiry', () => {
    it('should return positive time for future expiry', () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const timeUntil = SessionManager.getTimeUntilExpiry(futureDate);
      expect(timeUntil).toBeGreaterThan(0);
      expect(timeUntil).toBeLessThan(60 * 60 * 1000 + 1000);
    });

    it('should return 0 for past expiry', () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      expect(SessionManager.getTimeUntilExpiry(pastDate)).toBe(0);
    });
  });

  describe('isSessionValid', () => {
    it('should return true when authenticated with tokens', () => {
      mockGetState.mockReturnValue({
        isAuthenticated: true,
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      expect(SessionManager.isSessionValid()).toBe(true);
    });

    it('should return false when not authenticated', () => {
      mockGetState.mockReturnValue({
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
      });

      expect(SessionManager.isSessionValid()).toBe(false);
    });

    it('should return false when missing access token', () => {
      mockGetState.mockReturnValue({
        isAuthenticated: true,
        accessToken: null,
        refreshToken: 'refresh',
      });

      expect(SessionManager.isSessionValid()).toBe(false);
    });

    it('should return false when missing refresh token', () => {
      mockGetState.mockReturnValue({
        isAuthenticated: true,
        accessToken: 'token',
        refreshToken: null,
      });

      expect(SessionManager.isSessionValid()).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should reset initialized state', () => {
      SessionManager.cleanup();
      expect((SessionManager as any).initialized).toBe(false);
    });

    it('should clear refresh timer', () => {
      SessionManager.cleanup();
      expect((SessionManager as any).refreshTimer).toBeNull();
    });

    it('should clear passcode session timer', () => {
      SessionManager.cleanup();
      expect((SessionManager as any).passcodeSessionTimer).toBeNull();
    });
  });
});
