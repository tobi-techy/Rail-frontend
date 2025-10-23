# Testing Instructions

## Authentication & Onboarding Flow Testing

This document provides instructions for testing the complete authentication and onboarding flow after the API integration fixes.

## Prerequisites

1. **Backend Server Running**
   - Ensure the Go backend server is running on `http://localhost:8080`
   - Database migrations applied
   - Redis running for verification codes
   - Email service configured (or check server logs for verification codes)

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **For Node.js Test Script**
   ```bash
   npm install -D ts-node @types/node axios
   ```

## Running the Test Script

### Option 1: Using the Test Script

Run the automated test script:

```bash
npx ts-node scripts/test-auth-flow.ts
```

Or with custom API URL:

```bash
API_BASE_URL=http://your-backend:8080/api npx ts-node scripts/test-auth-flow.ts
```

The script will:
1. Register a new user
2. Prompt you to enter the verification code (check server logs or email)
3. Verify the email
4. Create a passcode
5. Test onboarding status endpoints
6. Test token refresh
7. Test logout and login

### Option 2: Manual Testing with the Mobile App

1. **Start the Development Server**
   ```bash
   npm start
   # or
   expo start
   ```

2. **Test Registration Flow**
   - Navigate to Sign Up screen
   - Enter email and password
   - Click "Create Account"
   - Verify: Should receive 202 response with message and identifier
   - Check: Email should receive verification code (or check server logs)

3. **Test Email Verification**
   - Enter the 6-digit code received
   - Click "Verify Email"
   - Verify: Should receive 200 response with user info and tokens
   - Check: Should navigate to passcode creation screen

4. **Test Passcode Creation**
   - Enter a 4-digit passcode
   - Confirm the passcode
   - Verify: Should receive 201 response with passcode status
   - Check: Should navigate to onboarding screens

5. **Test Onboarding Status**
   - App should automatically fetch onboarding status
   - Verify: Response includes wallet status and completed steps
   - Check: Wallets should be provisioning

6. **Test Login (Returning User)**
   - Logout or close app
   - Navigate to Sign In screen
   - Enter email and password
   - Verify: Should receive 200 response with tokens
   - Check: Should navigate to passcode entry screen

7. **Test Passcode Verification**
   - Enter your 4-digit passcode
   - Verify: Should receive session token
   - Check: Should navigate to home screen

## Testing Checklist

### Registration & Verification
- [ ] Register with valid email → receives 202 with verification message
- [ ] Register with duplicate email → receives 409 USER_EXISTS error
- [ ] Register with invalid email → receives 400 VALIDATION_ERROR
- [ ] Register with weak password → receives 400 VALIDATION_ERROR
- [ ] Verify with correct code → receives 200 with user and tokens
- [ ] Verify with incorrect code → receives 401 INVALID_CODE
- [ ] Resend code → receives 202 with new code sent
- [ ] Resend code too quickly → receives 429 TOO_MANY_REQUESTS

### Login
- [ ] Login with valid credentials → receives 200 with user and tokens
- [ ] Login with invalid password → receives 401 INVALID_CREDENTIALS
- [ ] Login with unverified email → redirects to verification
- [ ] Login with inactive account → receives 401 ACCOUNT_INACTIVE

### Passcode Management
- [ ] Create passcode with matching confirmation → receives 201 with status
- [ ] Create passcode with mismatched confirmation → receives 400 PASSCODE_MISMATCH
- [ ] Create passcode when already exists → receives 409 PASSCODE_EXISTS
- [ ] Get passcode status → receives 200 with enabled/locked status
- [ ] Verify correct passcode → receives 200 with session token
- [ ] Verify incorrect passcode → receives 401, increments failed attempts
- [ ] Verify passcode 5 times incorrectly → account locked (423)

### Onboarding
- [ ] Get onboarding status after verification → shows "wallets_pending"
- [ ] Get onboarding status after passcode → shows wallet provisioning
- [ ] Wallet status includes all 3 chains (ethereum-sepolia, polygon-amoy, base-sepolia)
- [ ] Required actions list shows next steps

### Token Management
- [ ] Refresh token with valid refreshToken → receives new accessToken
- [ ] Access protected endpoint with valid token → success
- [ ] Access protected endpoint with expired token → auto-refreshes
- [ ] Logout → tokens invalidated

## Error Handling Validation

### Component-Level Error Display
- [ ] Registration errors display clearly in the form
- [ ] Login errors display appropriate messages
- [ ] Verification errors show in the OTP input
- [ ] Passcode errors display with clear instructions
- [ ] Network errors display fallback messages

### Error Code Mapping
- [ ] VALIDATION_ERROR → "Please check your email and password"
- [ ] USER_EXISTS → "Account already exists. Please sign in."
- [ ] INVALID_CREDENTIALS → "Invalid email or password"
- [ ] INVALID_CODE → "Invalid or expired code"
- [ ] TOO_MANY_REQUESTS → "Too many requests. Please wait."
- [ ] PASSCODE_LOCKED → "Too many failed attempts"

