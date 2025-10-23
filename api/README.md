## API Integration Architecture

Complete API integration setup with Axios, React Query, and TypeScript for clean, maintainable API communication.

## Directory Structure

```
api/
├── client.ts              # Axios client with interceptors
├── queryClient.ts         # React Query configuration
├── types/
│   └── index.ts          # TypeScript interfaces for all API calls
├── services/
│   ├── auth.service.ts   # Authentication endpoints
│   ├── wallet.service.ts # Wallet & transaction endpoints
│   ├── user.service.ts   # User, settings, KYC endpoints
│   └── index.ts          # Service exports
├── hooks/
│   ├── useAuth.ts        # Auth hooks (login, register, etc.)
│   ├── useWallet.ts      # Wallet hooks (balance, transactions, etc.)
│   ├── useUser.ts        # User hooks (profile, settings, etc.)
│   └── index.ts          # Hook exports
└── README.md             # This file
```

## Features

✅ **Type-safe API calls** with full TypeScript support  
✅ **Automatic token management** with refresh logic  
✅ **Request/response interceptors** for auth and logging  
✅ **Smart caching** with React Query  
✅ **Automatic retries** with exponential backoff  
✅ **Optimistic updates** for better UX  
✅ **Error handling** with standardized error types  
✅ **File upload** support  
✅ **Request cancellation** support  

## Quick Start

### 1. Setup Query Provider

Wrap your app with `QueryClientProvider`:

```typescript
// app/_layout.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
    </QueryClientProvider>
  );
}
```

### 2. Use API Hooks

```typescript
import { useLogin, useWalletBalance, useTransactions } from '@/api/hooks';

function LoginScreen() {
  const { mutate: login, isPending } = useLogin();

  const handleLogin = () => {
    login(
      { email, password },
      {
        onSuccess: () => navigation.navigate('Home'),
        onError: (error) => console.error(error.error.message),
      }
    );
  };
}

function WalletScreen() {
  const { data: balance, isLoading } = useWalletBalance();
  const { data: transactions } = useTransactions({ limit: 20 });

  if (isLoading) return <Loading />;

  return (
    <View>
      <Text>Balance: ${balance?.totalBalanceUSD}</Text>
      {transactions?.data.map(tx => <TransactionItem key={tx.id} tx={tx} />)}
    </View>
  );
}
```

## API Services

### Authentication Service

```typescript
import { authService } from '@/api/services';

// Login
await authService.login({ email, password });

// Register
await authService.register({ email, password, name });

// Forgot password
await authService.forgotPassword({ email });

// Change password
await authService.changePassword({ currentPassword, newPassword });
```

### Wallet Service

```typescript
import { walletService } from '@/api/services';

// Get balance
const balance = await walletService.getBalance();

// Get transactions
const transactions = await walletService.getTransactions({ page: 1, limit: 20 });

// Create transfer
const result = await walletService.createTransfer({
  tokenId: 'usdc',
  toAddress: '0x...',
  amount: '100',
  network: 'ethereum',
});

// Validate address
const { valid } = await walletService.validateAddress({
  address: '0x...',
  network: 'ethereum',
});
```

### User Service

```typescript
import { userService } from '@/api/services';

// Get profile
const profile = await userService.getProfile();

// Update settings
await userService.updateSettings({
  notifications: { email: true, push: false },
});

// Submit KYC
await userService.submitKYC({
  documentType: 'passport',
  frontImage: base64Image,
  selfieImage: base64Selfie,
  personalInfo: { /* ... */ },
});

// Enable 2FA
const { qrCode, secret } = await userService.enable2FA();
```

## React Query Hooks

### Query Hooks (GET data)

```typescript
// Auth
const { data: user } = useCurrentUser();

// Wallet
const { data: balance, refetch } = useWalletBalance();
const { data: txs } = useTransactions({ type: 'send' });
const { data: prices } = useTokenPrices(['usdc', 'eth', 'sol']);

// User
const { data: profile } = useUserProfile();
const { data: settings } = useUserSettings();
const { data: notifications } = useNotifications({ unreadOnly: true });
```

### Mutation Hooks (POST/PUT/DELETE data)

```typescript
// Auth
const { mutate: login } = useLogin();
const { mutate: register } = useRegister();
const { mutate: logout } = useLogout();

// Wallet
const { mutate: transfer } = useCreateTransfer();
const { mutate: validate } = useValidateAddress();
const { mutate: estimateFee } = useEstimateFee();

// User
const { mutate: updateProfile } = useUpdateProfile();
const { mutate: updateSettings } = useUpdateSettings();
const { mutate: submitKYC } = useSubmitKYC();
```

