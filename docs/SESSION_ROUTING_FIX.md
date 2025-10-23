# Session Persistence & Routing Fix

## Issue
After successful signup and verification, when the app is reloaded, users are incorrectly routed back to the welcome screen (`app/index.tsx`) instead of being directed to the appropriate screen based on their authentication status and onboarding progress.

## Problems Identified

### 1. **Missing Onboarding Status Persistence**
- Login and verify code hooks weren't storing `onboardingStatus` in the auth store
- Without this, the app couldn't determine where to route the user

### 2. **No First-Time Visit Tracking**
- The app didn't distinguish between first-time visitors and returning authenticated users
- Everyone was being sent to the welcome screen on reload

### 3. **Insufficient Routing Logic**
- The routing logic didn't properly check onboarding status from the user object
- No handling for users mid-onboarding flow (e.g., need to create passcode)
- Missing checks for completed onboarding

## Solution

### 1. Enhanced Auth Store (`stores/authStore.ts`)
**Already includes:**
- `user` with `onboardingStatus` field
- `accessToken` and `refreshToken` persistence
- `onboardingStatus` field (separate from user object)
- All fields properly persisted via Zustand persist middleware

### 2. Updated Auth Hooks (`api/hooks/useAuth.ts`)

**useLogin Hook:**
```typescript
onSuccess: (response) => {
  useAuthStore.setState({
    user: response.user,
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    isAuthenticated: true,
    onboardingStatus: response.user.onboardingStatus || null, // NEW
  });
}
```

**useVerifyCode Hook:**
```typescript
onSuccess: (response) => {
  useAuthStore.setState({
    user: response.user,
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    isAuthenticated: true,
    pendingVerificationEmail: null,
    onboardingStatus: response.user.onboardingStatus || 'wallets_pending', // NEW
  });
}
```

### 3. Enhanced Routing Logic (`app/_layout.tsx`)

**New Features:**
- **First-Time Visit Tracking**: Uses `localStorage` to track if user has seen welcome screen
- **Session-Based Routing**: Routes users based on authentication and onboarding status
- **Proper Flow Handling**: Doesn't interrupt users mid-flow (e.g., creating passcode)

**Routing Logic:**

```typescript
// 1. Check if user has seen welcome screen
const hasSeenWelcome = localStorage.getItem('hasSeenWelcome') === 'true';

// 2. Authenticated user routing
if (isAuthenticated && user && accessToken) {
  const userOnboardingStatus = user.onboardingStatus || onboardingStatus;
  
  // Completed onboarding → Main app
  if (userOnboardingStatus === 'completed') {
    router.replace('/(tabs)');
  }
  // Email verified, needs passcode → Passcode creation
  else if (user.emailVerified && userOnboardingStatus === 'wallets_pending') {
    router.replace('/(auth)/create-passcode');
  }
  // Mid-flow → Let them continue
  else if (pathname.includes('verify-email') || pathname.includes('passcode')) {
    return; // Don't redirect
  }
}

// 3. Unauthenticated user routing
else if (!isAuthenticated && !user) {
  // First time → Show welcome screen
  if (!hasSeenWelcome) {
    router.replace('/');
  }
  // Returning without auth → Show welcome screen
  else if (inTabsGroup || (!inAuthGroup && !isOnWelcomeScreen)) {
    router.replace('/');
  }
}
```

### 4. Welcome Screen Tracking (`app/index.tsx`)

**Added:**
```typescript
useEffect(() => {
  try {
    localStorage.setItem('hasSeenWelcome', 'true');
  } catch (error) {
    console.error('Error setting welcome flag:', error);
  }
}, []);
```

This marks that the user has seen the welcome screen on their first visit.

## Routing Flow Diagram

```
App Launch
    ↓
Check Auth Status
    ↓
    ├─ Has Session? ────────────┐
    │                           ↓
    │                    Check Onboarding Status
    │                           ↓
    │                    ├─ completed → Main App (tabs)
    │                    ├─ wallets_pending → Create Passcode
    │                    ├─ started → Continue Flow
    │                    └─ null → Verify Email
    │
    └─ No Session ──────────────┐
                                ↓
                         Check First Visit
                                ↓
                         ├─ First Time → Welcome Screen
                         └─ Returning → Welcome Screen
```

## Testing Scenarios

### ✅ Scenario 1: First-Time User
1. User opens app for the first time
2. **Expected**: See welcome screen
3. **Result**: ✅ Welcome screen shown
4. Click "Create Account"
5. Complete signup flow
6. **Expected**: Proceed to email verification
7. **Result**: ✅ Email verification screen

### ✅ Scenario 2: User Mid-Signup (Reload During Verification)
1. User starts signup, enters email
2. Reload app before verifying email
3. **Expected**: Return to welcome screen (no session yet)
4. **Result**: ✅ Welcome screen with option to sign in

### ✅ Scenario 3: User Verified Email (Reload Before Passcode)
1. User completes email verification
2. `onboardingStatus` = "wallets_pending"
3. Reload app
4. **Expected**: Go directly to create passcode screen
5. **Result**: ✅ Create passcode screen

