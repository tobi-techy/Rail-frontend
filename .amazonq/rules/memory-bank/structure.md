# Project Structure

## Directory Organization

### `/app` - Application Routes (Expo Router)
File-based routing structure for the mobile application:
- **(auth)/** - Authentication flow screens (signin, signup, onboarding, passcode creation/confirmation, email verification, forgot password, profile completion)
- **(tabs)/** - Main tab navigation screens (home/index, invest, card, profile)
- **basket/** - Basket creation and management flows
- **deposit/** - Cryptocurrency deposit flows (network selection, address display)
- **withdraw/** - Withdrawal and transaction flows (amount entry, confirmation, success)
- Root level screens: authorize-transaction, details, login-passcode

### `/components` - UI Component Library
Organized by atomic design principles:
- **atoms/** - Basic building blocks (Button, Card, Icon, InputField, Modal, Badge, ProgressBar, etc.)
- **molecules/** - Composite components (AmountInput, BalanceCard, BasketCard, TransactionItem, PasscodeInput, Header, SearchBar, etc.)
- **organisms/** - Complex feature components (FinancialDashboard, BattlePass, NavigationBar, UserProfile, SpendableBalance)
- **navigation/** - Navigation-specific components (GlassTabBar)
- **ui/** - Reusable UI primitives (Button, Input, OTPInput, PhoneInput)
- **basket/**, **deposit/**, **withdraw/** - Feature-specific component groups

### `/api` - Backend Integration Layer
Centralized API communication structure:
- **services/** - API service modules (auth, user, wallet, portfolio, onboarding, passcode)
- **hooks/** - React Query hooks for data fetching (useAuth, useUser, useWallet, usePortfolio, useOnboarding, usePasscode)
- **interceptors/** - Axios request/response interceptors (error handling)
- **types/** - TypeScript type definitions for API contracts (auth, wallet, portfolio, transfer, kyc, notification, etc.)
- **client.ts** - Axios client configuration
- **config.ts** - API configuration and endpoints
- **queryClient.ts** - React Query client setup

### `/stores` - State Management (Zustand)
Global application state:
- **base/** - Store creation utilities and base patterns
- **authStore.ts** - Authentication state (user session, tokens, login/logout)
- **walletStore.ts** - Wallet state (balances, addresses, transactions)
- **withdrawalStore.ts** - Withdrawal flow state
- **uiStore.ts** - UI state (modals, loading states, notifications)

### `/utils` - Utility Functions
Shared helper functions and utilities:
- **sessionManager.ts** - Session lifecycle management
- **secureStorage.ts** - Secure storage wrapper (Expo SecureStore)
- **encryption.ts** - Encryption/decryption utilities
- **validators.ts** - Input validation functions
- **sanitizeInput.ts** - Input sanitization
- **logSanitizer.ts** - Log sanitization for sensitive data
- **errorLogger.ts** - Error logging and reporting
- **appVersion.ts** - App version management
- **chains.ts** - Blockchain network configurations
- **routeHelpers.ts** - Navigation helper functions

### `/lib` - Business Logic Layer
Domain-specific business logic:
- **domain/** - Domain models and logic (auth, portfolio, wallet)
- **errors/** - Custom error classes (AppError)
- **constants/** - Application constants and messages
- **sentry.ts** - Sentry error tracking configuration

### `/types` - TypeScript Type Definitions
Global type definitions:
- **routing.types.ts** - Navigation and routing types
- **index.ts** - Exported type aggregation
- Module declaration files for third-party libraries (crypto-js, d3-scale, png, svg)

### `/hooks` - Custom React Hooks
Application-specific hooks:
- **domain/** - Domain-specific hooks (useWithdrawal)
- **useFonts.ts** - Font loading hook
- **useProtectedRoute.ts** - Route protection hook
- **withFonts.tsx** - HOC for font loading

### `/assets` - Static Assets
- **fonts/** - Custom font files (Poppins, PramukhRounded)
- **Icons/** - SVG icon library
- **images/** - PNG/JPG images and onboarding videos
- **svg/** - Cryptocurrency and blockchain logos
- **illustration/** - Illustration assets
- **app-icon/** - App icons for iOS (light, dark, tinted, splash)

### `/constants` - Application Constants
- **depositOptions.ts** - Deposit configuration options
- **fonts.ts** - Font family constants

### `/design` - Design System
- **tokens.ts** - Design tokens (colors, spacing, typography)

### `/docs` - Documentation
- **prd.md** - Product Requirements Document
- **architecture.md** - Architecture documentation
- **epics.md** - Feature epics and roadmap
- **CONTRIBUTING.md** - Contribution guidelines
- **IMPROVEMENTS.md** - Improvement tracking
- **story/** - User stories and feature specifications
- **open_api.yaml** - API specification

### `/__tests__` - Test Suite
- **api/** - API client tests
- **components/** - Component tests
- **stores/** - Store tests
- **utils/** - Utility function tests

### `/__mocks__` - Test Mocks
- Mock implementations for testing (wallet mocks, etc.)

### Platform-Specific Directories
- **/android/** - Android native configuration and build files
- **/ios/** - iOS native configuration, Xcode project, Podfile

## Core Component Relationships

### Authentication Flow
1. User enters credentials → **authStore** manages state
2. API call via **api/services/auth.service.ts** → **api/hooks/useAuth.ts**
3. Session stored via **utils/sessionManager.ts** → **utils/secureStorage.ts**
4. Protected routes enforced by **hooks/useProtectedRoute.ts**

### Investment Flow
1. User views portfolio → **api/hooks/usePortfolio.ts** fetches data
2. Portfolio state managed in **stores/walletStore.ts**
3. UI rendered via **components/organisms/FinancialDashboard.tsx**
4. Transactions processed through **api/services/portfolio.service.ts**

### Wallet Operations
1. Wallet data fetched via **api/hooks/useWallet.ts**
2. State managed in **stores/walletStore.ts**
3. Blockchain interactions configured in **utils/chains.ts**
4. Secure operations use **utils/encryption.ts** and **utils/secureStorage.ts**

### Navigation Architecture
1. File-based routing via Expo Router in **/app**
2. Tab navigation rendered by **components/navigation/GlassTabBar.tsx**
3. Route helpers in **utils/routeHelpers.ts**
4. Type-safe navigation with **types/routing.types.ts**

