# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Rail Money is a React Native mobile fintech app built with Expo SDK 54, targeting iOS and Android. It provides finance management features including wallet management, withdrawals, deposits, investment stashes, KYC verification, and market data. The backend API base is configured via `EXPO_PUBLIC_API_URL`.

## Build & Development Commands

```bash
# Install dependencies (uses Bun)
bun install

# Start Expo dev server (requires dev client build)
bun start

# Run on simulators
bun ios
bun android

# Type checking
bun run typecheck

# Lint (ESLint + Prettier)
bun run lint

# Auto-fix lint/format issues
bun run format

# Run all checks (typecheck + lint + test)
bun run validate

# Clean caches and reinstall
bun run clean
```

## Testing

Tests use Jest with the `jest-expo` preset and `@testing-library/react-native`. Test files live in `__tests__/` and must match the pattern `__tests__/**/*.test.{ts,tsx}`.

```bash
bun test                        # Run all tests
bun test -- --testPathPattern=stores  # Run tests matching a path
bun test:watch                  # Watch mode
bun test:coverage               # Coverage report
```

Coverage thresholds are set at 50% for branches, functions, lines, and statements. Mocks for AsyncStorage, SecureStore, and expo-router are configured in `jest.setup.js`. Additional mock data is in `__mocks__/`.

## EAS Build Profiles

```bash
eas build --platform ios --profile development   # Dev client
eas build --platform ios --profile preview       # Internal distribution
eas build --platform ios --profile testflight    # TestFlight/staging
eas build --platform ios --profile production    # Production release
```

The `testflight` and `production` profiles set `EXPO_PUBLIC_API_URL` to `https://api.userail.money/api`. Helper scripts in `scripts/` handle Android keystore generation and release APK builds.

## Architecture

### Routing (Expo Router — file-based)

All screens live in `app/`. Route groups:

- `app/(auth)/` — Auth flow: signin, signup, email verification, passcode creation, forgot/reset password, profile completion
- `app/(tabs)/` — Main tabs: Home (`index`), History, Settings (Market tab exists but is commented out)
- `app/kyc/`, `app/withdraw/`, `app/spending-stash/`, `app/investment-stash/`, `app/market-asset/` — Feature-specific screen groups

`app/_layout.tsx` is the root layout. It initializes Sentry, validates env vars, sets up providers (QueryClientProvider, PostHogProvider, SafeAreaProvider, KeyboardProvider, GestureHandlerRootView), manages the custom splash screen lifecycle, and handles session initialization.

### API Layer (`api/`)

Three-tier pattern: **Services → Hooks → Components**.

- `api/services/` — Domain-specific service objects (e.g. `authService`, `walletService`, `kycService`). Each defines endpoint constants and thin async methods calling `apiClient`.
- `api/hooks/` — React Query hooks wrapping services (e.g. `useAuth`, `useWallet`, `useKYC`). Components should use hooks, not call services directly.
- `api/client.ts` — Axios instance with request interceptor (auth token, CSRF token, request ID, passcode session header) and response interceptor (automatic token refresh with atomic promise deduplication, 429 retry, error transformation). SSL certificate pinning is enabled in production via `sslPinningAdapter`.
- `api/queryClient.ts` — React Query client config and `queryKeys` factory. Always use `queryKeys` for cache key consistency. Use `invalidateQueries` helpers for cache invalidation.
- `api/types/` — Shared TypeScript interfaces for all API request/response shapes.

### State Management (`stores/`)

Zustand stores with `persist` middleware. Sensitive tokens (accessToken, refreshToken, passcodeSessionToken) are stored in Expo SecureStore via a custom storage adapter; non-sensitive state goes to AsyncStorage.

Key stores:

- `authStore` — Authentication state, session management, login/logout, passcode, biometric settings. This is the most complex store with lockout logic and secure token storage.
- `walletStore` — Token balances and transaction data
- `withdrawalStore` — Multi-step withdrawal flow state (transient, not persisted)
- `uiStore` — UI state including currency rate refresh
- `kycStore` — KYC verification flow state

Import stores from `@/stores` (the barrel export), not individual files.

### Components (`components/`)

Atomic design hierarchy:

- `atoms/` — Primitive UI building blocks
- `molecules/` — Composite components (e.g. BalanceCard, TransactionItem)
- `organisms/` — Complex feature-level components
- `ui/` — Core design-system primitives (Button, Input, OTPInput, FeedbackPopupHost)
- Feature folders: `cards/`, `market/`, `sheets/`, `withdraw/`, `templates/`

### Styling

NativeWind (TailwindCSS for React Native). Config in `tailwind.config.js` defines the design system: brand colors (primary `#FF2E01`, success `#00C853`), custom font families (SF Pro Rounded variants), semantic spacing tokens, and responsive font sizes. A dark mode palette is defined but not yet wired to screens.

### Utilities (`utils/`)

Notable utilities:

- `analytics.ts` — PostHog analytics wrapper with `ANALYTICS_EVENTS` constants and `useAnalytics` hook
- `secureStorage.ts` — Expo SecureStore wrapper
- `sessionManager.ts` — Session lifecycle (init, health checks, expiry)
- `encryption.ts` — Crypto-JS encryption/decryption
- `deviceSecurity.ts` — Jailbreak/root detection
- `inputValidator.ts`, `sanitizeInput.ts` — Input validation and sanitization
- `logSanitizer.ts` — Strips sensitive data from logs
- `csrfToken.ts` — CSRF token management

### Domain Logic (`lib/`)

- `lib/domain/` — Domain models (auth, wallet)
- `lib/errors/AppError.ts` — Custom error class hierarchy
- `lib/logger.ts` — Structured logging
- `lib/sentry.ts` — Sentry initialization
- `lib/constants/messages.ts` — User-facing message strings

## Code Conventions

- **TypeScript strict mode** with `@/*` path alias (maps to project root)
- **Interfaces over types** for object shapes; avoid enums, use maps
- **Named exports** preferred; import from barrel files (`@/stores`, `@/api/hooks`, `@/api/services`)
- **Naming**: PascalCase for components/interfaces, camelCase for variables/functions, SCREAMING_SNAKE_CASE for constants. Booleans use auxiliary verbs (`isLoading`, `hasPasscode`)
- **Error handling**: try-catch with `safeError()` for logging, user-friendly message extraction, loading state cleanup
- **API errors** follow `TransformedApiError` shape with `code`, `message`, `status`, `requestId`, and optional `details`
- **Console usage**: `no-console` rule warns; use `console.warn` and `console.error` only. Use `logger` from `lib/logger.ts` for structured logging.

## Environment Variables

All client-exposed env vars must be prefixed with `EXPO_PUBLIC_`. Key variables:

- `EXPO_PUBLIC_API_URL` — Backend API base URL
- `EXPO_PUBLIC_SENTRY_DSN` — Sentry DSN
- `EXPO_PUBLIC_POSTHOG_API_KEY` — PostHog analytics key
- `EXPO_PUBLIC_GLEAP_TOKEN` — Gleap in-app feedback SDK key
- `EXPO_PUBLIC_ENCRYPTION_KEY` — Client-side encryption key
- `EXPO_PUBLIC_CERT_PIN_1`, `EXPO_PUBLIC_CERT_PIN_2` — SSL certificate pins (required in production)

Copy `.env.example` to `.env` for local development. Environment validation runs at app startup via `utils/envValidator.ts`.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to `main` and `develop`: installs with `bun install --frozen-lockfile`, then runs typecheck → lint → test (with coverage upload to Codecov).
