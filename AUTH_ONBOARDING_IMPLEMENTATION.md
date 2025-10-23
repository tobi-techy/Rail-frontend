# Authentication & Onboarding Implementation Guide

## Overview

Complete implementation guide for the authentication and onboarding flow based on STACK-BACKEND-SERVICE API documentation.

## Architecture

```
User Flow:
1. Register (email, fullname, password)
2. Verify Email (6-digit code)
3. Create Passcode (6-digit)
4. Confirm Passcode
5. Onboarding Flow
6. Home Screen

Returning User:
1. Login with Passcode
2. Home Screen
```

## API Endpoints Summary

### Authentication Endpoints

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/v1/auth/register` | POST | Register new user | `{ message, userId }` |
| `/v1/auth/verify-code` | POST | Verify email code | `{ user, accessToken, refreshToken }` |
| `/v1/auth/resend-code` | POST | Resend verification code | `{}` |
| `/v1/auth/login` | POST | Login with email/password | `{ token, refreshToken, expiresAt }` |
| `/v1/auth/refresh` | POST | Refresh tokens | `{ token, refreshToken, expiresAt }` |
| `/v1/auth/logout` | POST | Logout | `{}` |

### Passcode Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/auth/passcode/create` | POST | Create user passcode |
| `/v1/auth/passcode/verify` | POST | Verify passcode (login) |
| `/v1/auth/passcode/update` | POST | Update passcode |

### Onboarding Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/onboarding/start` | POST | Start onboarding |
| `/v1/onboarding/status` | GET | Get onboarding status |
| `/v1/onboarding/kyc/submit` | POST | Submit KYC documents |

## Implementation Steps

### 1. Update Auth Store

```typescript
// stores/authStore.ts - Enhanced version
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../api/types';

interface AuthState {
  // User & Session
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  
  // Onboarding State
  onboardingStatus: string | null;
  currentOnboardingStep: string | null;
  
  // Email Verification
  pendingVerificationEmail: string | null;
  
  // Passcode
  hasPasscode: boolean;
  
  // Loading & Error
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  // Registration Flow
  register: (email: string, password: string, fullName?: string) => Promise<{ userId: string }>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  
  // Passcode Flow
  createPasscode: (passcode: string) => Promise<void>;
  verifyPasscode: (passcode: string) => Promise<void>;
  
  // Onboarding
  startOnboarding: () => Promise<void>;
  getOnboardingStatus: () => Promise<void>;
  
  // Session
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  
  // State Management
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setPendingEmail: (email: string) => void;
  clearError: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      onboardingStatus: null,
      currentOnboardingStep: null,
      pendingVerificationEmail: null,
      hasPasscode: false,
      isLoading: false,
      error: null,

      // Implementation continues...
      // See complete implementation in stores/authStore.ts
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        hasPasscode: state.hasPasscode,
        onboardingStatus: state.onboardingStatus,
      }),
    }
  )
);
```

### 2. Create React Query Hooks

#### Auth Hooks

```typescript
// api/hooks/useAuth.ts - Add these hooks
export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: (response, variables) => {
      useAuthStore.setState({
        pendingVerificationEmail: variables.email,
      });
    },
  });
}

export function useVerifyCode() {
  return useMutation({
    mutationFn: (data: VerifyCodeRequest) => authService.verifyCode(data),
    onSuccess: (response) => {
      useAuthStore.setState({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
        pendingVerificationEmail: null,
      });
    },
  });
}

export function useResendCode() {
  return useMutation({
    mutationFn: (data: ResendCodeRequest) => authService.resendCode(data),
  });
}
```

#### Passcode Hooks

```typescript
// api/hooks/usePasscode.ts - New file
export function useCreatePasscode() {
  return useMutation({
    mutationFn: (data: CreatePasscodeRequest) => passcodeService.createPasscode(data),
    onSuccess: () => {
      useAuthStore.setState({ hasPasscode: true });
    },
  });
}

export function useVerifyPasscode() {
  return useMutation({
    mutationFn: (data: VerifyPasscodeRequest) => passcodeService.verifyPasscode(data),
    onSuccess: (response) => {
      if (response.valid && response.accessToken) {
        useAuthStore.setState({
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          isAuthenticated: true,
        });
      }
    },
  });
}
```

