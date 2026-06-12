# PostHog Analytics Implementation Guide

This guide explains how to track user events in the Rail Money app using PostHog.

## Overview

- **Utility**: `utils/analytics.ts` - Centralized analytics hook and constants
- **Provider**: `app/_layout.tsx` - PostHog provider wraps the entire app
- **Configuration**: US region, session replay enabled, text/image masking for privacy

## Quick Start

### 1. Track an Event

```typescript
import { useAnalytics, ANALYTICS_EVENTS } from '@/utils/analytics';

function MyComponent() {
  const { track } = useAnalytics();

  const handleButtonPress = () => {
    track(ANALYTICS_EVENTS.BUTTON_PRESSED, {
      button_name: 'deposit_now',
      screen: 'home',
    });
  };

  return <Button onPress={handleButtonPress} />;
}
```

### 2. Identify User

```typescript
const { identify } = useAnalytics();

// After successful login
identify(user.id, {
  email: user.email,
  first_name: user.firstName,
  account_status: user.status,
});
```

### 3. Track Screen Views

```typescript
const { trackScreen } = useAnalytics();

useEffect(() => {
  trackScreen('home', {
    user_tier: userTier,
    has_balance: balance > 0,
  });
}, []);
```

## Available Events

### Authentication

- `SIGN_UP_STARTED` - User initiates signup
- `SIGN_UP_COMPLETED` - User completes signup
- `SIGN_IN_STARTED` - User initiates login
- `SIGN_IN_COMPLETED` - User completes login
- `SIGN_OUT` - User logs out
- `PASSWORD_RESET_REQUESTED` - User requests password reset
- `BIOMETRIC_ENABLED` - User enables biometric auth
- `BIOMETRIC_DISABLED` - User disables biometric auth
- `PASSCODE_CREATED` - User creates a passcode

### Wallet & Balance

- `BALANCE_VIEWED` - User views balance
- `WALLET_SYNCED` - Wallet data synced from server
- `TRANSFER_INITIATED` - User starts a transfer
- `TRANSFER_COMPLETED` - Transfer succeeds
- `TRANSFER_FAILED` - Transfer fails

### Funding

- `DEPOSIT_INITIATED` - User starts deposit
- `DEPOSIT_COMPLETED` - Deposit completes
- `WITHDRAW_INITIATED` - User starts withdrawal
- `WITHDRAW_COMPLETED` - Withdrawal completes

### Allocation (Spending/Stash/Invest)

- `ALLOCATION_ENABLED` - User enables allocation mode
- `ALLOCATION_DISABLED` - User disables allocation mode
- `SPENDING_STASH_VIEWED` - User views spending stash
- `INVESTMENT_STASH_VIEWED` - User views investment stash

### KYC (Identity Verification)

- `KYC_VERIFICATION_STARTED` - User starts KYC process
- `KYC_VERIFICATION_COMPLETED` - KYC verification completes
- `KYC_VERIFICATION_FAILED` - KYC verification fails

### Navigation & Engagement

- `SCREEN_VIEWED` - User navigates to screen
- `BUTTON_PRESSED` - User presses a button
- `LINK_CLICKED` - User clicks a link
- `HELP_REQUESTED` - User requests help
- `SETTINGS_OPENED` - User opens settings
- `TRANSACTION_HISTORY_VIEWED` - User views transaction history

### Errors

- `ERROR_OCCURRED` - Generic error event
- `NETWORK_ERROR` - Network connectivity error

## Common Properties

### User Properties

- `user_id` - Unique user identifier
- `user_email` - User email address
- `account_status` - User account status (verified, pending, etc.)
- `account_age` - Days since account creation

### Transaction Properties

- `amount` - Transaction amount
- `currency` - Currency (USD, etc.)
- `transaction_type` - Type of transaction (send, receive, etc.)
- `transaction_id` - Unique transaction ID
- `error_code` - Error code if transaction failed
- `error_message` - Error message if transaction failed

### Navigation Properties

- `screen_name` - Name of screen viewed
- `previous_screen` - Previous screen name

### Feature Properties

- `feature_name` - Name of feature being used
- `feature_enabled` - Whether feature is enabled

## Examples

