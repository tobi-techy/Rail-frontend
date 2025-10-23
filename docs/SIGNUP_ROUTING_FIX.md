# Signup Routing Fix - Preventing Redirect Back to Signup Screen

## Problem Statement
After clicking "Create Account" and receiving the verification code, users were incorrectly being routed back to the signup screen instead of staying on the verify-email screen.

## Root Causes Identified

### 1. **Premature Authentication State**
The `useRegister` hook was not explicitly clearing the authentication state, which could cause the routing logic to treat the user as authenticated before email verification was complete.

**Location**: `api/hooks/useAuth.ts`

**Issue**: The registration success handler only set `pendingVerificationEmail` but didn't explicitly ensure `isAuthenticated` was false and `user` was null.

### 2. **Over-Aggressive Routing Logic**
The routing protection in `_layout.tsx` was redirecting users during active authentication flows instead of allowing them to complete the signup process.

**Location**: `app/_layout.tsx` (useProtectedRoute)

**Issues**:
- The routing logic checked authentication state before checking if user was in an active flow
- Missing specific handling for users with `pendingVerificationEmail` (mid-signup)
- The logic for `emailVerified && !hasUserPasscode` was triggering too early

### 3. **Insufficient Flow State Checks**
The code wasn't properly checking all authentication flow screens before applying routing logic.

**Location**: `app/_layout.tsx`

**Issue**: Only checking for `isOnLoginPasscode`, not for verify-email, create-passcode, or confirm-passcode screens.

## Solutions Implemented

### 1. Fixed Registration Hook to Maintain Clean State
**File**: `api/hooks/useAuth.ts`

```typescript
export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: (response, variables) => {
      // Store pending identifier (email or phone) for verification
      // DO NOT set isAuthenticated or user yet - wait for verification
      useAuthStore.setState({
        pendingVerificationEmail: variables.email || variables.phone || response.identifier,
        isAuthenticated: false, // Explicitly ensure not authenticated
        user: null, // No user object until verified
      });
    },
  });
}
```

**Why This Works**:
- Explicitly sets `isAuthenticated: false` to prevent routing logic from treating user as logged in
- Sets `user: null` to ensure no user object exists before verification
- Only sets `pendingVerificationEmail` to track signup progress

### 2. Enhanced Routing Logic with Flow Protection
**File**: `app/_layout.tsx`

#### A. Added Explicit Flow Screen Checks
```typescript
const isOnVerifyEmail = pathname === '/(auth)/verify-email';
const isOnCreatePasscode = pathname === '/(auth)/create-passcode';
const isOnConfirmPasscode = pathname === '/(auth)/confirm-passcode';
```

#### B. Early Return for Active Auth Flows
```typescript
// Critical: Don't interrupt active auth flows - let user complete them
if (isOnLoginPasscode || isOnVerifyEmail || isOnCreatePasscode || isOnConfirmPasscode) {
  return;
}
```

**Why This Works**:
- Checks for active auth flow screens BEFORE applying any routing logic
- Early return prevents any redirect logic from running
- Ensures users can complete multi-step flows without interruption

#### C. Simplified Authenticated User Logic
```typescript
if (isAuthenticated && user && accessToken) {
  // ... critical flow checks first ...
  
  // Completed onboarding cases
  if (userOnboardingStatus === 'completed' && inTabsGroup) {
    return;
  }
  
  if (userOnboardingStatus === 'completed' && hasUserPasscode && !inTabsGroup) {
    setHasNavigated(true);
    router.replace('/(tabs)');
  }
  
  // Welcome screen redirects
  else if (isOnWelcomeScreen) {
    setHasNavigated(true);
    if (userOnboardingStatus === 'completed') {
      router.replace('/(tabs)');
    } else if (user.emailVerified && !hasUserPasscode) {
      router.replace('/(auth)/create-passcode');
    } else if (!user.emailVerified) {
      router.replace('/(auth)/verify-email');
    }
  }
  
  // Only redirect to passcode if NOT in auth group
  else if (user.emailVerified && !hasUserPasscode && !inAuthGroup) {
    setHasNavigated(true);
    router.replace('/(auth)/create-passcode');
  }
}
```

**Why This Works**:
- Removed complex nested conditions that were causing premature redirects
- Flow screens are checked first, preventing any routing during active flows
- Passcode redirect only happens if user is NOT in auth group (prevents interruption)

#### D. Added Pending Verification Handler
```typescript
// User awaiting email verification (has pending email but not authenticated)
else if (!isAuthenticated && !user && pendingVerificationEmail) {
  // User is in the middle of signup flow - keep them on verify-email screen
  if (isOnVerifyEmail) {
    return;
  }
  // If they navigated away from verify-email, bring them back
  if (!isOnVerifyEmail && !isOnWelcomeScreen) {
    setHasNavigated(true);
    router.replace('/(auth)/verify-email');
  }
}
```

**Why This Works**:
- Specifically handles users mid-signup with `pendingVerificationEmail` set
- Keeps them on verify-email screen or brings them back if they navigate away
- Prevents accidental navigation that would break the signup flow

