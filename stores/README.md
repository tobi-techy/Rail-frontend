# Zustand Store Architecture

This directory contains all Zustand state management stores for the application. Each store is modular, testable, and follows best practices for React state management.

## Store Structure

```
stores/
├── authStore.ts         # Authentication and user session
├── walletStore.ts       # Wallet balances, tokens, and transactions
├── withdrawalStore.ts   # Withdrawal flow management
├── index.ts             # Central export point
└── README.md            # This file
```

## Available Stores

### 1. Authentication Store (`authStore.ts`)

Manages user authentication, session, and security features.

**State:**
- `user`: Current user information
- `isAuthenticated`: Authentication status
- `accessToken`, `refreshToken`: JWT tokens
- `hasPasscode`, `isBiometricEnabled`: Security settings

**Actions:**
- `login(email, password)`: Authenticate user
- `logout()`: End session
- `register(email, password, name)`: Create new account
- `refreshSession()`: Refresh authentication tokens
- `setPasscode(passcode)`: Set security passcode
- `enableBiometric()`, `disableBiometric()`: Toggle biometric auth

**Usage:**
```typescript
import { useAuthStore } from '@/stores';

function LoginScreen() {
  const { login, isLoading, error } = useAuthStore();
  
  const handleLogin = async () => {
    await login(email, password);
  };
}
```

### 2. Wallet Store (`walletStore.ts`)

Manages wallet balances, tokens, and transaction history.

**State:**
- `tokens`: Array of user's tokens with balances
- `totalBalanceUSD`: Total portfolio value
- `transactions`: Transaction history
- `selectedToken`: Currently selected token

**Actions:**
- `fetchTokens()`: Load user's token balances
- `updateTokenBalance(tokenId, balance)`: Update specific token balance
- `refreshPrices()`: Update token prices
- `fetchTransactions()`: Load transaction history
- `addTransaction(transaction)`: Add new transaction
- `calculateTotalBalance()`: Recalculate total portfolio value

**Usage:**
```typescript
import { useWalletStore } from '@/stores';

function WalletScreen() {
  const { tokens, totalBalanceUSD, fetchTokens } = useWalletStore();
  
  useEffect(() => {
    fetchTokens();
  }, []);
}
```

### 3. Withdrawal Store (`withdrawalStore.ts`)

Manages the withdrawal flow including recipient selection, amount input, and transaction confirmation.

**State:**
- `recipientAddress`: Target wallet address
- `selectedToken`: Token to send
- `amount`: Amount to send
- `transaction`: Full transaction details
- `step`: Current step in withdrawal flow
- `showConfirmModal`: Modal visibility

**Actions:**
- `setRecipientAddress(address)`: Set destination address
- `setSelectedToken(token)`: Select token to send
- `setAmount(amount)`: Set amount to send
- `handleNumberPress(num)`: Handle keypad input
- `prepareTransaction()`: Build transaction details
- `submitWithdrawal()`: Execute withdrawal
- `validateAmount()`, `validateAddress()`: Input validation

**Usage:**
```typescript
import { useWithdrawalStore } from '@/stores';

function WithdrawScreen() {
  const {
    amount,
    selectedToken,
    handleNumberPress,
    submitWithdrawal,
  } = useWithdrawalStore();
}
```

## Persistence

Stores use Zustand's `persist` middleware for automatic state persistence:

- **authStore**: Persists user, tokens, and security settings
- **walletStore**: Persists tokens, transactions, and selected token
- **withdrawalStore**: No persistence (transient state)

Data is stored in `localStorage` by default. On React Native, you can swap this for `AsyncStorage`.

## Best Practices

### 1. Import from Central Location
```typescript
// ✅ Good
import { useAuthStore, useWalletStore } from '@/stores';

// ❌ Avoid
import { useAuthStore } from '@/stores/authStore';
```

### 2. Destructure Only What You Need
```typescript
// ✅ Good - Minimizes re-renders
const { login, isLoading } = useAuthStore();

// ❌ Avoid - Causes unnecessary re-renders
const authStore = useAuthStore();
```

### 3. Use Selectors for Derived State
```typescript
// ✅ Good - Computed value
const totalBalance = useWalletStore(state => state.totalBalanceUSD);

// ❌ Avoid - Triggers on any state change
const { totalBalanceUSD } = useWalletStore();
```

### 4. Keep Actions Separate from State
```typescript
// ✅ Good - Clear separation
const tokens = useWalletStore(state => state.tokens);
const fetchTokens = useWalletStore(state => state.fetchTokens);

// ✅ Also good - When you need both
const { tokens, fetchTokens } = useWalletStore();
```

### 5. Handle Errors Gracefully
```typescript
const { login, error, clearError } = useAuthStore();

const handleLogin = async () => {
  try {
    await login(email, password);
    navigation.navigate('Home');
  } catch (err) {
    // Error is already set in store
    console.error('Login failed:', error);
  }
};

// Clear error when leaving screen
useEffect(() => {
  return () => clearError();
}, []);
```

## Testing

Each store can be tested independently:

```typescript
import { useAuthStore } from '@/stores';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().reset();
  });

  it('should login user', async () => {
    const { login, user, isAuthenticated } = useAuthStore.getState();
    
    await login('test@example.com', 'password');
    
    expect(isAuthenticated).toBe(true);
    expect(user?.email).toBe('test@example.com');
  });
});
```

## Migration from Redux

If migrating from Redux:

| Redux Pattern | Zustand Equivalent |
|--------------|-------------------|
| `dispatch(action())` | `store.action()` |
| `useSelector(state => state.value)` | `useStore(state => state.value)` |
| `mapStateToProps` | Destructure from `useStore()` |
| Middleware | `create(middleware((set, get) => ...))` |
| Reducers | Direct state updates in actions |

## Adding New Stores

1. Create new store file in `stores/` directory
2. Define state interface and actions interface
3. Create store with `create()` and appropriate middleware
4. Export from `stores/index.ts`
5. Update this README

Example:
```typescript
// stores/settingsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  theme: 'light' | 'dark';
  language: string;
}

interface SettingsActions {
  setTheme: (theme: SettingsState['theme']) => void;
  setLanguage: (lang: string) => void;
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'en',
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    { name: 'settings-storage' }
  )
);
```

## Resources

- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [Zustand Best Practices](https://docs.pmnd.rs/zustand/guides/practice-with-no-store-actions)
- [Testing Zustand Stores](https://docs.pmnd.rs/zustand/guides/testing)