### Track Transfer Initiation

```typescript
const { track } = useAnalytics();

const handleTransferPress = () => {
  // User started transfer
  track(ANALYTICS_EVENTS.TRANSFER_INITIATED, {
    amount: '100.00',
    currency: 'USDC',
    network: 'ethereum',
  });
};
```

### Track KYC Flow

```typescript
const { track } = useAnalytics();

// User starts KYC
track(ANALYTICS_EVENTS.KYC_VERIFICATION_STARTED, {
  verification_type: 'identity',
});

// User completes KYC
track(ANALYTICS_EVENTS.KYC_VERIFICATION_COMPLETED, {
  verification_type: 'identity',
  duration_ms: endTime - startTime,
});
```

### Track Feature Adoption

```typescript
const { track, setUserProperties } = useAnalytics();

// Track that user enabled allocation
track(ANALYTICS_EVENTS.ALLOCATION_ENABLED, {
  allocation_type: 'spending_and_invest',
});

// Update user properties
setUserProperties({
  has_allocation_enabled: true,
  allocation_mode_activated_at: new Date().toISOString(),
});
```

### Track Error

```typescript
const { track } = useAnalytics();

try {
  await processTransfer(data);
} catch (error) {
  track(ANALYTICS_EVENTS.ERROR_OCCURRED, {
    component: 'TransferFlow',
    error_name: error.name,
    error_message: error.message,
    error_code: error.code,
  });
}
```

## Best Practices

### 1. Use Event Constants

Always use `ANALYTICS_EVENTS` constants instead of hardcoded strings:

```typescript
// ❌ Bad
track('user_signed_in', { ... });

// ✅ Good
track(ANALYTICS_EVENTS.SIGN_IN_COMPLETED, { ... });
```

### 2. Include Relevant Context

Include properties that help understand the event:

```typescript
// ❌ Bad
track(ANALYTICS_EVENTS.TRANSFER_COMPLETED);

// ✅ Good
track(ANALYTICS_EVENTS.TRANSFER_COMPLETED, {
  amount: '100.00',
  currency: 'USDC',
  network: 'ethereum',
  duration_ms: 2500,
});
```

### 3. Protect Privacy

Don't track sensitive data like full wallet addresses or passwords:

```typescript
// ❌ Bad
track(ANALYTICS_EVENTS.TRANSFER_COMPLETED, {
  recipient: '0x1234567890abcdef1234567890abcdef12345678',
});

// ✅ Good
track(ANALYTICS_EVENTS.TRANSFER_COMPLETED, {
  recipient: '0x1234...5678', // Masked
});
```

### 4. Identify Users

Always identify users after successful authentication:

```typescript
// After login
const { identify } = useAnalytics();
identify(user.id, {
  email: user.email,
  created_at: user.createdAt,
});
```

### 5. Handle Errors Gracefully

Analytics errors should never break the app:

```typescript
const { track } = useAnalytics();

// The track function already handles errors internally
// so you don't need try-catch around it
track(ANALYTICS_EVENTS.BUTTON_PRESSED); // Safe!
```

## Debugging

Enable development logging to see all tracked events:

```typescript
// In development, check your console for:
// [Analytics] Event tracked: event_name {...}
// [Analytics] Screen viewed: screen_name {...}
// [Analytics] User identified: user_id {...}
```

## Integration Checklist

- [x] Analytics utility created (`utils/analytics.ts`)
- [x] PostHog provider configured (`app/_layout.tsx`)
- [x] Authentication events tracked (`api/hooks/useAuth.ts`)
- [x] Transfer events tracked (`api/hooks/useWallet.ts`)
- [ ] KYC events tracked
- [ ] Screen view tracking added to main routes
- [ ] Feature adoption tracking (allocation, stash, etc.)
- [ ] Error event tracking enhanced
- [ ] Custom dashboards created in PostHog
- [ ] Conversion funnels defined
- [ ] Retention cohorts analyzed

## Resources

- [PostHog Documentation](https://posthog.com/docs)
- [React Native SDK Docs](https://posthog.com/docs/libraries/react-native)
- [Event Naming Best Practices](https://posthog.com/docs/product-analytics/events#conventions)