## Configuration

### Environment Variables

Set in `.env.development` or `.env.production`:

```bash
API_BASE_URL=http://localhost:3000/api
API_TIMEOUT=30000
```

### Axios Client

The base client (`api/client.ts`) automatically:
- Adds auth tokens to requests
- Refreshes expired tokens
- Logs requests in development
- Transforms errors
- Handles network failures

### React Query Config

Default settings (`api/queryClient.ts`):
- **Stale time**: 5 minutes
- **Cache time**: 10 minutes
- **Retries**: 2 attempts for 5xx errors
- **Refetch**: On reconnect and stale data

## Advanced Usage

### Custom Query Options

```typescript
const { data } = useWalletBalance({
  refetchInterval: 10000, // Refetch every 10s
  staleTime: 5000,
  enabled: isAuthenticated,
});
```

### Optimistic Updates

```typescript
const { mutate } = useUpdateProfile();

mutate(
  { name: 'New Name' },
  {
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.user.profile() });

      // Snapshot previous value
      const previous = queryClient.getQueryData(queryKeys.user.profile());

      // Optimistically update
      queryClient.setQueryData(queryKeys.user.profile(), (old) => ({
        ...old,
        ...newData,
      }));

      return { previous };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKeys.user.profile(), context?.previous);
    },
  }
);
```

### Manual Cache Invalidation

```typescript
import { invalidateQueries } from '@/api/queryClient';

// Invalidate specific query
queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance() });

// Invalidate all wallet queries
invalidateQueries.wallet();

// Invalidate everything
invalidateQueries.all();
```

### File Upload

```typescript
import { uploadFile } from '@/api/client';

const result = await uploadFile(
  '/user/avatar',
  imageFile,
  'avatar',
  { userId: '123' }
);
```

### Request Cancellation

```typescript
import { createCancelToken } from '@/api/client';

const { token, cancel } = createCancelToken();

try {
  const data = await walletService.getBalance({ cancelToken: token });
} catch (error) {
  if (axios.isCancel(error)) {
    console.log('Request canceled');
  }
}

// Cancel the request
cancel('User canceled');
```

## Error Handling

All API errors follow a standard format:

```typescript
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
```

### Handle Errors in Components

```typescript
const { mutate: login, error } = useLogin();

// Error object
if (error) {
  console.log(error.error.code);    // 'INVALID_CREDENTIALS'
  console.log(error.error.message); // 'Invalid email or password'
}

// With callbacks
login(credentials, {
  onError: (error) => {
    Alert.alert('Error', error.error.message);
  },
});
```

### Global Error Handling

Errors are logged in development via the Axios interceptor. Add global error notifications in `api/queryClient.ts`:

```typescript
mutations: {
  onError: (error: ApiError) => {
    // Show toast/alert
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: error.error.message,
    });
  },
}
```

## Best Practices

### 1. Always Use Hooks

```typescript
// ✅ Good
const { data, isLoading } = useWalletBalance();

// ❌ Avoid direct service calls in components
const data = await walletService.getBalance();
```

### 2. Handle Loading & Error States

```typescript
const { data, isLoading, error } = useWalletBalance();

if (isLoading) return <Loading />;
if (error) return <Error message={error.error.message} />;
return <WalletView data={data} />;
```

### 3. Use Query Keys Consistently

```typescript
// ✅ Good - Use queryKeys factory
queryKeys.wallet.balance()

// ❌ Avoid - String keys
['wallet', 'balance']
```

### 4. Leverage Automatic Refetching

```typescript
// Wallet balance refetches every 60s automatically
const { data } = useWalletBalance();

// Or refetch manually
const { refetch } = useWalletBalance();
refetch();
```

### 5. Type Everything

All requests and responses are fully typed. Use the types:

```typescript
import type { LoginRequest, User, WalletBalance } from '@/api/types';
```

## Testing

### Mock API Responses

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

const queryClient = new QueryClient();

test('useWalletBalance returns balance', async () => {
  const { result } = renderHook(() => useWalletBalance(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    ),
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data.totalBalanceUSD).toBeDefined();
});
```

## Troubleshooting

### Token Not Attached to Requests

Make sure the auth store is populated:

```typescript
const { accessToken } = useAuthStore();
console.log('Token:', accessToken);
```

### Queries Not Refetching

Check if query is enabled:

```typescript
const { data } = useWalletBalance({
  enabled: isAuthenticated, // Won't run if false
});
```

### CORS Errors

Configure your backend to allow requests from your app's origin.

## Resources

- [Axios Documentation](https://axios-http.com/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
