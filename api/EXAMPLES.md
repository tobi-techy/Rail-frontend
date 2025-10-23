# API Integration Examples

Real-world examples of using the API integration layer in your app.

## Setup in Root Layout

```typescript
// app/_layout.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/api/queryClient';
import { Stack } from 'expo-router';

export default function RootLayout() {
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

## Authentication Examples

### Login Screen

```typescript
// app/(auth)/signin.tsx
import { useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useLogin } from '@/api/hooks';
import { Button } from '@/components/atoms';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  
  const { mutate: login, isPending, error } = useLogin();

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    login(
      { email, password },
      {
        onSuccess: () => {
          // Auth store is automatically updated
          router.replace('/(tabs)');
        },
        onError: (error) => {
          Alert.alert('Login Failed', error.error.message);
        },
      }
    );
  };

  return (
    <View className="flex-1 p-6">
      <Text className="text-2xl font-bold mb-6">Sign In</Text>
      
      <TextInput
        className="border p-3 rounded mb-4"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        className="border p-3 rounded mb-4"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error && (
        <Text className="text-red-500 mb-4">{error.error.message}</Text>
      )}
      
      <Button
        onPress={handleLogin}
        disabled={isPending}
        loading={isPending}
      >
        {isPending ? 'Signing in...' : 'Sign In'}
      </Button>
    </View>
  );
}
```

### Register Screen

```typescript
// app/(auth)/register.tsx
import { useState } from 'react';
import { View, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useRegister } from '@/api/hooks';
import { Button } from '@/components/atoms';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phoneNumber: '',
  });
  
  const router = useRouter();
  const { mutate: register, isPending } = useRegister();

  const handleRegister = () => {
    register(formData, {
      onSuccess: () => {
        router.replace('/(tabs)');
      },
      onError: (error) => {
        Alert.alert('Registration Failed', error.error.message);
      },
    });
  };

  return (
    <View className="flex-1 p-6">
      <TextInput
        placeholder="Full Name"
        value={formData.name}
        onChangeText={(name) => setFormData({ ...formData, name })}
      />
      
      <TextInput
        placeholder="Email"
        value={formData.email}
        onChangeText={(email) => setFormData({ ...formData, email })}
        keyboardType="email-address"
      />
      
      <TextInput
        placeholder="Phone Number"
        value={formData.phoneNumber}
        onChangeText={(phoneNumber) => setFormData({ ...formData, phoneNumber })}
        keyboardType="phone-pad"
      />
      
      <TextInput
        placeholder="Password"
        value={formData.password}
        onChangeText={(password) => setFormData({ ...formData, password })}
        secureTextEntry
      />
      
      <Button onPress={handleRegister} loading={isPending}>
        Create Account
      </Button>
    </View>
  );
}
```

## Wallet Examples

### Wallet Balance Display

```typescript
// app/(tabs)/index.tsx
import { View, Text, RefreshControl, ScrollView } from 'react-native';
import { useWalletBalance, useTransactions } from '@/api/hooks';
import { TokenCard, TransactionItem } from '@/components/molecules';
import { LoadingSkeleton } from '@/components/atoms';

export default function HomeScreen() {
  const {
    data: balance,
    isLoading: balanceLoading,
    error: balanceError,
    refetch: refetchBalance,
  } = useWalletBalance();

  const {
    data: transactions,
    isLoading: txLoading,
    refetch: refetchTransactions,
  } = useTransactions({ limit: 10 });

  const isRefreshing = balanceLoading || txLoading;

  const handleRefresh = () => {
    refetchBalance();
    refetchTransactions();
  };

  if (balanceLoading) {
    return <LoadingSkeleton />;
  }

  if (balanceError) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-red-500">{balanceError.error.message}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Total Balance */}
      <View className="p-6 bg-blue-500">
        <Text className="text-white text-sm">Total Balance</Text>
        <Text className="text-white text-4xl font-bold">
          ${balance?.totalBalanceUSD || '0.00'}
        </Text>
      </View>

      {/* Tokens */}
      <View className="p-4">
        <Text className="text-lg font-bold mb-3">Your Assets</Text>
        {balance?.tokens.map((token) => (
          <TokenCard key={token.id} token={token} />
        ))}
      </View>

      {/* Recent Transactions */}
      <View className="p-4">
        <Text className="text-lg font-bold mb-3">Recent Transactions</Text>
        {transactions?.data.map((tx) => (
          <TransactionItem key={tx.id} transaction={tx} />
        ))}
      </View>
    </ScrollView>
  );
}
```

### Withdrawal Flow

```typescript
// app/withdraw/index.tsx
import { useState } from 'react';
import { View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  useWalletBalance,
  useValidateAddress,
  useEstimateFee,
  useCreateTransfer,
} from '@/api/hooks';
import { SendAmountKeypad } from '@/components/withdraw';

