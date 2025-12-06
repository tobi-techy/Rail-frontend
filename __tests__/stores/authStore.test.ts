import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../api/services';

jest.mock('../../api/services');

describe('authStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.reset();
    });
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should handle successful login', async () => {
      const mockResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          emailVerified: true,
          onboardingStatus: 'completed',
          hasPasscode: true,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      (authService.login as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockResponse.user);
      expect(result.current.accessToken).toBe('access-token');
      expect(result.current.error).toBeNull();
    });

    it('should validate required fields', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.login('', '');
        } catch (error) {
          // Expected
        }
      });

      expect(result.current.error).toBe('Email and password are required');
    });
  });
});
