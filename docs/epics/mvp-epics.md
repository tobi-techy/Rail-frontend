# Rail Mobile App — Frontend MVP Epics

## Document Information

- **Version**: 2.0
- **Last Updated**: December 17, 2025
- **Status**: Active
- **Platform**: React Native (Expo SDK 54)

---

## Overview

This document outlines the frontend MVP epics for Rail — an automated wealth system where money begins working the moment it arrives. Each epic maps to screens, components, and user interactions required for launch.

**Core System Rule**: Every deposit is automatically split 70% Spend / 30% Invest.

**Tech Stack**: Expo Router, Zustand, TanStack Query, NativeWind, Zod

---

## Epic 1: Onboarding & Authentication

**Goal**: Get users from app launch to funded account in under 2 minutes with zero friction.

### Screens

| Screen           | Route                             | Description                      |
| ---------------- | --------------------------------- | -------------------------------- |
| Welcome          | `app/intro.tsx`                   | App intro with Apple Sign-In CTA |
| Sign In          | `app/(auth)/signin.tsx`           | Email/phone fallback auth        |
| Verify Email     | `app/(auth)/verify-email.tsx`     | OTP verification                 |
| Create Passcode  | `app/(auth)/create-passcode.tsx`  | 6-digit passcode setup           |
| Confirm Passcode | `app/(auth)/confirm-passcode.tsx` | Passcode confirmation            |
| Complete Profile | `app/(auth)/complete-profile/`    | Name, DOB collection             |
| KYC Flow         | `app/(auth)/onboarding/`          | Identity verification            |

### Components Required

| Component            | Location                | Purpose                      |
| -------------------- | ----------------------- | ---------------------------- |
| `SocialLoginButtons` | `components/atoms/`     | Apple/Google sign-in buttons |
| `PasscodeInput`      | `components/molecules/` | 6-digit passcode entry       |
| `OTPInput`           | `components/ui/`        | Email/phone verification     |
| `PhoneInput`         | `components/ui/`        | International phone entry    |

### User Stories

**US-1.1**: As a new user, I can sign up using Apple Sign-In so that I can start quickly without creating new credentials.

**US-1.2**: As a new user, I can complete identity verification in-app so that I can access all features.

**US-1.3**: As a new user, I see no finance or investing explanations during onboarding so that the experience feels simple.

### Acceptance Criteria

- [ ] Apple Sign-In completes in < 3 taps
- [ ] Passcode setup uses haptic feedback
- [ ] KYC status gates navigation to main app
- [ ] No financial jargon in onboarding copy
- [ ] Biometric auth prompt after passcode setup
- [ ] Error states show clear recovery actions

### API Integration

```typescript
// api/hooks/useAuth.ts
useAppleSignIn();
useEmailSignIn();
useVerifyOTP();

// api/hooks/useOnboarding.ts
useSubmitKYC();
useKYCStatus();

// api/hooks/usePasscode.ts
useCreatePasscode();
useVerifyPasscode();
```

---

## Epic 2: Station (Home Screen)

**Goal**: Answer "Is my money working?" with a single glance.

### Screens

| Screen  | Route                  | Description      |
| ------- | ---------------------- | ---------------- |
| Station | `app/(tabs)/index.tsx` | Main home screen |

### Components Required

| Component          | Location                | Purpose                            |
| ------------------ | ----------------------- | ---------------------------------- |
| `BalanceCard`      | `components/molecules/` | Total balance display              |
| `SpendInvestSplit` | `components/molecules/` | 70/30 visual split                 |
| `SystemStatus`     | `components/atoms/`     | Allocating/Active/Paused indicator |
| `QuickActions`     | `components/molecules/` | Load money, Send CTAs              |
| `RecentActivity`   | `components/organisms/` | Last 3 transactions                |

### User Stories

**US-2.1**: As a user, I can see my total balance prominently so that I know my overall position.

**US-2.2**: As a user, I can see my Spend and Invest balances so that I understand the split.

**US-2.3**: As a user, I can see the system status so that I know if my money is working.

### Acceptance Criteria

- [ ] Total balance displayed in large, bold typography
- [ ] Spend/Invest split shown as visual ratio (not pie chart)
- [ ] System status: `Allocating` | `Active` | `Paused`
- [ ] NO charts, asset breakdowns, or performance history
- [ ] Pull-to-refresh updates balances
- [ ] Balance updates via WebSocket or polling (< 5s delay)

### State Management

```typescript
// stores/accountStore.ts
interface AccountState {
  totalBalance: number;
  spendBalance: number;
  investBalance: number;
  systemStatus: 'allocating' | 'active' | 'paused';
  isLoading: boolean;
}
```