export default function WithdrawScreen() {
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const router = useRouter();

  const { data: balance } = useWalletBalance();
  const { mutate: validateAddress } = useValidateAddress();
  const { mutate: estimateFee, data: feeEstimate } = useEstimateFee();
  const { mutate: createTransfer, isPending } = useCreateTransfer();

  const selectedToken = balance?.tokens[0]; // USDC

  const handleValidateAddress = () => {
    validateAddress(
      {
        address,
        network: 'ethereum',
      },
      {
        onSuccess: (result) => {
          if (!result.valid) {
            Alert.alert('Invalid Address', 'Please enter a valid wallet address');
          }
        },
      }
    );
  };

  const handleEstimateFee = () => {
    if (!selectedToken) return;

    estimateFee({
      tokenId: selectedToken.id,
      toAddress: address,
      amount,
      network: 'ethereum',
    });
  };

  const handleWithdraw = () => {
    if (!selectedToken) return;

    createTransfer(
      {
        tokenId: selectedToken.id,
        toAddress: address,
        amount,
        network: 'ethereum',
      },
      {
        onSuccess: (response) => {
          router.push({
            pathname: '/withdraw/success',
            params: { txHash: response.transaction.txHash },
          });
        },
        onError: (error) => {
          Alert.alert('Transfer Failed', error.error.message);
        },
      }
    );
  };

  return (
    <View className="flex-1">
      <SendAmountKeypad
        amount={amount}
        onAmountChange={setAmount}
        address={address}
        onAddressChange={setAddress}
        onValidateAddress={handleValidateAddress}
        onEstimateFee={handleEstimateFee}
        onSubmit={handleWithdraw}
        isLoading={isPending}
        fee={feeEstimate?.feeUSD}
      />
    </View>
  );
}
```

## User Profile Examples

### Profile Screen

```typescript
// app/(tabs)/profile.tsx
import { View, Text, TextInput, Alert } from 'react-native';
import { useUserProfile, useUpdateProfile } from '@/api/hooks';
import { Button } from '@/components/atoms';
import { useState, useEffect } from 'react';

export default function ProfileScreen() {
  const { data: profile, isLoading } = useUserProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhoneNumber(profile.phoneNumber || '');
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile(
      { name, phoneNumber },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Profile updated successfully');
        },
        onError: (error) => {
          Alert.alert('Error', error.error.message);
        },
      }
    );
  };

  if (isLoading) return <Text>Loading...</Text>;

  return (
    <View className="flex-1 p-6">
      <Text className="text-2xl font-bold mb-6">Profile</Text>

      <Text className="mb-2">Email</Text>
      <Text className="p-3 bg-gray-100 rounded mb-4">{profile?.email}</Text>

      <Text className="mb-2">Name</Text>
      <TextInput
        className="border p-3 rounded mb-4"
        value={name}
        onChangeText={setName}
      />

      <Text className="mb-2">Phone Number</Text>
      <TextInput
        className="border p-3 rounded mb-4"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />

      <Button onPress={handleSave} loading={isPending}>
        Save Changes
      </Button>
    </View>
  );
}
```

### Notifications Screen

```typescript
// app/notifications.tsx
import { FlatList, View, Text, TouchableOpacity } from 'react-native';
import {
  useNotifications,
  useMarkNotificationsRead,
} from '@/api/hooks';

