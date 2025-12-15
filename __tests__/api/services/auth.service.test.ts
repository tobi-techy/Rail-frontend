import { authService } from '../../../api/services/auth.service';
import apiClient from '../../../api/client';

jest.mock('../../../api/client', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('calls POST /auth/login with credentials', async () => {
      const mockResponse = { user: { id: '1' }, accessToken: 'token' };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.login({ email: 'test@example.com', password: 'pass' });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'pass',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('register', () => {
    it('calls POST /auth/register with user data', async () => {
      const mockResponse = { identifier: 'test@example.com' };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.register({
        email: 'test@example.com',
        password: 'pass',
        name: 'Test User',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
        email: 'test@example.com',
        password: 'pass',
        name: 'Test User',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('logout', () => {
    it('calls POST /auth/logout', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({});

      await authService.logout();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
    });
  });
});