## API Response Validation

### Verify Response Structures

**Register Response (202):**
```json
{
  "message": "Verification code sent to user@example.com...",
  "identifier": "user@example.com"
}
```

**Verify Code Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "emailVerified": true,
    "onboardingStatus": "wallets_pending",
    "kycStatus": "pending"
  },
  "accessToken": "jwt...",
  "refreshToken": "jwt...",
  "expiresAt": "2025-10-23T18:00:00Z"
}
```

**Login Response (200):**
```json
{
  "user": {...},
  "accessToken": "jwt...",
  "refreshToken": "jwt...",
  "expiresAt": "2025-10-23T18:00:00Z"
}
```

**Create Passcode Response (201):**
```json
{
  "message": "Passcode created successfully",
  "status": {
    "enabled": true,
    "locked": false,
    "failedAttempts": 0,
    "remainingAttempts": 5,
    "lockedUntil": null,
    "updatedAt": "2025-10-23T10:00:00Z"
  }
}
```

**Onboarding Status Response (200):**
```json
{
  "userId": "uuid",
  "onboardingStatus": "wallets_pending",
  "kycStatus": "pending",
  "currentStep": "passcode_creation",
  "completedSteps": ["registration", "email_verification"],
  "walletStatus": {
    "totalWallets": 3,
    "createdWallets": 0,
    "pendingWallets": 3,
    "failedWallets": 0,
    "supportedChains": ["ethereum-sepolia", "polygon-amoy", "base-sepolia"],
    "walletsByChain": {
      "ethereum-sepolia": "pending",
      "polygon-amoy": "pending",
      "base-sepolia": "pending"
    }
  },
  "canProceed": true,
  "requiredActions": [...]
}
```

## Debugging Tips

### Check Network Requests
1. Open React Native Debugger
2. Enable Network Inspector
3. Verify request/response payloads match expected format
4. Check HTTP status codes

### Check Console Logs
- Registration/Login responses
- Token storage
- Error messages
- API client interceptor logs

### Check Backend Logs
- Verification codes (if email not configured)
- API request/response logs
- Error stack traces
- Database queries

### Common Issues

**Issue: Verification code not received**
- Check server logs for the code
- Verify email service is configured
- Check Redis for stored codes: `redis-cli GET verification:<email>`

**Issue: 401 Unauthorized on protected endpoints**
- Verify token is stored in auth store
- Check token hasn't expired
- Verify Authorization header format: `Bearer <token>`

**Issue: Passcode not working**
- Verify endpoint URL is `/v1/security/passcode` (not `/v1/auth/passcode`)
- Check passcode format (exactly 4 digits)
- Verify confirmPasscode is provided

**Issue: Wallet provisioning not starting**
- Verify passcode was created successfully
- Check onboarding status for "passcode_creation" in completedSteps
- Review server logs for wallet job execution

## Integration Testing

For automated integration testing:

1. **Set up test database**
   ```bash
   createdb testrun_test
   PGDATABASE=testrun_test go run cmd/migrate/main.go up
   ```

2. **Run backend tests**
   ```bash
   go test ./...
   ```

3. **Run E2E tests**
   ```bash
   npm run test:e2e
   ```

## Next Steps After Testing

1. **Update Environment Variables**
   - Set production API URL
   - Configure proper email service
   - Set up error tracking (Sentry, etc.)

2. **Performance Testing**
   - Test with slow network
   - Test with offline mode
   - Test concurrent requests

3. **Security Audit**
   - Verify sensitive data not logged
   - Check token storage security
   - Test rate limiting effectiveness

4. **User Acceptance Testing**
   - Test with real users
   - Gather feedback on error messages
   - Validate UX flow

## Support

If you encounter issues:
1. Check `docs/API_INTEGRATION_FIX_SUMMARY.md` for changes
2. Review `docs/AUTH_FLOW.md` for API specifications
3. Check server logs for detailed error messages
4. Verify all dependencies are up to date

## Quick Reference

### Test Credentials (for development)
```
Email: test@example.com
Password: TestPassword123!
Passcode: 1234
```

### API Endpoints
```
POST   /v1/auth/register
POST   /v1/auth/login
POST   /v1/auth/verify-code
POST   /v1/auth/resend-code
POST   /v1/auth/refresh
POST   /v1/auth/logout
GET    /v1/security/passcode
POST   /v1/security/passcode
PUT    /v1/security/passcode
POST   /v1/security/passcode/verify
DELETE /v1/security/passcode
POST   /v1/onboarding/start
GET    /v1/onboarding/status
POST   /v1/onboarding/kyc/submit
```
