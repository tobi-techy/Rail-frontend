# API Integration Fix Summary

## Overview
Fixed all API integration issues for Authentication & Onboarding endpoints to align with the backend specifications documented in `docs/AUTH_FLOW.md`.

## Changes Made

### 1. API Types (`api/types/index.ts`)

#### Updated Authentication Types
- **LoginRequest**: Removed `deviceId` (not required by backend)
- **LoginResponse**: Changed from nested `{ user, tokens }` to flat `{ user, accessToken, refreshToken, expiresAt }`
- **RegisterRequest**: Added optional `email` and `phone` fields (either required, not both)
- **RegisterResponse**: Changed from `{ message, userId }` to `{ message, identifier }`
- **VerifyCodeRequest**: Added optional `email` and `phone` fields
- **VerifyCodeResponse**: Changed to flat structure with `{ user, accessToken, refreshToken, expiresAt }`
- **ResendCodeRequest**: Added optional `email` and `phone` fields
- **ResendCodeResponse**: Added response type `{ message, identifier }`
- **RefreshTokenResponse**: Changed token field from `token` to `accessToken`
- **User**: Updated `phone` to be nullable, updated `onboardingStatus` enum values

#### Added Passcode Types
- **PasscodeStatus**: New type for passcode status with lock information
- **CreatePasscodeRequest**: Now requires `passcode` and `confirmPasscode`
- **CreatePasscodeResponse**: Returns message and status
- **UpdatePasscodeRequest**: Requires `currentPasscode`, `newPasscode`, `confirmPasscode`
- **UpdatePasscodeResponse**: Returns message and status
- **VerifyPasscodeResponse**: Returns `verified`, `sessionToken`, and `expiresAt`
- **DeletePasscodeRequest**: Requires current `passcode` for confirmation
- **DeletePasscodeResponse**: Returns message and status

#### Updated Onboarding Types
- **OnboardingStatusResponse**: Added detailed `walletStatus` structure with chain-specific status
- **KYCVerificationRequest**: Updated to match backend structure with `documents[]` array
- **KYCVerificationResponse**: Changed to match backend response

### 2. Authentication Service (`api/services/auth.service.ts`)

#### Changes
- Removed nested response destructuring (`.data.data`)
- All responses now return data directly from `apiClient`
- Updated return types to match corrected type definitions
- Added comprehensive JSDoc comments
- Added `ResendCodeResponse` return type for `resendCode()`

#### Endpoints Verified
- ✅ `POST /v1/auth/login` - Returns `LoginResponse`
- ✅ `POST /v1/auth/register` - Returns `RegisterResponse` (202 Accepted)
- ✅ `POST /v1/auth/verify-code` - Returns `VerifyCodeResponse`
- ✅ `POST /v1/auth/resend-code` - Returns `ResendCodeResponse` (202 Accepted)
- ✅ `POST /v1/auth/refresh` - Returns `RefreshTokenResponse`
- ✅ `POST /v1/auth/logout` - Returns void

### 3. Passcode Service (`api/services/passcode.service.ts`)

#### Major Changes
- **Endpoint URLs**: Changed from `/v1/auth/passcode/*` to `/v1/security/passcode`
- **HTTP Methods**: Properly implemented GET, POST, PUT, DELETE methods

#### New Methods
- `getStatus()` - GET `/v1/security/passcode` - Returns `PasscodeStatus`
- `createPasscode()` - POST `/v1/security/passcode` - Returns `CreatePasscodeResponse`
- `updatePasscode()` - PUT `/v1/security/passcode` - Returns `UpdatePasscodeResponse`
- `verifyPasscode()` - POST `/v1/security/passcode/verify` - Returns `VerifyPasscodeResponse`
- `deletePasscode()` - DELETE `/v1/security/passcode` - Returns `DeletePasscodeResponse`

#### Endpoints Verified
- ✅ `GET /v1/security/passcode` - Get status
- ✅ `POST /v1/security/passcode` - Create (201 Created)
- ✅ `PUT /v1/security/passcode` - Update (200 OK)
- ✅ `POST /v1/security/passcode/verify` - Verify (200 OK)
- ✅ `DELETE /v1/security/passcode` - Delete (200 OK)

### 4. Onboarding Service (`api/services/onboarding.service.ts`)

#### Changes
- Removed nested response destructuring
- All responses return data directly from `apiClient`
- Updated JSDoc comments for clarity
- Removed unused `ApiResponse` import

#### Endpoints Verified
- ✅ `POST /v1/onboarding/start` - Returns `OnboardingStartResponse` (201 Created)
- ✅ `GET /v1/onboarding/status` - Returns `OnboardingStatusResponse` (200 OK)
- ✅ `POST /v1/onboarding/kyc/submit` - Returns `KYCVerificationResponse` (202 Accepted)

### 5. API Client (`api/client.ts`)

