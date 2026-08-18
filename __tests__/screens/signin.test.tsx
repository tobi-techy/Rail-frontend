import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('../../api/hooks/useAuth', () => ({
  useAppleSignIn: () => ({ mutate: jest.fn() }),
  useGoogleSignIn: () => ({ mutate: jest.fn() }),
}));

jest.mock('../../api/client', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

jest.mock('../../stores/authStore', () => ({
  useAuthStore: Object.assign(
    jest.fn(() => ({
      isAuthenticated: false,
      error: null,
      clearError: jest.fn(),
      setPendingEmail: jest.fn(),
      setPendingVerificationMode: jest.fn(),
    })),
    { getState: jest.fn(() => ({ setPendingEmail: jest.fn() })) }
  ),
}));

jest.mock('../../hooks/useFeedbackPopup', () => ({
  useFeedbackPopup: () => ({ showError: jest.fn(), showWarning: jest.fn() }),
}));

jest.mock('../../hooks/useHaptics', () => ({
  useHaptics: () => ({ impact: jest.fn(), notification: jest.fn() }),
}));

jest.mock('../../lib/uiSounds', () => ({
  playUISound: jest.fn(),
}));

jest.mock('../../hooks/useButtonFeedback', () => ({
  useButtonFeedback: () => jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

jest.mock('phosphor-react-native', () => ({
  GoogleLogoIcon: () => null,
}));

describe('SignIn Screen', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should render email input', async () => {
    const SignIn = require('../../app/(auth)/signin').default;
    const { getByPlaceholderText } = render(<SignIn />, { wrapper });

    await waitFor(() => {
      expect(getByPlaceholderText(/email/i)).toBeTruthy();
    });
  });

  it('should have a sign in button', async () => {
    const SignIn = require('../../app/(auth)/signin').default;
    const { getByText } = render(<SignIn />, { wrapper });

    await waitFor(() => {
      expect(getByText(/sign in with mail/i)).toBeTruthy();
    });
  });
});