### API Integration

```typescript
// api/hooks/useAccount.ts
useAccountSummary();
useBalances();
useSystemStatus();
```

---

## Epic 3: Funding & Deposits

**Goal**: Enable users to load money and see the automatic 70/30 split within 60 seconds.

### Screens

| Screen          | Route                     | Description                     |
| --------------- | ------------------------- | ------------------------------- |
| Deposit Options | `app/deposit/index.tsx`   | Choose funding method           |
| Select Network  | `app/deposit/network.tsx` | Crypto chain selection          |
| Deposit Address | `app/deposit/address.tsx` | QR code + address display       |
| Deposit Success | `app/deposit/success.tsx` | Confirmation with split preview |

### Components Required

| Component           | Location                | Purpose                           |
| ------------------- | ----------------------- | --------------------------------- |
| `DepositMethodCard` | `components/molecules/` | Bank/Crypto option cards          |
| `NetworkSelector`   | `components/molecules/` | ETH/Polygon/BSC/Solana picker     |
| `QRCodeDisplay`     | `components/atoms/`     | Scannable deposit address         |
| `AddressCopyButton` | `components/atoms/`     | One-tap address copy              |
| `SplitPreview`      | `components/molecules/` | Shows 70/30 before deposit        |
| `DepositPending`    | `components/molecules/` | Loading state during confirmation |

### User Stories

**US-3.1**: As a user, I can load money via bank transfer to my virtual account so that I can fund with fiat.

**US-3.2**: As a user, I can deposit USDC from multiple chains so that I can fund with crypto.

**US-3.3**: As a user, I see a preview of the 70/30 split before depositing so that I understand how Rail works.

**US-3.4**: As a user, I receive confirmation when my deposit is processed so that I know my money arrived.

### Acceptance Criteria

- [ ] Virtual accounts display USD and GBP options
- [ ] USDC networks: Ethereum, Polygon, BSC, Solana
- [ ] QR code scannable with standard wallet apps
- [ ] Address copy shows success toast
- [ ] Split preview: "70% → Spend, 30% → Invest"
- [ ] Language uses "Load money" not "Deposit"
- [ ] Push notification on deposit confirmation
- [ ] Deposit history accessible from Station

### API Integration

```typescript
// api/hooks/useDeposit.ts
useVirtualAccounts()
useDepositAddress(chain: string)
useDepositHistory()

// api/hooks/useWebhooks.ts
useDepositNotifications() // WebSocket subscription
```

---

## Epic 4: Spend Balance & Transactions

**Goal**: Provide a real-time, accurate spend balance that feels like a checking account replacement.

### Screens

| Screen             | Route                         | Description              |
| ------------------ | ----------------------------- | ------------------------ |
| Transactions       | `app/(tabs)/transactions.tsx` | Full transaction history |
| Transaction Detail | `app/transaction/[id].tsx`    | Single transaction view  |

### Components Required

| Component           | Location                | Purpose                          |
| ------------------- | ----------------------- | -------------------------------- |
| `TransactionItem`   | `components/molecules/` | Single transaction row           |
| `TransactionList`   | `components/molecules/` | Virtualized transaction list     |
| `FilterChips`       | `components/molecules/` | All/Spend/Invest/Deposits filter |
| `TransactionDetail` | `components/organisms/` | Full transaction info            |
| `EmptyTransactions` | `components/atoms/`     | Empty state illustration         |

### User Stories

**US-4.1**: As a user, I can see my current spend balance so that I know how much I can spend.

**US-4.2**: As a user, my balance updates in real-time after transactions so that I always have accurate information.

**US-4.3**: As a user, I can view my transaction history so that I can track my spending.

### Acceptance Criteria

- [ ] Balance updates within 1 second of transaction
- [ ] Transaction list uses FlashList for performance
- [ ] Filter by: All, Spend, Invest, Deposits
- [ ] Pull-to-refresh loads new transactions
- [ ] Infinite scroll pagination
- [ ] No budgeting tools, spend limits, or categories

### State Management

```typescript
// stores/transactionStore.ts
interface TransactionState {
  transactions: Transaction[];
  filter: 'all' | 'spend' | 'invest' | 'deposits';
  hasMore: boolean;
  isLoading: boolean;
}
```

---

## Epic 5: Virtual Debit Card

**Goal**: Provide a virtual debit card linked to Spend Balance, usable immediately after funding.

### Screens

