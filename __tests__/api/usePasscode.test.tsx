import React, { PropsWithChildren } from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVerifyPasscode } from '../../api/hooks/usePasscode';
import { passcodeService } from '../../api/services';
import { useAuthStore } from '../../stores/authStore';

jest.mock('../../api/services', () => ({
  passcodeService: {
    getStatus: jest.fn(),
    verifyPasscode: jest.fn(),
    passcodeLogin: jest.fn(),
  },
}));

describe('useVerifyPasscode', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useAuthStore.getState().reset();
      useAuthStore.setState({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          emailVerified: true,
          phoneVerified: true,
          kycStatus: 'pending',
          onboardingStatus: 'completed',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        isAuthenticated: false,
        accessToken: null,
        refreshToken: 'old-refresh-token',
        hasPasscode: true,
      });
    });
  });

  afterEach(() => {
    queryClient?.clear();
    queryClient?.unmount();
  });

  it('stores the full session expiry from passcode login instead of the short access-token expiry', async () => {
    const accessExpiresAt = '2026-01-01T00:15:00.000Z';
    const sessionExpiresAt = '2026-01-31T00:00:00.000Z';

    (passcodeService.passcodeLogin as jest.Mock).mockResolvedValue({
      verified: true,
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresAt: accessExpiresAt,
      sessionExpiresAt,
    });

    const { result } = renderHook(() => useVerifyPasscode(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({ passcode: '1234' });
    });

    expect(useAuthStore.getState().tokenExpiresAt).toBe(sessionExpiresAt);
    expect(useAuthStore.getState().accessToken).toBe('new-access-token');
    expect(useAuthStore.getState().refreshToken).toBe('new-refresh-token');
    expect(useAuthStore.getState().appLockExpiresAt).toBeTruthy();
  });
});
