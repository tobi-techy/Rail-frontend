import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLogin, useRegister, useLogout } from '../../../api/hooks/useAuth';
import { authService } from '../../../api/services';
import { useAuthStore } from '../../../stores/authStore';
import React from 'react';

jest.mock('../../../api/services', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useAuth hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().reset();
  });

  describe('useLogin', () => {
    it('should update auth store on successful login', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@example.com' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      (authService.login as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

      result.current.mutate({ email: 'test@example.com', password: 'password' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.accessToken).toBe('access-token');
    });
  });

  describe('useRegister', () => {
    it('should not authenticate user before email verification', async () => {
      (authService.register as jest.Mock).mockResolvedValue({ identifier: 'test@example.com' });

      const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() });

      result.current.mutate({ email: 'test@example.com', password: 'password', name: 'Test' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.pendingVerificationEmail).toBe('test@example.com');
    });
  });
});
