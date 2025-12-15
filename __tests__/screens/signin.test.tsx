import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

// Mock the auth hooks
jest.mock('../../api/hooks/useAuth', () => ({
  useLogin: () => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}));

// Mock auth store
jest.mock('../../stores/authStore', () => ({
  useAuthStore: jest.fn(() => ({
    isAuthenticated: false,
    error: null,
    clearError: jest.fn(),
  })),
}));

describe('SignIn Screen', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should render email and password inputs', async () => {
    // Dynamic import to ensure mocks are applied
    const SignIn = require('../../app/(auth)/signin').default;
    
    const { getByPlaceholderText } = render(<SignIn />, { wrapper });

    await waitFor(() => {
      expect(getByPlaceholderText(/email/i)).toBeTruthy();
      expect(getByPlaceholderText(/password/i)).toBeTruthy();
    });
  });

  it('should have a sign in button', async () => {
    const SignIn = require('../../app/(auth)/signin').default;
    
    const { getByText } = render(<SignIn />, { wrapper });

    await waitFor(() => {
      expect(getByText(/sign in/i)).toBeTruthy();
    });
  });
});