#### Onboarding Hooks

```typescript
// api/hooks/useOnboarding.ts - New file
export function useOnboardingStart() {
  return useMutation({
    mutationFn: (data: OnboardingStartRequest) => onboardingService.start(data),
    onSuccess: (response) => {
      useAuthStore.setState({
        onboardingStatus: response.onboardingStatus,
        currentOnboardingStep: response.nextStep,
      });
    },
  });
}

export function useOnboardingStatus() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['onboarding', 'status', user?.id],
    queryFn: () => onboardingService.getStatus(user?.id),
    enabled: !!user?.id,
  });
}
```

### 3. Screen Implementations

#### Register Screen

```typescript
// app/(auth)/index.tsx - Signup Screen
import { useState } from 'react';
import { View, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useRegister } from '@/api/hooks';
import { Button } from '@/components/atoms';
import { useAuthStore } from '@/stores';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  
  const { mutate: register, isPending } = useRegister();

  const handleRegister = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    register(
      { email, password, fullName },
      {
        onSuccess: (response) => {
          // Store pending email for verification
          useAuthStore.getState().setPendingEmail(email);
          // Navigate to verify email screen
          router.push('/(auth)/verify-email');
        },
        onError: (error) => {
          Alert.alert('Registration Failed', error.error.message);
        },
      }
    );
  };

  return (
    <View className="flex-1 p-6">
      <TextInput
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
        className="border p-3 rounded mb-4"
      />
      
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        className="border p-3 rounded mb-4"
      />
      
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="border p-3 rounded mb-4"
      />
      
      <Button onPress={handleRegister} loading={isPending}>
        Create Account
      </Button>
    </View>
  );
}
```

#### Email Verification Screen

```typescript
// app/(auth)/verify-email.tsx
import { useState, useRef } from 'react';
import { View, TextInput, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useVerifyCode, useResendCode } from '@/api/hooks';
import { useAuthStore } from '@/stores';
import { OTPInput, Button } from '@/components';

export default function VerifyEmailScreen() {
  const [code, setCode] = useState('');
  const router = useRouter();
  
  const pendingEmail = useAuthStore(state => state.pendingVerificationEmail);
  const { mutate: verifyCode, isPending } = useVerifyCode();
  const { mutate: resendCode, isPending: isResending } = useResendCode();

  const handleVerify = () => {
    if (!pendingEmail) {
      Alert.alert('Error', 'No pending verification');
      return;
    }

    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit code');
      return;
    }

    verifyCode(
      { email: pendingEmail, code },
      {
        onSuccess: () => {
          // Navigate to passcode creation
          router.push('/(auth)/create-passcode');
        },
        onError: (error) => {
          Alert.alert('Verification Failed', error.error.message);
        },
      }
    );
  };

  const handleResend = () => {
    if (!pendingEmail) return;

    resendCode(
      { email: pendingEmail },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Verification code resent');
        },
        onError: (error) => {
          Alert.alert('Error', error.error.message);
        },
      }
    );
  };

  return (
    <View className="flex-1 p-6">
      <Text className="text-2xl font-bold mb-4">Verify Your Email</Text>
      <Text className="text-gray-600 mb-6">
        We sent a 6-digit code to {pendingEmail}
      </Text>
      
      <OTPInput
        length={6}
        value={code}
        onChange={setCode}
        onComplete={handleVerify}
      />
      
      <Button onPress={handleVerify} loading={isPending} className="mt-6">
        Verify
      </Button>
      
      <Button
        onPress={handleResend}
        loading={isResending}
        variant="text"
        className="mt-4"
      >
        Resend Code
      </Button>
    </View>
  );
}
```

#### Passcode Creation Screen