| Screen        | Route                   | Description                   |
| ------------- | ----------------------- | ----------------------------- |
| Card          | `app/(tabs)/card.tsx`   | Card display and management   |
| Card Details  | `app/card/details.tsx`  | Full card number, CVV reveal  |
| Card Settings | `app/card/settings.tsx` | Freeze, limits, notifications |

### Components Required

| Component            | Location                | Purpose                        |
| -------------------- | ----------------------- | ------------------------------ |
| `VirtualCardDisplay` | `components/molecules/` | Card visual with masked number |
| `CardReveal`         | `components/molecules/` | Secure card details reveal     |
| `CardActions`        | `components/molecules/` | Freeze, Copy, Add to Wallet    |
| `SpendableBalance`   | `components/organisms/` | Balance linked to card         |
| `CardTransactions`   | `components/organisms/` | Card-specific transactions     |

### User Stories

**US-5.1**: As a user, I receive a virtual debit card so that I can start spending immediately.

**US-5.2**: As a user, my card transactions deduct from my Spend Balance so that spending is seamless.

**US-5.3**: As a user, I can add my card to Apple Wallet so that I can pay with my phone.

### Acceptance Criteria

- [ ] Virtual card displayed after first funding
- [ ] Card number masked by default (•••• •••• •••• 1234)
- [ ] Reveal requires passcode/biometric
- [ ] Freeze/unfreeze with single tap
- [ ] Add to Apple Wallet integration
- [ ] Card transactions show merchant name and logo

### API Integration

```typescript
// api/hooks/useCard.ts
useVirtualCard();
useCardDetails(); // Requires auth
useFreezeCard();
useCardTransactions();
```

---

## Epic 6: Round-Ups Automation

**Goal**: Enable optional round-ups that route spare change to the Invest Engine.

### Screens

| Screen    | Route                        | Description      |
| --------- | ---------------------------- | ---------------- |
| Round-Ups | `app/settings/round-ups.tsx` | Toggle and stats |

### Components Required

| Component             | Location                | Purpose                      |
| --------------------- | ----------------------- | ---------------------------- |
| `RoundUpToggle`       | `components/molecules/` | ON/OFF switch with animation |
| `RoundUpStats`        | `components/molecules/` | Total rounded up this month  |
| `RoundUpExplainer`    | `components/atoms/`     | One-line explanation         |
| `RoundUpAccumulation` | `components/organisms/` | Visual accumulation display  |

### User Stories

**US-6.1**: As a user, I can enable round-ups so that my spare change automatically invests.

**US-6.2**: As a user, I can toggle round-ups ON/OFF so that I have simple control.

**US-6.3**: As a user, I can see how much I've rounded up so that I feel progress.

### Acceptance Criteria

- [ ] Simple ON/OFF toggle only
- [ ] No configuration granularity (no custom amounts)
- [ ] Shows total rounded up this month
- [ ] Animation when round-up occurs
- [ ] Round-up amount = next dollar - transaction amount

### State Management

```typescript
// stores/settingsStore.ts
interface SettingsState {
  roundUpsEnabled: boolean;
  roundUpTotal: number;
  toggleRoundUps: () => void;
}
```

---

## Epic 7: Invest Balance (Minimal)

**Goal**: Show invest balance without exposing individual assets or trades.

### Screens

| Screen | Route                   | Description             |
| ------ | ----------------------- | ----------------------- |
| Invest | `app/(tabs)/invest.tsx` | Invest balance overview |

### Components Required

| Component             | Location                | Purpose                           |
| --------------------- | ----------------------- | --------------------------------- |
| `InvestBalance`       | `components/molecules/` | Large balance display             |
| `InvestStatus`        | `components/atoms/`     | "Your money is working"           |
| `AllocationIndicator` | `components/atoms/`     | Simple progress during allocation |

### User Stories

**US-7.1**: As a user, I can see my invest balance so that I know how much is growing.

**US-7.2**: As a user, I don't see individual trades or assets so that investing feels invisible.

### Acceptance Criteria

- [ ] Shows invest balance only
- [ ] NO asset breakdown
- [ ] NO trade history
- [ ] NO performance charts
- [ ] Status message: "Your money is working"
- [ ] During allocation: "Allocating..." with subtle animation

### API Integration

```typescript
// api/hooks/useInvest.ts
useInvestBalance();
useInvestStatus();
```

---

## Epic 8: Profile & Settings

**Goal**: Provide essential account management without overwhelming options.

### Screens