## Architectural Patterns

### State Management Pattern
- **Zustand** for global state with modular stores
- **React Query** for server state and caching
- Local component state for UI-only concerns

### API Integration Pattern
- Service layer abstracts API calls
- Custom hooks provide React integration
- Interceptors handle cross-cutting concerns (auth, errors)
- Type-safe contracts via TypeScript interfaces

### Component Architecture
- Atomic design principles (atoms → molecules → organisms)
- Feature-based grouping for complex flows
- Shared UI primitives in `/components/ui`
- Reusable business logic in custom hooks

### Security Architecture
- Sensitive data encrypted via **utils/encryption.ts**
- Secure storage via Expo SecureStore wrapper
- Input sanitization and validation throughout
- Log sanitization prevents sensitive data leakage
- Sentry integration for error tracking

### Error Handling Pattern
- Custom AppError class for typed errors
- Centralized error interceptor
- Error logging via **utils/errorLogger.ts**
- User-friendly error messages via **lib/constants/messages.ts**

## Technology Integration Points

### Circle Integration
- Developer-Controlled Wallets for custody
- USDC on/off-ramp orchestration
- Managed via **api/services/wallet.service.ts**

### DriveWealth Integration
- Brokerage account management
- Trade execution for stocks/ETFs/options
- Portfolio data synchronization
- Managed via **api/services/portfolio.service.ts**

### Expo Ecosystem
- **expo-router** - File-based navigation
- **expo-secure-store** - Secure credential storage
- **expo-local-authentication** - Biometric authentication
- **expo-notifications** - Push notifications
- **expo-video** - Onboarding videos
- **expo-blur** - UI effects

### React Native Libraries
- **react-native-reanimated** - Smooth animations
- **react-native-gesture-handler** - Touch interactions
- **react-native-svg** - Vector graphics
- **react-native-gifted-charts** - Portfolio charts
- **@shopify/react-native-skia** - Advanced graphics