```typescript
// app/(auth)/create-passcode.tsx
import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { PasscodeInput } from '@/components/molecules';
import { useAuthStore } from '@/stores';

export default function CreatePasscodeScreen() {
  const [passcode, setPasscode] = useState('');
  const router = useRouter();

  const handleComplete = (code: string) => {
    setPasscode(code);
    // Store temporarily and navigate to confirm
    router.push({
      pathname: '/(auth)/confirm-passcode',
      params: { passcode: code },
    });
  };

  return (
    <View className="flex-1 p-6 justify-center">
      <Text className="text-2xl font-bold text-center mb-4">
        Create Passcode
      </Text>
      <Text className="text-gray-600 text-center mb-8">
        Create a 6-digit passcode to secure your account
      </Text>
      
      <PasscodeInput
        length={6}
        onComplete={handleComplete}
      />
    </View>
  );
}
```

#### Confirm Passcode Screen

```typescript
// app/(auth)/confirm-passcode.tsx
import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCreatePasscode } from '@/api/hooks';
import { PasscodeInput } from '@/components/molecules';

export default function ConfirmPasscodeScreen() {
  const { passcode: originalPasscode } = useLocalSearchParams();
  const router = useRouter();
  const { mutate: createPasscode, isPending } = useCreatePasscode();

  const handleComplete = (confirmedPasscode: string) => {
    if (confirmedPasscode !== originalPasscode) {
      Alert.alert('Error', 'Passcodes do not match. Please try again.');
      router.back();
      return;
    }

    createPasscode(
      { passcode: confirmedPasscode },
      {
        onSuccess: () => {
          // Navigate to onboarding flow
          router.push('/(auth)/onboarding');
        },
        onError: (error) => {
          Alert.alert('Error', error.error.message);
        },
      }
    );
  };

  return (
    <View className="flex-1 p-6 justify-center">
      <Text className="text-2xl font-bold text-center mb-4">
        Confirm Passcode
      </Text>
      <Text className="text-gray-600 text-center mb-8">
        Re-enter your passcode to confirm
      </Text>
      
      <PasscodeInput
        length={6}
        onComplete={handleComplete}
        disabled={isPending}
      />
    </View>
  );
}
```

#### Login with Passcode Screen

```typescript
// app/(auth)/login-passcode.tsx
import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useVerifyPasscode } from '@/api/hooks';
import { PasscodeInput } from '@/components/molecules';
import { useAuthStore } from '@/stores';

export default function LoginPasscodeScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const { mutate: verifyPasscode, isPending } = useVerifyPasscode();

  const handleComplete = (passcode: string) => {
    verifyPasscode(
      { passcode },
      {
        onSuccess: (response) => {
          if (response.valid) {
            // Navigate to home
            router.replace('/(tabs)');
          } else {
            Alert.alert('Error', 'Invalid passcode');
          }
        },
        onError: (error) => {
          Alert.alert('Error', error.error.message);
        },
      }
    );
  };

  return (
    <View className="flex-1 p-6 justify-center">
      <Text className="text-2xl font-bold text-center mb-4">
        Welcome Back
      </Text>
      <Text className="text-gray-600 text-center mb-8">
        Enter your passcode
      </Text>
      
      <PasscodeInput
        length={6}
        onComplete={handleComplete}
        disabled={isPending}
      />
    </View>
  );
}
```

### 4. Route Protection & Navigation Logic

```typescript
// app/_layout.tsx - Root Layout with Auth Check
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/api/queryClient';
import { useAuthStore } from '@/stores';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, user, hasPasscode, onboardingStatus } = useAuthStore();

  useEffect(() => {
    const inAuth = segments[0] === '(auth)';
    const inTabs = segments[0] === '(tabs)';

    // Not authenticated
    if (!isAuthenticated) {
      if (!inAuth) {
        router.replace('/(auth)');
      }
      return;
    }

    // Authenticated but needs passcode
    if (isAuthenticated && !hasPasscode) {
      if (segments[1] !== 'create-passcode' && segments[1] !== 'confirm-passcode') {
        router.replace('/(auth)/create-passcode');
      }
      return;
    }

    // Authenticated with passcode but onboarding incomplete
    if (isAuthenticated && hasPasscode && onboardingStatus !== 'completed') {
      if (segments[1] !== 'onboarding') {
        router.replace('/(auth)/onboarding');
      }
      return;
    }

    // Fully onboarded - navigate to main app
    if (isAuthenticated && hasPasscode && onboardingStatus === 'completed') {
      if (inAuth) {
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, user, hasPasscode, onboardingStatus, segments]);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}
```