export default function NotificationsScreen() {
  const { data, isLoading, refetch } = useNotifications({
    page: 1,
    limit: 20,
  });
  
  const { mutate: markAsRead } = useMarkNotificationsRead();

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(
      { notificationIds: [notificationId] },
      {
        onSuccess: () => refetch(),
      }
    );
  };

  return (
    <FlatList
      data={data?.data}
      keyExtractor={(item) => item.id}
      refreshing={isLoading}
      onRefresh={refetch}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => handleMarkAsRead(item.id)}
          className={`p-4 border-b ${item.read ? 'bg-white' : 'bg-blue-50'}`}
        >
          <Text className="font-bold">{item.title}</Text>
          <Text className="text-gray-600">{item.message}</Text>
          <Text className="text-xs text-gray-400 mt-2">
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}
```

## Advanced Examples

### Optimistic Updates

```typescript
import { useUpdateProfile } from '@/api/hooks';
import { queryClient, queryKeys } from '@/api/queryClient';

function EditProfileButton() {
  const { mutate: updateProfile } = useUpdateProfile();

  const handleQuickUpdate = (newName: string) => {
    updateProfile(
      { name: newName },
      {
        // Optimistic update
        onMutate: async (newData) => {
          // Cancel outgoing refetches
          await queryClient.cancelQueries({
            queryKey: queryKeys.user.profile(),
          });

          // Snapshot previous value
          const previousProfile = queryClient.getQueryData(
            queryKeys.user.profile()
          );

          // Optimistically update the cache
          queryClient.setQueryData(queryKeys.user.profile(), (old: any) => ({
            ...old,
            ...newData,
          }));

          // Return context with previous value
          return { previousProfile };
        },
        // Rollback on error
        onError: (err, newData, context) => {
          queryClient.setQueryData(
            queryKeys.user.profile(),
            context?.previousProfile
          );
        },
        // Refetch on settle
        onSettled: () => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.user.profile(),
          });
        },
      }
    );
  };

  return <Button onPress={() => handleQuickUpdate('New Name')} />;
}
```

### Polling for Updates

```typescript
import { useTransaction } from '@/api/hooks';

function TransactionStatusTracker({ txId }: { txId: string }) {
  const { data: transaction } = useTransaction(txId, {
    // Poll every 5 seconds while pending
    refetchInterval: (data) => {
      return data?.status === 'pending' ? 5000 : false;
    },
  });

  return (
    <View>
      <Text>Status: {transaction?.status}</Text>
      {transaction?.status === 'pending' && <Text>Updating...</Text>}
    </View>
  );
}
```

### Infinite Scroll

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { walletService } from '@/api/services';
import { queryKeys } from '@/api/queryClient';

function TransactionList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.wallet.transactions(),
    queryFn: ({ pageParam = 1 }) =>
      walletService.getTransactions({ page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });

  return (
    <FlatList
      data={data?.pages.flatMap((page) => page.data)}
      keyExtractor={(item) => item.id}
      onEndReached={() => hasNextPage && fetchNextPage()}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isFetchingNextPage ? <Text>Loading more...</Text> : null
      }
      renderItem={({ item }) => <TransactionItem transaction={item} />}
    />
  );
}
```

## Error Handling Patterns

### Component-Level Error Handling

```typescript
function WalletScreen() {
  const { data, isLoading, error, refetch } = useWalletBalance();

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-lg font-bold text-red-500 mb-4">
          {error.error.message}
        </Text>
        <Button onPress={() => refetch()}>Try Again</Button>
      </View>
    );
  }

  return <WalletView balance={data} />;
}
```

### Global Error Boundary

```typescript
// components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';
import { View, Text, Button } from 'react-native';

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-xl font-bold mb-4">Something went wrong</Text>
          <Text className="text-gray-600 mb-6">
            {this.state.error?.message}
          </Text>
          <Button
            title="Reload"
            onPress={() => this.setState({ hasError: false })}
          />
        </View>
      );
    }

    return this.props.children;
  }
}
```

These examples cover the most common use cases. For more advanced patterns, refer to the [React Query documentation](https://tanstack.com/query/latest).