| Screen        | Route                            | Description          |
| ------------- | -------------------------------- | -------------------- |
| Profile       | `app/(tabs)/profile.tsx`         | Account overview     |
| Personal Info | `app/settings/personal.tsx`      | Name, email, phone   |
| Security      | `app/settings/security.tsx`      | Passcode, biometrics |
| Notifications | `app/settings/notifications.tsx` | Push preferences     |
| Support       | `app/settings/support.tsx`       | Help and contact     |

### Components Required

| Component         | Location                | Purpose               |
| ----------------- | ----------------------- | --------------------- |
| `UserProfile`     | `components/organisms/` | Avatar, name, email   |
| `SettingsItem`    | `components/molecules/` | Tappable settings row |
| `SettingsSection` | `components/molecules/` | Grouped settings      |
| `LogoutButton`    | `components/atoms/`     | Sign out action       |

### User Stories

**US-8.1**: As a user, I can view and edit my profile so that my information is accurate.

**US-8.2**: As a user, I can manage security settings so that my account is protected.

**US-8.3**: As a user, I can sign out so that I can secure my device.

### Acceptance Criteria

- [ ] Profile shows name, email, phone
- [ ] Change passcode requires current passcode
- [ ] Biometric toggle (Face ID / Touch ID)
- [ ] Push notification preferences
- [ ] Sign out clears local state and tokens
- [ ] Delete account option (with confirmation)

---

## Epic 9: Withdrawals & Transfers

**Goal**: Allow users to withdraw from Spend Balance to external accounts.

### Screens

| Screen   | Route                      | Description             |
| -------- | -------------------------- | ----------------------- |
| Withdraw | `app/withdraw/index.tsx`   | Withdrawal options      |
| Amount   | `app/withdraw/amount.tsx`  | Enter withdrawal amount |
| Confirm  | `app/withdraw/confirm.tsx` | Review and confirm      |
| Success  | `app/withdraw/success.tsx` | Confirmation screen     |

### Components Required

| Component                 | Location                | Purpose                 |
| ------------------------- | ----------------------- | ----------------------- |
| `AmountInput`             | `components/molecules/` | Currency amount entry   |
| `SendAmountKeypad`        | `components/withdraw/`  | Custom numeric keypad   |
| `ConfirmTransactionModal` | `components/withdraw/`  | Final confirmation      |
| `TransactionSuccessView`  | `components/withdraw/`  | Success animation       |
| `WithdrawMethodCard`      | `components/molecules/` | Bank/Crypto destination |

### User Stories

**US-9.1**: As a user, I can withdraw to my bank account so that I can access my money.

**US-9.2**: As a user, I can withdraw to a crypto wallet so that I have flexibility.

**US-9.3**: As a user, I see clear confirmation before withdrawing so that I don't make mistakes.

### Acceptance Criteria

- [ ] Withdraw from Spend Balance only
- [ ] Bank transfer and crypto withdrawal options
- [ ] Amount validation against available balance
- [ ] Confirmation screen with all details
- [ ] Passcode/biometric required to confirm
- [ ] Success screen with transaction ID

---

## Epic 10: Passcode & Session Security

**Goal**: Protect sensitive actions with passcode and manage session state.

### Screens

| Screen                | Route                           | Description               |
| --------------------- | ------------------------------- | ------------------------- |
| Login Passcode        | `app/login-passcode.tsx`        | Re-auth on app resume     |
| Authorize Transaction | `app/authorize-transaction.tsx` | Confirm sensitive actions |

### Components Required

| Component         | Location                | Purpose                    |
| ----------------- | ----------------------- | -------------------------- |
| `PasscodeInput`   | `components/molecules/` | 6-digit entry with dots    |
| `Keypad`          | `components/molecules/` | Numeric keypad             |
| `BiometricPrompt` | `components/atoms/`     | Face ID / Touch ID trigger |

### User Stories

**US-10.1**: As a user, I must enter my passcode when reopening the app so that my account is secure.

**US-10.2**: As a user, I can use Face ID instead of passcode so that access is faster.

**US-10.3**: As a user, sensitive actions require re-authentication so that I'm protected.

### Acceptance Criteria

- [ ] Passcode required after 5 minutes of inactivity
- [ ] Biometric auth as alternative to passcode
- [ ] 3 failed attempts triggers cooldown
- [ ] Sensitive actions: withdrawals, card reveal, settings changes
- [ ] Session timeout configurable in settings

### State Management

```typescript
// stores/authStore.ts
interface AuthState {
  isAuthenticated: boolean;
  lastActiveAt: number;
  requiresPasscode: boolean;
  biometricsEnabled: boolean;
}
```

---

## Epic 11: Error Handling & Edge Cases

**Goal**: Handle errors gracefully without breaking user trust.

### Components Required