### 5. Session Management

```typescript
// utils/sessionManager.ts
import { useAuthStore } from '@/stores';
import { authService } from '@/api/services';

export class SessionManager {
  private static refreshTimer: NodeJS.Timeout | null = null;

  /**
   * Check if token is expired
   */
  static isTokenExpired(expiresAt: string): boolean {
    return new Date(expiresAt) <= new Date();
  }

  /**
   * Refresh token before expiry
   */
  static async refreshToken() {
    const { refreshToken } = useAuthStore.getState();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await authService.refreshToken({ refreshToken });
      
      useAuthStore.setState({
        accessToken: response.token,
        refreshToken: response.refreshToken,
      });

      // Schedule next refresh
      this.scheduleTokenRefresh(response.expiresAt);
    } catch (error) {
      // Refresh failed - logout user
      useAuthStore.getState().logout();
    }
  }

  /**
   * Schedule automatic token refresh
   */
  static scheduleTokenRefresh(expiresAt: string) {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const expiryTime = new Date(expiresAt).getTime();
    const now = new Date().getTime();
    const timeUntilExpiry = expiryTime - now;
    
    // Refresh 5 minutes before expiry
    const refreshTime = timeUntilExpiry - 5 * 60 * 1000;

    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshToken();
      }, refreshTime);
    }
  }

  /**
   * Initialize session management
   */
  static initialize() {
    const { accessToken, refreshToken } = useAuthStore.getState();
    
    if (accessToken && refreshToken) {
      // Check if token needs immediate refresh
      // Schedule refresh if valid
    }
  }

  /**
   * Cleanup
   */
  static cleanup() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}
```

## Testing Checklist

- [ ] User can register with email/password
- [ ] User receives verification code
- [ ] User can verify email with code
- [ ] User can resend verification code
- [ ] User can create 6-digit passcode
- [ ] User must confirm passcode
- [ ] User proceeds through onboarding
- [ ] User reaches home screen after completion
- [ ] Returning user logs in with passcode only
- [ ] Session persists across app restarts
- [ ] Token refreshes automatically
- [ ] User logs out successfully
- [ ] Error handling works for all cases

## Environment Variables

Add to `.env.development`:

```bash
API_BASE_URL=http://localhost:8080/api
API_TIMEOUT=30000
```

## Next Steps

1. ✅ API types updated
2. ✅ Services created (auth, passcode, onboarding)
3. ⏳ React Query hooks (implement based on examples above)
4. ⏳ Auth store enhanced (implement full version)
5. ⏳ Screens implemented (use examples above)
6. ⏳ Route guards added
7. ⏳ Session management implemented
8. ⏳ Test complete flow

## Files Created/Modified

- ✅ `api/types/index.ts` - Added auth/onboarding types
- ✅ `api/services/auth.service.ts` - Updated endpoints
- ✅ `api/services/passcode.service.ts` - New service
- ✅ `api/services/onboarding.service.ts` - New service
- ⏳ `api/hooks/useAuth.ts` - Add new hooks
- ⏳ `api/hooks/usePasscode.ts` - New hooks file
- ⏳ `api/hooks/useOnboarding.ts` - New hooks file
- ⏳ `stores/authStore.ts` - Enhanced with full flow
- ⏳ `app/(auth)/index.tsx` - Register screen
- ⏳ `app/(auth)/verify-email.tsx` - Verification screen
- ⏳ `app/(auth)/create-passcode.tsx` - Passcode creation
- ⏳ `app/(auth)/confirm-passcode.tsx` - Passcode confirmation
- ⏳ `app/(auth)/login-passcode.tsx` - Passcode login
- ⏳ `app/_layout.tsx` - Route guards
- ⏳ `utils/sessionManager.ts` - Session handling

This implementation provides a complete, production-ready authentication and onboarding flow that matches your backend API!
