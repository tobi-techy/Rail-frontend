import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSecureStorage } from '../../stores/auth/storage';
import { secureStorage } from '../../utils/secureStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../utils/secureStorage', () => ({
  secureStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    deleteItem: jest.fn(),
  },
}));

describe('createSecureStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('restores secure tokens on hydration for authenticated users', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({
        isAuthenticated: true,
        user: { id: 'user-1' },
        passcodeSessionExpiresAt: '2026-02-19T12:00:00.000Z',
      })
    );
    (secureStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
      if (key.endsWith('_accessToken')) return 'access-token';
      if (key.endsWith('_refreshToken')) return 'refresh-token';
      if (key.endsWith('_passcodeSessionToken')) return 'passcode-token';
      return null;
    });

    const storage = createSecureStorage();
    const result = await storage.getItem('auth-storage');

    expect(result?.accessToken).toBe('access-token');
    expect(result?.refreshToken).toBe('refresh-token');
    expect(result?.passcodeSessionToken).toBe('passcode-token');
  });

  it('stores secure placeholders and removes stale secure keys when tokens are cleared', async () => {
    const storage = createSecureStorage();

    await storage.setItem('auth-storage', {
      isAuthenticated: true,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      passcodeSessionToken: 'passcode-token',
    });

    const firstPayload = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
    expect(firstPayload.accessToken).toBe('__secure__');
    expect(firstPayload.refreshToken).toBe('__secure__');
    expect(firstPayload.passcodeSessionToken).toBe('__secure__');

    await storage.setItem('auth-storage', {
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      passcodeSessionToken: undefined,
    });

    expect(secureStorage.deleteItem).toHaveBeenCalledWith('auth-storage_accessToken');
    expect(secureStorage.deleteItem).toHaveBeenCalledWith('auth-storage_refreshToken');
    expect(secureStorage.deleteItem).toHaveBeenCalledWith('auth-storage_passcodeSessionToken');
  });
});