| Component         | Location            | Purpose               |
| ----------------- | ------------------- | --------------------- |
| `ErrorBoundary`   | `components/`       | Catch React errors    |
| `NetworkError`    | `components/atoms/` | Offline state         |
| `RetryButton`     | `components/atoms/` | Retry failed actions  |
| `EmptyState`      | `components/atoms/` | No data illustrations |
| `LoadingSkeleton` | `components/atoms/` | Content placeholders  |

### Scenarios

| Scenario        | Handling                          |
| --------------- | --------------------------------- |
| Network offline | Show cached data + offline banner |
| API error       | Toast with retry option           |
| Session expired | Redirect to passcode screen       |
| KYC pending     | Gate features with status message |
| Deposit pending | Show pending state with ETA       |

### Acceptance Criteria

- [ ] Offline mode shows cached balances
- [ ] API errors show user-friendly messages
- [ ] Retry buttons on all failed requests
- [ ] Loading skeletons match content layout
- [ ] Error logging to Sentry

---

## Epic 12: Performance & Polish

**Goal**: Ensure the app feels fast, smooth, and premium.

### Requirements

| Metric             | Target      |
| ------------------ | ----------- |
| App launch (cold)  | < 2 seconds |
| Screen transitions | < 300ms     |
| Balance refresh    | < 1 second  |
| List scroll        | 60 FPS      |
| Memory usage       | < 150MB     |

### Optimizations

- [ ] Preload critical screens
- [ ] Memoize expensive components
- [ ] Use FlashList for long lists
- [ ] Optimize images with expo-image
- [ ] Lazy load non-critical screens
- [ ] Minimize re-renders with Zustand selectors

### Accessibility

- [ ] VoiceOver / TalkBack support
- [ ] Dynamic type scaling
- [ ] Minimum touch targets (44x44)
- [ ] Color contrast ratios (WCAG AA)
- [ ] Reduce motion option

---

## Priority Legend

| Priority | Meaning                                           |
| -------- | ------------------------------------------------- |
| P0       | Must ship for MVP — product is invalid without it |
| P1       | Important for retention — ship shortly after MVP  |
| P2       | Future expansion — explicitly out of scope        |

### Epic Priorities

| Epic                  | Priority |
| --------------------- | -------- |
| 1. Onboarding & Auth  | P0       |
| 2. Station (Home)     | P0       |
| 3. Funding & Deposits | P0       |
| 4. Spend Balance      | P0       |
| 5. Virtual Card       | P0       |
| 6. Round-Ups          | P0       |
| 7. Invest Balance     | P0       |
| 8. Profile & Settings | P0       |
| 9. Withdrawals        | P0       |
| 10. Passcode Security | P0       |
| 11. Error Handling    | P0       |
| 12. Performance       | P0       |

---

## Navigation Structure

```
app/
├── (auth)/                    # Unauthenticated routes
│   ├── index.tsx              # Welcome screen
│   ├── signin.tsx             # Email/phone sign in
│   ├── verify-email.tsx       # OTP verification
│   ├── create-passcode.tsx    # Passcode setup
│   ├── confirm-passcode.tsx   # Passcode confirm
│   ├── complete-profile/      # Profile completion
│   └── onboarding/            # KYC flow
│
├── (tabs)/                    # Main tab navigation
│   ├── index.tsx              # Station (Home)
│   ├── card.tsx               # Virtual Card
│   ├── invest.tsx             # Invest Balance
│   └── profile.tsx            # Profile & Settings
│
├── deposit/                   # Funding flow
│   ├── index.tsx              # Deposit options
│   ├── network.tsx            # Chain selection
│   └── address.tsx            # QR + address
│
├── withdraw/                  # Withdrawal flow
│   ├── index.tsx              # Withdraw options
│   └── success.tsx            # Confirmation
│
├── login-passcode.tsx         # Re-auth screen
├── authorize-transaction.tsx  # Sensitive action auth
└── _layout.tsx                # Root layout
```

---

## Success Metrics

### Primary (MVP Validation)

- % of users completing onboarding
- % of users funding within first session
- Time from signup to first funding
- % of users with round-ups enabled

### Secondary

- Daily active users
- Repeat deposits per user
- Card transaction frequency
- App crash rate (target: < 0.5%)

---

## Definition of Done

MVP is complete when:

1. User can sign up, load money, spend, and see auto-invest in one session
2. 70/30 split happens without configuration
3. Spending feels normal, investing feels invisible
4. User does not feel responsible for investment decisions
5. App launches in < 2 seconds
6. Crash-free sessions > 99.5%
