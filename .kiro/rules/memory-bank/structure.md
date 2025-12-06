# Project Structure

## Directory Organization

### `/app` - Application Screens (Expo Router)
File-based routing structure for all application screens:
- **(auth)/** - Authentication flow screens (signin, signup, onboarding, passcode creation)
- **(tabs)/** - Main app tab navigation (home, invest, card, profile)
- **basket/** - Basket creation and management screens
- **deposit/** - Deposit flow screens (network selection, address display)
- **withdraw/** - Withdrawal flow screens
- **_layout.tsx** - Root layout configuration

### `/components` - Reusable UI Components
Atomic design pattern organization:
- **atoms/** - Basic building blocks (Button, InputField, Modal, Badge, Card, Icon, etc.)
- **molecules/** - Composite components (BalanceCard, BasketCard, TransactionItem, PasscodeInput, etc.)
- **organisms/** - Complex feature components (FinancialDashboard, BattlePass, NavigationBar, etc.)
- **navigation/** - Navigation-specific components (GlassTabBar)
- **ui/** - Core UI primitives (Button, Input, OTPInput, PhoneInput)
- **basket/** - Basket-specific components (BasketCreationFlow)
- **deposit/** - Deposit-specific components (ScreenHeader)
- **withdraw/** - Withdrawal-specific components (ConfirmTransactionModal, SendAmountKeypad, etc.)

### `/api` - Backend Communication Layer
Centralized API management:
- **services/** - Domain-specific API services (auth, wallet, portfolio, onboarding, user, passcode)
- **hooks/** - React Query hooks for data fetching (useAuth, useWallet, usePortfolio, useUser, etc.)
- **types/** - TypeScript type definitions for API contracts
- **interceptors/** - Request/response interceptors (error handling)
- **client.ts** - Axios client configuration
- **queryClient.ts** - React Query client setup

### `/stores` - State Management (Zustand)
Global application state:
- **authStore.ts** - Authentication state (user, tokens, session)
- **walletStore.ts** - Wallet state (balances, addresses, transactions)
- **withdrawalStore.ts** - Withdrawal flow state
- **uiStore.ts** - UI state (modals, loading, notifications)
- **base/** - Store creation utilities and base patterns

### `/utils` - Utility Functions
Helper functions and utilities:
- **encryption.ts** - Encryption/decryption utilities
- **secureStorage.ts** - Secure storage wrapper (Expo SecureStore)
- **sessionManager.ts** - Session management and token handling
- **validators.ts** - Input validation functions
- **sanitizeInput.ts** - Input sanitization
- **logSanitizer.ts** - Log sanitization for security
- **errorLogger.ts** - Error logging utilities
- **chains.ts** - Blockchain network configurations
- **routeHelpers.ts** - Navigation helpers

### `/lib` - Domain Logic Layer
Business logic and domain models:
- **domain/** - Domain-specific logic (auth, portfolio, wallet)
- **errors/** - Custom error classes (AppError)
- **constants/** - Application constants and messages

### `/types` - TypeScript Type Definitions
Global type definitions:
- **routing.types.ts** - Navigation and routing types
- **index.ts** - Exported type definitions
- Module declaration files for third-party libraries (crypto-js, d3-scale, svg, png)

### `/hooks` - Custom React Hooks
Reusable React hooks:
- **domain/** - Domain-specific hooks (useWithdrawal)
- **useFonts.ts** - Font loading hook
- **useProtectedRoute.ts** - Route protection hook
- **withFonts.tsx** - HOC for font loading

### `/assets` - Static Assets
Application assets:
- **fonts/** - Custom fonts (SF Pro Rounded, MD Nichrome, Boldonse)
- **Icons/** - SVG icon library
- **images/** - PNG/JPG images (onboarding, avatars, etc.)
- **svg/** - Blockchain network logos (USDC, Solana, Base, BNB, Matic)
- **illustration/** - Illustrations (basket)
- **app-icon/** - App icons for iOS (light, dark, tinted)

### `/constants` - Application Constants
Static configuration:
- **depositOptions.ts** - Deposit network configurations
- **fonts.ts** - Font family definitions

### `/design` - Design System
Design tokens and theming:
- **tokens.ts** - Design tokens (colors, spacing, typography)

### `/__tests__` - Test Files
Unit and integration tests:
- **api/** - API service tests
- **stores/** - Store tests (authStore.test.ts)
- **utils/** - Utility function tests (logSanitizer.test.ts)

### `/__mocks__` - Test Mocks
Mock implementations for testing:
- **wallet.mock.ts** - Wallet mock data
- **index.ts** - Mock exports

### `/docs` - Documentation
Project documentation:
- **architecture.md** - Backend architecture details
- **prd.md** - Product requirements document
- **epics.md** - Feature epics
- **CONTRIBUTING.md** - Contribution guidelines
- **story/** - User stories and feature documentation

## Architectural Patterns

### Component Architecture
- **Atomic Design**: Components organized by complexity (atoms → molecules → organisms)
- **Functional Components**: All components use function syntax with hooks
- **TypeScript Interfaces**: Strict typing for props and state

### State Management
- **Zustand Stores**: Lightweight global state management
- **React Query**: Server state management with caching
- **Local State**: Component-level state with useState/useReducer

### API Communication
- **Service Layer**: Domain-specific API services
- **Hook Layer**: React Query hooks for data fetching
- **Type Safety**: Full TypeScript coverage for API contracts

### Navigation
- **Expo Router**: File-based routing system
- **Stack Navigation**: For authentication flows
- **Tab Navigation**: For main app navigation
- **Modal Navigation**: For overlays and dialogs

### Data Flow
```
User Interaction
    ↓
Component
    ↓
API Hook (React Query)
    ↓
API Service (Axios)
    ↓
Backend API
    ↓
Store Update (Zustand)
    ↓
Component Re-render
```

### Security Layers
- **Secure Storage**: Expo SecureStore for sensitive data
- **Encryption**: Crypto-JS for data encryption
- **Session Management**: Token-based authentication with refresh
- **Input Sanitization**: All user inputs sanitized
- **Log Sanitization**: Sensitive data removed from logs

## Key Relationships

### Authentication Flow
`app/(auth)` → `api/hooks/useAuth` → `api/services/auth.service` → `stores/authStore` → `utils/sessionManager`

### Wallet Management
`app/(tabs)/index` → `api/hooks/useWallet` → `api/services/wallet.service` → `stores/walletStore` → `utils/secureStorage`

### Investment Flow
`app/(tabs)/invest` → `api/hooks/usePortfolio` → `api/services/portfolio.service` → `components/molecules/BasketCard`

### Deposit Flow
`app/deposit` → `components/deposit/ScreenHeader` → `api/hooks/useWallet` → `constants/depositOptions`

### Withdrawal Flow
`app/withdraw` → `stores/withdrawalStore` → `hooks/domain/useWithdrawal` → `components/withdraw/SendAmountKeypad`