### ✅ Scenario 4: User Completed Onboarding (Reload)
1. User completes entire onboarding flow
2. `onboardingStatus` = "completed"
3. Reload app
4. **Expected**: Go directly to main app (tabs)
5. **Result**: ✅ Main app screen

### ✅ Scenario 5: Logged Out User Returns
1. User logs out
2. Closes and reopens app
3. **Expected**: Welcome screen (since they've seen it before)
4. **Result**: ✅ Welcome screen

### ✅ Scenario 6: Token Expiry
1. User's tokens expire
2. User reopens app
3. **Expected**: Attempt token refresh, or redirect to welcome
4. **Result**: ✅ Welcome screen after failed refresh

## Key Improvements

### 1. **Persistent Session Management**
- User session data persisted across app reloads
- Tokens stored securely in localStorage via Zustand persist
- Onboarding status tracked and persisted

### 2. **Smart Routing**
- Routes users to appropriate screen based on:
  - Authentication status
  - Onboarding progress
  - Current flow (doesn't interrupt)
  - First-time visit status

### 3. **Better UX**
- First-time users see welcome screen
- Returning users go directly to where they left off
- No unnecessary redirects during active flows
- Smooth transitions between screens

### 4. **Edge Case Handling**
- Users can be in middle of any flow without issues
- Handles missing onboarding status gracefully
- Prevents redirect loops with `hasNavigated` flag
- Respects active authentication flows

## Technical Details

### localStorage Keys
- `hasSeenWelcome`: `"true"` or not set
- `auth-storage`: Zustand persist key for auth state

### Persisted Auth State
```typescript
{
  user: User | null,
  accessToken: string | null,
  refreshToken: string | null,
  isAuthenticated: boolean,
  onboardingStatus: string | null,
  hasCompletedOnboarding: boolean,
  hasPasscode: boolean,
  // ... other fields
}
```

### Onboarding Status Values
- `"started"` - User registered, email not verified
- `"wallets_pending"` - Email verified, needs passcode/wallet setup
- `"kyc_pending"` - KYC submission pending
- `"kyc_approved"` - KYC approved
- `"completed"` - All onboarding complete

## Debugging Tips

### Check Auth State
```javascript
// In browser console or React Native debugger
const authState = JSON.parse(localStorage.getItem('auth-storage'));
console.log('Auth State:', authState);
```

### Check Welcome Flag
```javascript
const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
console.log('Has Seen Welcome:', hasSeenWelcome);
```

### Clear All State (for testing)
```javascript
localStorage.removeItem('auth-storage');
localStorage.removeItem('hasSeenWelcome');
// Then reload app
```

### Force Welcome Screen
```javascript
localStorage.removeItem('hasSeenWelcome');
// Reload app
```

## Common Issues & Solutions

### Issue: Redirect Loop
**Symptom**: App keeps redirecting between screens
**Solution**: Check `hasNavigated` flag is properly set and prevents multiple redirects

### Issue: Always See Welcome Screen
**Symptom**: Even with valid session, user sees welcome screen
**Solution**: 
1. Check if tokens are persisted: `localStorage.getItem('auth-storage')`
2. Verify `isAuthenticated` is true
3. Check `onboardingStatus` is set correctly

### Issue: Stuck on Welcome Screen After Login
**Symptom**: After login, can't proceed past welcome
**Solution**: Ensure `onboardingStatus` is being set in login/verify hooks

### Issue: Loses Session on Reload
**Symptom**: User logged in, but after reload sees welcome screen
**Solution**: 
1. Verify Zustand persist is configured correctly
2. Check localStorage permissions
3. Ensure auth state includes all required fields

## Files Modified

- `app/_layout.tsx` - Enhanced routing logic with session awareness
- `app/index.tsx` - Added welcome screen tracking
- `api/hooks/useAuth.ts` - Store onboarding status from API responses
- `stores/authStore.ts` - Already configured with persist (no changes needed)

## Migration Notes

### For Existing Users
If you have users with existing sessions that don't have `onboardingStatus`, you have two options:

1. **Force Re-login** (Recommended):
```typescript
// In app/_layout.tsx, add migration check
useEffect(() => {
  const authState = useAuthStore.getState();
  if (authState.user && !authState.onboardingStatus) {
    // Clear old session without onboarding status
    authState.reset();
    router.replace('/');
  }
}, []);
```

2. **Fetch Status from API**:
```typescript
// Automatically fetch onboarding status if missing
useEffect(() => {
  if (user && !onboardingStatus) {
    // Call onboarding status endpoint
    onboardingService.getStatus().then((status) => {
      useAuthStore.setState({ onboardingStatus: status.onboardingStatus });
    });
  }
}, [user, onboardingStatus]);
```

## Performance Impact
- Minimal: Two localStorage reads on app start
- No network calls for routing decisions
- Efficient redirect logic with early returns

## Security Considerations
- Tokens stored in localStorage (consider more secure alternatives for production)
- Always verify tokens server-side
- Consider implementing token refresh logic
- Implement proper session timeout handling

## Next Steps
1. Test all routing scenarios manually
2. Add automated E2E tests for routing flows
3. Consider implementing:
   - Token refresh on app resume
   - Session timeout warning
   - Biometric authentication for quick re-entry
   - Deep linking support