#### Response Interceptor Improvements
- Added logic to prevent token refresh retry on auth endpoints (login/register/verify)
- Enhanced error logging with method and statusText
- Improved error transformation to handle multiple error formats
- Returns response data directly (backend doesn't wrap in `{ data: ... }`)

#### Error Transformation
- Handles backend error format: `{ code, message, details }`
- Handles legacy error format: `{ error: { code, message } }`
- Handles generic HTTP errors
- Network errors properly identified

### 6. React Query Hooks

#### `useAuth.ts` Updates
- **useLogin**: Fixed to use `response.accessToken` instead of `response.tokens.token`
- **useRegister**: Updated to handle both email and phone, stores `response.identifier`
- All hooks properly destructure flat response objects

#### `usePasscode.ts` Updates
- **usePasscodeStatus**: New hook to fetch passcode status
- **useCreatePasscode**: Updated to match new response structure
- **useVerifyPasscode**: Now stores session token in auth store for sensitive operations
- **useUpdatePasscode**: Updated to use new `UpdatePasscodeRequest` type
- **useDeletePasscode**: New hook for passcode removal

#### Query Keys
- Added `auth.passcode()` query key in `queryClient.ts`

## Testing Checklist

### Authentication Flow
- [ ] Register with email → receives verification code
- [ ] Register with phone → receives verification code (if implemented)
- [ ] Register with both email and phone → returns 400 error
- [ ] Verify code with correct code → returns user and tokens
- [ ] Verify code with incorrect code → returns 401 error
- [ ] Resend code → receives new code (rate limited)
- [ ] Login with correct credentials → returns user and tokens
- [ ] Login with incorrect credentials → returns 401 error
- [ ] Refresh token → returns new tokens
- [ ] Logout → invalidates session

### Passcode Flow
- [ ] Get passcode status when not set → enabled: false
- [ ] Create passcode with matching confirmation → returns 201 with status
- [ ] Create passcode with mismatched confirmation → returns 400 error
- [ ] Create passcode when already exists → returns 409 error
- [ ] Update passcode with correct current passcode → returns 200
- [ ] Update passcode with incorrect current passcode → returns 401, increments failed attempts
- [ ] Verify passcode correctly → returns session token
- [ ] Verify passcode incorrectly 5 times → account locked (423)
- [ ] Delete passcode with correct passcode → returns 200, disabled

### Onboarding Flow
- [ ] Start onboarding → returns user ID and next step
- [ ] Get onboarding status → returns comprehensive status with wallet and KYC info
- [ ] Create passcode → triggers wallet provisioning
- [ ] Check status after passcode → wallets show as creating/pending
- [ ] Submit KYC documents → returns 202 with processing status
- [ ] Check status after KYC → shows kyc_processing or kyc_approved

## API Endpoint Summary

### Authentication Endpoints
| Method | Endpoint | Status | Response Type |
|--------|----------|--------|---------------|
| POST | `/v1/auth/register` | 202 | RegisterResponse |
| POST | `/v1/auth/login` | 200 | LoginResponse |
| POST | `/v1/auth/verify-code` | 200 | VerifyCodeResponse |
| POST | `/v1/auth/resend-code` | 202 | ResendCodeResponse |
| POST | `/v1/auth/refresh` | 200 | RefreshTokenResponse |
| POST | `/v1/auth/logout` | 200 | void |

### Passcode Endpoints (Protected)
| Method | Endpoint | Status | Response Type |
|--------|----------|--------|---------------|
| GET | `/v1/security/passcode` | 200 | PasscodeStatus |
| POST | `/v1/security/passcode` | 201 | CreatePasscodeResponse |
| PUT | `/v1/security/passcode` | 200 | UpdatePasscodeResponse |
| POST | `/v1/security/passcode/verify` | 200 | VerifyPasscodeResponse |
| DELETE | `/v1/security/passcode` | 200 | DeletePasscodeResponse |

### Onboarding Endpoints
| Method | Endpoint | Auth | Status | Response Type |
|--------|----------|------|--------|---------------|
| POST | `/v1/onboarding/start` | Public | 201 | OnboardingStartResponse |
| GET | `/v1/onboarding/status` | Protected | 200 | OnboardingStatusResponse |
| POST | `/v1/onboarding/kyc/submit` | Protected | 202 | KYCVerificationResponse |

## Error Handling

### Common Error Codes
- `VALIDATION_ERROR` (400) - Invalid request payload
- `INVALID_CREDENTIALS` (401) - Wrong email/password
- `UNAUTHORIZED` (401) - Missing or invalid JWT
- `ACCOUNT_INACTIVE` (401) - User account is inactive
- `INVALID_CODE` (401) - Wrong or expired verification code
- `INVALID_PASSCODE` (401) - Wrong passcode
- `USER_EXISTS` (409) - Duplicate registration
- `PASSCODE_EXISTS` (409) - Passcode already configured
- `PASSCODE_LOCKED` (423) - Too many failed attempts
- `TOO_MANY_REQUESTS` (429) - Rate limit exceeded

### Response Format
```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  },
  timestamp: string
}
```

## Breaking Changes

1. **LoginResponse structure changed** - Update components accessing `response.tokens.token` to `response.accessToken`
2. **Passcode endpoints moved** - All passcode URLs changed from `/v1/auth/passcode/*` to `/v1/security/passcode`
3. **Passcode creation requires confirmation** - Must provide both `passcode` and `confirmPasscode`
4. **Register/Verify accepts email OR phone** - Not both simultaneously
5. **RefreshTokenResponse** - Token field renamed from `token` to `accessToken`

## Next Steps

1. **Update UI Components** - Ensure all components using auth/passcode/onboarding hooks are updated
2. **Test Error Handling** - Verify all error scenarios display appropriate messages
3. **Update AuthStore** - Add fields for `passcodeSessionToken` and `passcodeSessionExpiresAt` if not present
4. **Integration Testing** - Run through complete onboarding flow end-to-end
5. **Update Documentation** - Ensure any component-level docs reference correct API structure

## Files Modified

- `api/types/index.ts` - Type definitions
- `api/services/auth.service.ts` - Authentication service
- `api/services/passcode.service.ts` - Passcode service
- `api/services/onboarding.service.ts` - Onboarding service
- `api/client.ts` - API client interceptors
- `api/hooks/useAuth.ts` - Auth hooks
- `api/hooks/usePasscode.ts` - Passcode hooks
- `api/queryClient.ts` - Query keys

## Reference Documentation
- Backend API Spec: `docs/AUTH_FLOW.md`
- API Examples: See `docs/AUTH_FLOW.md` lines 945-1152 for JavaScript/Python examples