#### E. Updated Dependencies
```typescript
}, [user, isAuthenticated, accessToken, onboardingStatus, pendingVerificationEmail, pathname, segments, hasNavigated, hasSeenWelcome, isReady]);
```

Added `pendingVerificationEmail` to the dependency array to trigger re-evaluation when it changes.

## Flow Diagram: Fixed Signup Process

```
User Click "Create Account"
    ↓
Register API Call (useRegister)
    ↓
Store State Update:
  - pendingVerificationEmail: email
  - isAuthenticated: false
  - user: null
    ↓
Navigate to /(auth)/verify-email
    ↓
useProtectedRoute Effect Runs
    ↓
Check: isOnVerifyEmail? → YES
    ↓
Early Return (No Redirect) ✅
    ↓
User Stays on Verify Email Screen
    ↓
User Enters Code → Verification Success
    ↓
Store State Update (useVerifyCode):
  - user: response.user
  - isAuthenticated: true
  - accessToken: token
  - pendingVerificationEmail: null
    ↓
Navigate to /(auth)/create-passcode
    ↓
useProtectedRoute Effect Runs
    ↓
Check: isOnCreatePasscode? → YES
    ↓
Early Return (No Redirect) ✅
    ↓
User Completes Passcode Setup
```

## Test Scenarios

### ✅ Scenario 1: Normal Signup Flow
1. User clicks "Create Account"
2. **Expected**: Navigate to verify-email screen
3. **Result**: ✅ Stays on verify-email screen
4. User receives code
5. **Expected**: Can enter code without redirects
6. **Result**: ✅ No redirects during code entry

### ✅ Scenario 2: App Reload During Verification
1. User is on verify-email screen (hasn't entered code yet)
2. User reloads app or navigates away
3. **Expected**: Return to verify-email screen (pendingVerificationEmail is set)
4. **Result**: ✅ Redirected back to verify-email screen

### ✅ Scenario 3: After Verification
1. User successfully verifies email
2. **Expected**: Navigate to create-passcode screen
3. **Result**: ✅ Navigates to create-passcode
4. **Expected**: Stays on create-passcode without redirects
5. **Result**: ✅ No redirects

### ✅ Scenario 4: Tab Navigation During Flow
1. User on verify-email screen
2. User tries to navigate to tabs (protected route)
3. **Expected**: Stay on verify-email (not authenticated yet)
4. **Result**: ✅ Returns to verify-email screen

## Key Principles Applied

### 1. **Explicit State Management**
Always explicitly set authentication state in hooks - don't rely on defaults or assume values.

### 2. **Flow-First Routing**
Check if user is in an active flow BEFORE applying any routing logic. Active flows should never be interrupted.

### 3. **Minimal State for Unverified Users**
Users who haven't verified email should have:
- `isAuthenticated: false`
- `user: null`
- `pendingVerificationEmail: string` (to track progress)

### 4. **Early Returns for Active Flows**
Use early returns to prevent routing logic from running during active authentication flows.

### 5. **Progressive State Updates**
Update state progressively as user completes steps:
- After registration: Only pending email set
- After verification: User, tokens, and authenticated state set
- After passcode: Onboarding status updated

## Files Modified

1. **`api/hooks/useAuth.ts`**
   - Fixed `useRegister` hook to explicitly clear auth state
   - Added comments clarifying authentication timing

2. **`app/_layout.tsx`**
   - Added `pendingVerificationEmail` to routing state
   - Added explicit checks for all auth flow screens
   - Simplified routing logic with early returns for active flows
   - Added dedicated handler for pending verification state
   - Updated effect dependencies

## Prevention Guidelines

To prevent similar issues in the future:

1. **Always Check Active Flows First**
   ```typescript
   // Good: Check flows first
   if (isOnAuthFlowScreen) return;
   
   // Bad: Apply routing logic without checking
   if (someCondition) router.replace(...);
   ```

2. **Explicit State in Mutations**
   ```typescript
   // Good: Explicitly set all relevant state
   onSuccess: () => {
     setState({
       isAuthenticated: false,
       user: null,
       pendingEmail: email,
     });
   }
   
   // Bad: Only set some state, assume defaults
   onSuccess: () => {
     setState({ pendingEmail: email });
   }
   ```

3. **Track Intermediate Flow States**
   Use flags like `pendingVerificationEmail` to track users mid-flow and handle them appropriately.

4. **Test Flow Interruptions**
   Always test what happens if users:
   - Reload the page mid-flow
   - Navigate away and back
   - Have slow network connections

5. **Document State Transitions**
   Clearly document when each state field should be set and what it means for routing.

## Performance Impact
- No measurable performance impact
- Added checks are simple boolean evaluations
- Early returns actually improve performance by skipping unnecessary logic

## Security Considerations
- Unverified users correctly have `isAuthenticated: false`
- No access to protected routes until email verification complete
- Token storage only happens after successful verification
- Pending email state doesn't expose sensitive information

## Next Steps

1. ✅ Test all signup scenarios manually
2. ⏳ Add integration tests for signup flow
3. ⏳ Add E2E tests with navigation interruptions
4. ⏳ Consider adding analytics to track where users drop off in signup flow
5. ⏳ Review other authentication flows (login, password reset) for similar issues
