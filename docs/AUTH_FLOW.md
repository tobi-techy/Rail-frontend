Authentication & Onboarding API Testing Guide

Overview
- This guide documents how to test authentication and onboarding endpoints implemented in the service.
- It covers endpoint-by-endpoint testing steps, expected responses, required authentication, common error scenarios, and end-to-end onboarding flow.
- Updated with actual request/response structures from the codebase for accurate frontend integration.

Prerequisites
- Running server on `http://localhost:8080` (e.g., `go run cmd/main.go`).
- A test database configured and reachable per `configs` settings.
- JWT configured (`config.JWT.secret`) and middleware enabled for protected routes.
- Redis configured for verification code storage and rate limiting.

Endpoint Summary
- Authentication (public):
  - `POST /api/v1/auth/register` — register with email/password; sends verification code.
  - `POST /api/v1/auth/login` — login and obtain JWT tokens.
  - `POST /api/v1/auth/verify-code` — verify email/SMS code (for signup flows).
  - `POST /api/v1/auth/resend-code` — resend verification code (rate limited).
  - `POST /api/v1/auth/refresh` — refresh tokens.
  - `POST /api/v1/auth/logout` — invalidate session/refresh token.
  - `POST /api/v1/auth/forgot-password` — initiate password reset.
  - `POST /api/v1/auth/reset-password` — complete password reset.
  - `POST /api/v1/auth/verify-email` — verify email via token/link.
- Onboarding (mixed auth):
  - `POST /api/v1/onboarding/start` — start onboarding for a user (PUBLIC).
  - `GET /api/v1/onboarding/status` — get onboarding + KYC + wallet status (PROTECTED).
  - `POST /api/v1/onboarding/kyc/submit` — submit KYC documents (PROTECTED).
  - `GET /api/v1/kyc/status` — get detailed KYC status (PROTECTED).
  - `POST /api/v1/kyc/callback/:provider_ref` — provider webhook for KYC status updates (PUBLIC/WEBHOOK).
- Security/Passcode (protected):
  - `GET /api/v1/security/passcode` — get passcode status for user.
  - `POST /api/v1/security/passcode` — create a 4-digit passcode.
  - `PUT /api/v1/security/passcode` — update existing passcode.
  - `POST /api/v1/security/passcode/verify` — verify passcode and get session token.
  - `DELETE /api/v1/security/passcode` — remove passcode.

Testing Guidelines

General Notes
- Use `Content-Type: application/json` for JSON requests.
- Protected endpoints require `Authorization: Bearer <jwt>`.
- Follow rate limits where applicable (verification/resend flows).
- Validate both positive and negative paths (success, invalid input, unauthorized).

1) POST /api/v1/auth/register
- Purpose: Register a new user with email OR phone and password; sends verification code.
- Auth: None (public endpoint)
- Request structure:
  {
    "email": "user@example.com",     // Optional (required if phone not provided)
    "phone": "+1234567890",           // Optional (required if email not provided, E.164 format)
    "password": "StrongP@ssw0rd!"     // Required, min 8 characters
  }
- IMPORTANT: Either `email` OR `phone` must be provided, but NOT both.
- Expected responses:
  - 202 Accepted: user registered and verification code sent
    {
      "message": "Verification code sent to user@example.com. Please verify your account.",
      "identifier": "user@example.com"
    }
  - 400 Bad Request: missing/invalid fields
    {
      "code": "VALIDATION_ERROR",
      "message": "Either email or phone is required"
    }
  - 409 Conflict: user already exists and is verified
    {
      "code": "USER_EXISTS",
      "message": "User already exists with this email",
      "details": { "email": "user@example.com" }
    }
  - 500 Internal Server Error: verification code send failed
    {
      "code": "VERIFICATION_SEND_FAILED",
      "message": "Failed to send verification code. Please try again."
    }
- Test cases:
  - Valid email/password returns 202 with verification message.
  - Valid phone/password returns 202 with verification message.
  - Both email and phone provided returns 400.
  - Neither email nor phone provided returns 400.
  - Duplicate registration for verified user returns 409.
  - Duplicate registration for unverified user resends code and returns 202.
  - Invalid email format returns 400.
  - Invalid phone format (not E.164) returns 400.
  - Weak/missing password (< 8 chars) returns 400.

2) POST /api/v1/auth/login
- Purpose: Authenticate user and obtain JWT tokens.
- Auth: None (public endpoint)
- Request structure:
  {
    "email": "user@example.com",      // Required
    "password": "StrongP@ssw0rd!"     // Required
  }
- Expected responses:
  - 200 OK: successful authentication with full user info and tokens
    {
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "user@example.com",
        "phone": "+1234567890",
        "emailVerified": true,
        "phoneVerified": false,
        "onboardingStatus": "wallets_pending",
        "kycStatus": "pending",
        "createdAt": "2025-10-23T10:00:00Z"
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "2025-10-23T18:00:00Z"
    }
  - 400 Bad Request: missing fields
    {
      "code": "VALIDATION_ERROR",
      "message": "Email and password are required"
    }
  - 401 Unauthorized: invalid credentials or inactive account
    {
      "code": "INVALID_CREDENTIALS",
      "message": "Invalid email or password"
    }
    OR
    {
      "code": "ACCOUNT_INACTIVE",
      "message": "Account is inactive. Please contact support."
    }
  - 500 Internal Server Error: token generation failed
    {
      "code": "TOKEN_GENERATION_FAILED",
      "message": "Failed to generate authentication tokens"
    }
- Additional behavior:
  - Updates last_login_at timestamp on successful login.
  - Sends login alert email with IP, user agent, and location (if email service configured).
- Test cases:
  - Valid credentials return 200 with user object and token fields.
  - Invalid password returns 401 with INVALID_CREDENTIALS.
  - Nonexistent user returns 401 with INVALID_CREDENTIALS.
  - Inactive user returns 401 with ACCOUNT_INACTIVE.
  - Missing email or password returns 400.

3) POST /api/v1/auth/verify-code
- Purpose: Verify a 6‑digit code sent to email/phone after registration.
- Auth: None (public endpoint)
- Request structure:
  {
    "email": "user@example.com",     // Optional (required if phone not provided)
    "phone": "+1234567890",           // Optional (required if email not provided)
    "code": "123456"                  // Required, exactly 6 digits
  }
- IMPORTANT: Either `email` OR `phone` must be provided, but NOT both.
- Expected responses:
  - 200 OK: verification successful, returns user info and JWT tokens
    {
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "user@example.com",
        "phone": null,
        "emailVerified": true,
        "phoneVerified": false,
        "onboardingStatus": "wallets_pending",
        "kycStatus": "processing",
        "createdAt": "2025-10-23T10:00:00Z"
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "2025-10-23T18:00:00Z"
    }
  - 200 OK: already verified
    {
      "code": "ALREADY_VERIFIED",
      "message": "email is already verified"
    }
  - 400 Bad Request: missing/invalid fields
    {
      "code": "VALIDATION_ERROR",
      "message": "Either email or phone is required"
    }
  - 401 Unauthorized: invalid or expired code
    {
      "code": "INVALID_CODE",
      "message": "Invalid or expired verification code"
    }
  - 404 Not Found: user not found (should not happen in normal flow)
  - 500 Internal Server Error: update or token generation failed
    {
      "code": "UPDATE_FAILED",
      "message": "Failed to update user verification status"
    }
- Additional behavior:
  - Marks email_verified or phone_verified as true.
  - Updates onboarding_status to "wallets_pending".
  - Triggers async onboarding job (KYC initialization, wallet provisioning).
  - Generates and returns JWT access and refresh tokens.
- Test cases:
  - Correct code → 200 with user and tokens.
  - Wrong code → 401 with INVALID_CODE.
  - Expired code → 401 with INVALID_CODE.
  - Already verified user → 200 with ALREADY_VERIFIED.
  - Both email and phone provided → 400.
  - Phone verification not yet implemented → 501 Not Implemented.

4) POST /api/v1/auth/resend-code
- Purpose: Request a new verification code to be sent.
- Auth: None (public endpoint)
- Request structure:
  {
    "email": "user@example.com",     // Optional (required if phone not provided)
    "phone": "+1234567890"            // Optional (required if email not provided)
  }
- IMPORTANT: Either `email` OR `phone` must be provided, but NOT both.
- Expected responses:
  - 202 Accepted: new verification code sent
    {
      "message": "New verification code sent to user@example.com.",
      "identifier": "user@example.com"
    }
  - 200 OK: already verified (no code sent)
    {
      "code": "ALREADY_VERIFIED",
      "message": "email is already verified"
    }
  - 400 Bad Request: missing/invalid fields
    {
      "code": "VALIDATION_ERROR",
      "message": "Either email or phone is required"
    }
  - 429 Too Many Requests: rate limit exceeded
    {
      "code": "TOO_MANY_REQUESTS",
      "message": "Too many resend attempts. Please wait before requesting a new code."
    }
  - 500 Internal Server Error: failed to send code
    {
      "code": "VERIFICATION_SEND_FAILED",
      "message": "Failed to resend verification code. Please try again."
    }
- Additional behavior:
  - Rate limited to prevent abuse (enforced by verification service).
  - Only works for unverified users.
- Test cases:
  - Valid unverified email → 202 with new code sent.
  - Already verified user → 200 with ALREADY_VERIFIED.
  - Too many requests within time window → 429.
  - Both email and phone provided → 400.
  - Phone verification not yet implemented → 501 Not Implemented.

5) POST /api/v1/onboarding/start
- Purpose: Start onboarding flow for a user (creates user if needed, initializes steps).
- Auth: None (public endpoint)
- Request structure:
  {
    "email": "user@example.com",      // Required, valid email format
    "phone": "+1234567890"             // Optional, E.164 format if provided
  }
- Expected responses:
  - 201 Created: onboarding initialized successfully
    {
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "onboardingStatus": "started",
      "nextStep": "email_verification",
      "sessionToken": null
    }
  - 400 Bad Request: invalid payload
    {
      "code": "VALIDATION_ERROR",
      "message": "Request validation failed",
      "details": { "validation_errors": "..." }
    }
  - 409 Conflict: user already exists with verified email
    {
      "code": "USER_EXISTS",
      "message": "User already exists with this email",
      "details": { "email": "user@example.com" }
    }
  - 500 Internal Server Error: onboarding failed
    {
      "code": "ONBOARDING_FAILED",
      "message": "Failed to start onboarding process",
      "details": { "error": "Internal server error" }
    }
- Additional behavior:
  - Creates user record if it doesn't exist.
  - Initializes onboarding flow steps.
  - May send verification email/SMS depending on configuration.
- Test cases:
  - New email → 201 with nextStep "email_verification".
  - Duplicate verified email → 409.
  - Invalid email format → 400.
  - Invalid phone format (not E.164) → 400.
  - Missing email → 400.

6) GET /api/v1/onboarding/status
- Purpose: Retrieve comprehensive onboarding status including KYC and wallet provisioning.
- Auth: Bearer JWT required (protected endpoint)
- Request: `GET /api/v1/onboarding/status?user_id=<uuid>` (user_id optional; derived from JWT if not provided)
- Headers: `Authorization: Bearer <accessToken>`
- Expected responses:
  - 200 OK: successful status retrieval
    {
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "onboardingStatus": "wallets_pending",
      "kycStatus": "processing",
      "currentStep": "passcode_creation",
      "completedSteps": [
        "registration",
        "email_verification"
      ],
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
      "requiredActions": [
        "Create a 4-digit passcode to secure your account",
        "Complete wallet setup"
      ]
    }
  - 400 Bad Request: invalid user_id format
    {
      "code": "INVALID_USER_ID",
      "message": "Invalid or missing user ID",
      "details": { "error": "..." }
    }
  - 401 Unauthorized: missing/invalid token
    {
      "code": "UNAUTHORIZED",
      "message": "User not authenticated"
    }
  - 403 Forbidden: user account is inactive
    {
      "code": "USER_INACTIVE",
      "message": "User account is inactive",
      "details": { "user_id": "..." }
    }
  - 404 Not Found: user does not exist
    {
      "code": "USER_NOT_FOUND",
      "message": "User not found",
      "details": { "user_id": "..." }
    }
  - 500 Internal Server Error: status retrieval failed
    {
      "code": "STATUS_RETRIEVAL_FAILED",
      "message": "Failed to retrieve onboarding status",
      "details": { "error": "Internal server error" }
    }
- Onboarding Status Values:
  - "started" - User registered, email not verified
  - "wallets_pending" - Email verified, wallets not created yet
  - "kyc_pending" - KYC submission pending
  - "kyc_approved" - KYC approved
  - "kyc_rejected" - KYC rejected, can retry
  - "completed" - All onboarding steps complete
- Completed Steps Possible Values:
  - "registration", "email_verification", "phone_verification", "passcode_creation", "kyc_submission", "kyc_review", "wallet_creation", "completed"
- Test cases:
  - Valid JWT → 200 with comprehensive status.
  - User with wallets created → walletStatus shows createdWallets > 0.
  - User with KYC approved → kycStatus "approved".
  - Invalid UUID in query → 400.
  - Valid UUID but non-existent user → 404.
  - Missing Bearer token → 401.
  - Inactive user → 403.

7) POST /api/v1/onboarding/kyc/submit
- Purpose: Submit KYC documents and personal information for verification.
- Auth: Bearer JWT required (protected endpoint)
- Headers: `Authorization: Bearer <accessToken>`
- Request structure:
  {
    "documentType": "passport",    // Required: "passport", "drivers_license", "national_id", etc.
    "documents": [                  // Required: Array of document objects, min 1
      {
        "type": "id_front",         // Required: document type/side
        "fileUrl": "https://example.com/docs/id_front.jpg",  // Required: publicly accessible URL
        "contentType": "image/jpeg" // Required: MIME type
      },
      {
        "type": "selfie",
        "fileUrl": "https://example.com/docs/selfie.jpg",
        "contentType": "image/jpeg"
      }
    ],
    "personalInfo": {               // Optional but recommended
      "firstName": "John",          // Required if personalInfo provided
      "lastName": "Doe",            // Required if personalInfo provided
      "dateOfBirth": "1990-01-01T00:00:00Z",  // Optional
      "country": "US",              // Required if personalInfo provided (2-letter ISO code)
      "address": {                  // Optional
        "street": "123 Main St",    // Required if address provided
        "city": "New York",         // Required if address provided
        "state": "NY",              // Optional
        "postalCode": "10001",      // Required if address provided
        "country": "US"             // Required if address provided (2-letter ISO code)
      }
    },
    "metadata": {                   // Optional: additional metadata
      "purpose": "standard_kyc"
    }
  }
- Expected responses:
  - 202 Accepted: KYC submission accepted and processing
    {
      "message": "KYC documents submitted successfully",
      "status": "processing",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "next_steps": [
        "Wait for KYC review",
        "You can continue using core features while verification completes",
        "KYC unlocks virtual accounts, cards, and fiat withdrawals"
      ]
    }
  - 400 Bad Request: validation errors
    {
      "code": "VALIDATION_ERROR",
      "message": "KYC request validation failed",
      "details": { "validation_errors": "..." }
    }
  - 401 Unauthorized: missing/invalid token
    {
      "code": "UNAUTHORIZED",
      "message": "User not authenticated"
    }
  - 403 Forbidden: user not eligible for KYC
    {
      "code": "KYC_NOT_ELIGIBLE",
      "message": "User is not eligible for KYC submission",
      "details": { "error": "Email not verified" }
    }
  - 500 Internal Server Error: submission failed
    {
      "code": "KYC_SUBMISSION_FAILED",
      "message": "Failed to submit KYC documents",
      "details": { "error": "Internal server error" }
    }
- Additional behavior:
  - Updates user's kyc_status to "processing".
  - Submits documents to configured KYC provider (e.g., Sumsub).
  - Creates KYC submission record in database.
- Test cases:
  - Complete valid payload with personalInfo → 202.
  - Valid payload without personalInfo → 202.
  - Missing required fields (documentType, documents) → 400.
  - Empty documents array → 400.
  - Invalid fileUrl format → 400.
  - User without verified email → 403.
  - Missing Bearer token → 401.

8) POST /api/v1/kyc/callback/:provider_ref
- Purpose: Process KYC provider callback (webhook) with verification results.
- Auth: None (external webhook endpoint)
- Path parameter: `provider_ref` - KYC provider's reference ID for the applicant
- Request structure (provider-specific, example for Sumsub):
  {
    "reviewResult": {
      "reviewAnswer": "GREEN",      // "GREEN" = approved, "RED" = rejected
      "rejectLabels": [              // Present if rejected
        {
          "code": "DOCUMENT_EXPIRED",
          "description": "Document has expired"
        }
      ]
    },
    "status": "approved"             // Alternative status field
  }
- Expected responses:
  - 200 OK: callback processed successfully
    {
      "message": "Callback processed successfully",
      "provider_ref": "abc123xyz",
      "status": "approved"
    }
  - 400 Bad Request: malformed callback payload
    {
      "code": "INVALID_CALLBACK",
      "message": "Invalid callback payload",
      "details": { "error": "..." }
    }
  - 404 Not Found: unknown provider_ref
  - 500 Internal Server Error: callback processing failed
    {
      "code": "CALLBACK_PROCESSING_FAILED",
      "message": "Failed to process KYC callback",
      "details": { "error": "Internal server error" }
    }
- Additional behavior:
  - Updates user's KYC status based on provider result.
  - If approved: may trigger wallet provisioning.
  - If rejected: stores rejection reasons for user visibility.
  - Creates audit log entry.
- Status mapping:
  - "GREEN" or "approved" → KYC approved
  - "RED" or "rejected" → KYC rejected
  - "pending" or "processing" → KYC still processing
- Test cases:
  - Valid "GREEN" callback → user KYC approved, wallet provisioning triggered.
  - Valid "RED" callback → user KYC rejected with reasons.
  - Invalid provider_ref → 404.
  - Malformed payload → 400.

## Passcode Management Endpoints

9) GET /api/v1/security/passcode
- Purpose: Get current passcode status for the authenticated user.
- Auth: Bearer JWT required (protected endpoint)
- Headers: `Authorization: Bearer <accessToken>`
- Request: `GET /api/v1/security/passcode`
- Expected responses:
  - 200 OK: passcode status retrieved
    {
      "enabled": true,
      "locked": false,
      "failedAttempts": 0,
      "remainingAttempts": 5,
      "lockedUntil": null,
      "updatedAt": "2025-10-23T10:00:00Z"
    }
  - 400 Bad Request: invalid user ID
    {
      "code": "INVALID_USER_ID",
      "message": "Invalid or missing user ID"
    }
  - 401 Unauthorized: missing/invalid token
  - 500 Internal Server Error: failed to retrieve status
    {
      "code": "PASSCODE_STATUS_ERROR",
      "message": "Failed to retrieve passcode status"
    }
- Response fields:
  - `enabled`: true if passcode is set, false otherwise
  - `locked`: true if account is locked due to failed attempts
  - `failedAttempts`: number of consecutive failed verification attempts
  - `remainingAttempts`: attempts left before account lock
  - `lockedUntil`: timestamp when lock expires (null if not locked)
  - `updatedAt`: last passcode update timestamp
- Test cases:
  - User with passcode → enabled: true.
  - User without passcode → enabled: false.
  - User with failed attempts → failedAttempts > 0, remainingAttempts < 5.
  - Locked user → locked: true, lockedUntil: timestamp.

10) POST /api/v1/security/passcode
- Purpose: Create a new 4-digit passcode for the user.
- Auth: Bearer JWT required (protected endpoint)
- Headers: `Authorization: Bearer <accessToken>`
- Request structure:
  {
    "passcode": "1234",           // Required: exactly 4 digits
    "confirmPasscode": "1234"     // Required: must match passcode
  }
- Expected responses:
  - 201 Created: passcode created successfully
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
  - 400 Bad Request: validation errors
    {
      "code": "INVALID_REQUEST",
      "message": "Passcode and confirmation are required"
    }
    OR
    {
      "code": "PASSCODE_MISMATCH",
      "message": "Passcode and confirmation must match"
    }
    OR
    {
      "code": "INVALID_PASSCODE_FORMAT",
      "message": "Passcode must be 4 digits."
    }
  - 401 Unauthorized: missing/invalid token
  - 409 Conflict: passcode already exists
    {
      "code": "PASSCODE_EXISTS",
      "message": "Passcode already configured. Use update endpoint instead."
    }
  - 500 Internal Server Error: creation failed
    {
      "code": "PASSCODE_SETUP_FAILED",
      "message": "Failed to configure passcode"
    }
- Additional behavior:
  - Hashes and stores passcode securely.
  - Marks "passcode_creation" step as completed in onboarding.
  - May trigger wallet provisioning after passcode creation.
- Passcode requirements:
  - Must be exactly 4 digits (0-9)
  - Passcode and confirmation must match
  - Cannot be set if already exists (use update instead)
- Test cases:
  - Valid 4-digit passcode → 201 with status.
  - Mismatched passcode and confirmation → 400 PASSCODE_MISMATCH.
  - Non-numeric passcode → 400 INVALID_PASSCODE_FORMAT.
  - Less than 4 digits → 400 INVALID_PASSCODE_FORMAT.
  - More than 4 digits → 400 INVALID_PASSCODE_FORMAT.
  - Already has passcode → 409 PASSCODE_EXISTS.

11) PUT /api/v1/security/passcode
- Purpose: Update/change existing passcode.
- Auth: Bearer JWT required (protected endpoint)
- Headers: `Authorization: Bearer <accessToken>`
- Request structure:
  {
    "currentPasscode": "1234",    // Required: current 4-digit passcode
    "newPasscode": "5678",        // Required: new 4-digit passcode
    "confirmPasscode": "5678"     // Required: must match newPasscode
  }
- Expected responses:
  - 200 OK: passcode updated successfully
    {
      "message": "Passcode updated successfully",
      "status": {
        "enabled": true,
        "locked": false,
        "failedAttempts": 0,
        "remainingAttempts": 5,
        "lockedUntil": null,
        "updatedAt": "2025-10-23T11:00:00Z"
      }
    }
  - 400 Bad Request: validation errors
    {
      "code": "PASSCODE_NOT_SET",
      "message": "No passcode configured yet."
    }
    OR
    {
      "code": "PASSCODE_MISMATCH",
      "message": "New passcode and confirmation must match"
    }
    OR
    {
      "code": "INVALID_PASSCODE_FORMAT",
      "message": "Passcode must be 4 digits."
    }
    OR
    {
      "code": "PASSCODE_UNCHANGED",
      "message": "New passcode must differ from the current one."
    }
  - 401 Unauthorized: incorrect current passcode or missing token
    {
      "code": "INVALID_PASSCODE",
      "message": "Current passcode is incorrect."
    }
  - 423 Locked: too many failed attempts
    {
      "code": "PASSCODE_LOCKED",
      "message": "Too many failed attempts. Please try again later."
    }
  - 500 Internal Server Error: update failed
    {
      "code": "PASSCODE_UPDATE_FAILED",
      "message": "Failed to update passcode"
    }
- Additional behavior:
  - Verifies current passcode before allowing update.
  - Increments failed attempts on incorrect current passcode.
  - Locks account after 5 failed attempts (typically 15-30 min lockout).
  - Resets failed attempts counter on successful update.
- Test cases:
  - Valid update with correct current passcode → 200.
  - Incorrect current passcode → 401 INVALID_PASSCODE.
  - New passcode same as current → 400 PASSCODE_UNCHANGED.
  - Mismatched new passcode and confirmation → 400 PASSCODE_MISMATCH.
  - User without existing passcode → 400 PASSCODE_NOT_SET.
  - Account locked from failed attempts → 423 PASSCODE_LOCKED.

12) POST /api/v1/security/passcode/verify
- Purpose: Verify passcode and issue a short-lived session token.
- Auth: Bearer JWT required (protected endpoint)
- Headers: `Authorization: Bearer <accessToken>`
- Request structure:
  {
    "passcode": "1234"            // Required: 4-digit passcode
  }
- Expected responses:
  - 200 OK: passcode verified, session token issued
    {
      "verified": true,
      "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "2025-10-23T10:15:00Z"
    }
  - 400 Bad Request: no passcode configured
    {
      "code": "PASSCODE_NOT_SET",
      "message": "No passcode configured yet."
    }
  - 401 Unauthorized: incorrect passcode or missing token
    {
      "code": "INVALID_PASSCODE",
      "message": "Passcode verification failed."
    }
  - 423 Locked: account locked due to failed attempts
    {
      "code": "PASSCODE_LOCKED",
      "message": "Too many failed attempts. Please try again later."
    }
  - 500 Internal Server Error: verification failed
    {
      "code": "PASSCODE_VERIFY_FAILED",
      "message": "Failed to verify passcode"
    }
- Additional behavior:
  - Increments failed attempts counter on incorrect passcode.
  - Locks account after 5 consecutive failed attempts.
  - Resets failed attempts counter on successful verification.
  - Issues short-lived session token (typically 15 minutes) for sensitive operations.
  - Session token can be used for operations requiring additional security (e.g., wallet operations, withdrawals).
- Session token usage:
  - Include in `X-Passcode-Session` header for sensitive operations.
  - Short TTL for security (typically 15 minutes).
  - Single-use or limited-use depending on configuration.
- Test cases:
  - Correct passcode → 200 with session token.
  - Incorrect passcode → 401, failed attempts incremented.
  - 5 incorrect attempts → account locked, 423 response.
  - User without passcode → 400 PASSCODE_NOT_SET.
  - Locked account → 423 PASSCODE_LOCKED.

13) DELETE /api/v1/security/passcode
- Purpose: Remove/disable passcode for the user.
- Auth: Bearer JWT required (protected endpoint)
- Headers: `Authorization: Bearer <accessToken>`
- Request structure:
  {
    "passcode": "1234"            // Required: current 4-digit passcode for confirmation
  }
- Expected responses:
  - 200 OK: passcode removed successfully
    {
      "message": "Passcode removed successfully",
      "status": {
        "enabled": false,
        "locked": false,
        "failedAttempts": 0,
        "remainingAttempts": 5,
        "lockedUntil": null,
        "updatedAt": "2025-10-23T12:00:00Z"
      }
    }
  - 400 Bad Request: no passcode configured
    {
      "code": "PASSCODE_NOT_SET",
      "message": "No passcode configured yet."
    }
  - 401 Unauthorized: incorrect passcode or missing token
    {
      "code": "INVALID_PASSCODE",
      "message": "Passcode verification failed."
    }
  - 423 Locked: account locked due to failed attempts
    {
      "code": "PASSCODE_LOCKED",
      "message": "Too many failed attempts. Please try again later."
    }
  - 500 Internal Server Error: removal failed
    {
      "code": "PASSCODE_REMOVE_FAILED",
      "message": "Failed to remove passcode"
    }
- Additional behavior:
  - Requires correct passcode for security confirmation.
  - Increments failed attempts on incorrect passcode.
  - Clears all passcode-related data from database.
  - May impact access to certain features that require passcode.
- Test cases:
  - Correct passcode → 200, passcode disabled.
  - Incorrect passcode → 401, failed attempts incremented.
  - User without passcode → 400 PASSCODE_NOT_SET.
  - Locked account → 423 PASSCODE_LOCKED.

Onboarding Flow Documentation

User Journey Steps
1. **Registration**: create account using `POST /api/v1/auth/register` with email/phone and password.
2. **Email Verification**: complete email verification with `POST /api/v1/auth/verify-code` using 6-digit code.
3. **Login** (optional if coming from verify-code): authenticate with `POST /api/v1/auth/login`.
4. **Passcode Creation**: set up 4-digit passcode with `POST /api/v1/security/passcode` (REQUIRED before wallet creation).
5. **Wallet Provisioning**: wallets automatically provisioned after passcode creation.
6. **Submit KYC** (optional but recommended): `POST /api/v1/onboarding/kyc/submit` with documents and personal info.
7. **KYC Review**: KYC provider calls `/api/v1/kyc/callback/:provider_ref` with decision.
8. **Check Status**: monitor progress via `GET /api/v1/onboarding/status`.
9. **Completion**: onboarding status reaches `completed`; user can fund, invest, and access all features.

Complete Onboarding Flow (Happy Path)
1. `POST /api/v1/auth/register`
   - Body: `{ "email": "user@example.com", "password": "SecurePass123!" }`
   - Response: 202 Accepted with verification message
   
2. Check email for 6-digit verification code

3. `POST /api/v1/auth/verify-code`
   - Body: `{ "email": "user@example.com", "code": "123456" }`
   - Response: 200 OK with user info and JWT tokens
   - **Save**: `accessToken` and `refreshToken` for subsequent requests
   
4. `GET /api/v1/onboarding/status`
   - Headers: `Authorization: Bearer <accessToken>`
   - Response: 200 OK with onboarding status
   - Check: `completedSteps` should include "email_verification"
   - Check: `currentStep` should be "passcode_creation"
   - Check: `requiredActions` for next steps
   
5. `POST /api/v1/security/passcode`
   - Headers: `Authorization: Bearer <accessToken>`
   - Body: `{ "passcode": "1234", "confirmPasscode": "1234" }`
   - Response: 201 Created with passcode status
   - **Important**: This triggers automatic wallet provisioning
   
6. `GET /api/v1/onboarding/status` (check wallet provisioning)
   - Headers: `Authorization: Bearer <accessToken>`
   - Response: 200 OK
   - Check: `completedSteps` should include "passcode_creation"
   - Check: `walletStatus` should show wallet creation progress
   - Wallets are created for: ethereum-sepolia, polygon-amoy, base-sepolia (testnets)
   
7. `POST /api/v1/onboarding/kyc/submit` (optional, when ready)
   - Headers: `Authorization: Bearer <accessToken>`
   - Body: KYC documents and personal info (see endpoint 7 above)
   - Response: 202 Accepted
   
8. Wait for KYC provider webhook callback
   - `POST /api/v1/kyc/callback/:provider_ref` (automatic, from provider)
   - Updates user's KYC status to "approved" or "rejected"
   
9. `GET /api/v1/onboarding/status` (final check)
   - Headers: `Authorization: Bearer <accessToken>`
   - Response: 200 OK
   - Check: `onboardingStatus` should be "completed"
   - Check: `kycStatus` shows KYC result
   - Check: `walletStatus.createdWallets` should equal `totalWallets`

Alternative Flow: Login After Registration
1. `POST /api/v1/auth/register` → 202
2. `POST /api/v1/auth/verify-code` → 200 with tokens
3. *User logs out or session expires*
4. `POST /api/v1/auth/login`
   - Body: `{ "email": "user@example.com", "password": "SecurePass123!" }`
   - Response: 200 OK with user info and fresh JWT tokens
5. Continue from step 4 above (passcode creation)

Required Inputs per Stage
- **Register**: `email` OR `phone` (not both), `password` (min 8 chars).
- **Verify-code**: `email` OR `phone` (matching registration), `code` (6 digits).
- **Login**: `email`, `password`.
- **Passcode Creation**: `passcode` (4 digits), `confirmPasscode` (must match).
- **Passcode Update**: `currentPasscode`, `newPasscode` (4 digits), `confirmPasscode`.
- **Passcode Verify**: `passcode` (4 digits).
- **Passcode Remove**: `passcode` (current, for confirmation).
- **Onboarding-start**: `email` (required), `phone` (optional, E.164).
- **KYC-submit**: `documentType`, `documents[]` (min 1), optional `personalInfo`, optional `metadata`.
- **KYC Callback**: `status` or `reviewResult` with `reviewAnswer`.

Success/Failure States

Onboarding Status Progression:
- `started` → User registered, email not yet verified
- `wallets_pending` → Email verified, waiting for passcode and wallet creation
- `kyc_pending` → KYC submission pending or in review
- `kyc_approved` → KYC approved by provider
- `kyc_rejected` → KYC rejected, can retry
- `completed` → All onboarding steps complete, full access granted

KYC Status:
- `pending` → Initial state, no submission yet
- `processing` → Documents submitted and under review
- `approved` → KYC approved by provider
- `rejected` → KYC rejected (with reasons)
- `expired` → KYC expired, needs resubmission

Onboarding Steps:
- `registration` → User account created
- `email_verification` → Email verified with code
- `phone_verification` → Phone verified (optional)
- `passcode_creation` → 4-digit passcode set up
- `kyc_submission` → KYC documents submitted
- `kyc_review` → KYC under provider review
- `wallet_creation` → Wallets provisioned on supported chains
- `completed` → All steps complete

Step Status:
- `pending` → Step not yet started
- `in_progress` → Step currently active
- `completed` → Step successfully completed
- `failed` → Step failed (with error)
- `skipped` → Step skipped (optional)

Wallet Status:
- Per-chain status in `walletStatus.walletsByChain`
- `pending` → Wallet creation queued
- `creating` → Wallet being created
- `active` → Wallet created and ready
- `failed` → Wallet creation failed (check logs)

Passcode Status:
- `enabled: true/false` → Whether passcode is configured
- `locked: true/false` → Whether account is locked due to failed attempts
- `failedAttempts` → Number of consecutive failed verifications (0-5)
- `remainingAttempts` → Attempts remaining before lock (5 max)
- `lockedUntil` → Timestamp when lock expires (null if not locked)

Handling Procedures:
- **KYC Rejected**: 
  - Surface rejection reasons from `requiredActions`
  - Allow resubmission via `POST /api/v1/onboarding/kyc/submit`
  - User can continue using core features (wallets) without KYC
- **Transient Failures**: 
  - Retry submission automatically or manually
  - Check `requiredActions` for specific guidance
  - Contact support if persistent
- **Wallet Failures**: 
  - Automatic retry via background provisioning job
  - Check `walletStatus` for per-chain status
  - Admin can trigger manual retry via admin endpoints
- **Passcode Locked**: 
  - Wait for `lockedUntil` timestamp to expire (typically 15-30 minutes)
  - Cannot verify, update, or remove passcode while locked
  - Lock automatically expires after timeout
- **Token Expiration**: 
  - Use `POST /api/v1/auth/refresh` with refreshToken to get new accessToken
  - If refreshToken expired, user must login again

Code Examples

JavaScript (fetch)
// 1. Register
const registerRes = await fetch('/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'user@example.com', 
    password: 'StrongP@ssw0rd!' 
  })
});
const registerData = await registerRes.json();
// Response: { message: "Verification code sent...", identifier: "user@example.com" }

// 2. Verify email code (get this from email)
const verifyRes = await fetch('/api/v1/auth/verify-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'user@example.com', 
    code: '123456' 
  })
});
const verifyData = await verifyRes.json();
const { accessToken, refreshToken, user } = verifyData;
// Save tokens for subsequent requests

// 3. Check onboarding status
const statusRes = await fetch('/api/v1/onboarding/status', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
const status = await statusRes.json();
console.log('Current step:', status.currentStep); // "passcode_creation"
console.log('Required actions:', status.requiredActions);

// 4. Create passcode (REQUIRED before wallets)
const passcodeRes = await fetch('/api/v1/security/passcode', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}` 
  },
  body: JSON.stringify({ 
    passcode: '1234', 
    confirmPasscode: '1234' 
  })
});
const passcodeData = await passcodeRes.json();
// Response: { message: "Passcode created successfully", status: {...} }

// 5. Check status again (wallets should be provisioning)
const status2Res = await fetch('/api/v1/onboarding/status', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
const status2 = await status2Res.json();
console.log('Wallet status:', status2.walletStatus);

// 6. Submit KYC (optional, when ready)
const kycRes = await fetch('/api/v1/onboarding/kyc/submit', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}` 
  },
  body: JSON.stringify({
    documentType: 'passport',
    documents: [
      { 
        type: 'id_front', 
        fileUrl: 'https://example.com/docs/id_front.jpg', 
        contentType: 'image/jpeg' 
      },
      { 
        type: 'selfie', 
        fileUrl: 'https://example.com/docs/selfie.jpg', 
        contentType: 'image/jpeg' 
      }
    ],
    personalInfo: {
      firstName: 'John', 
      lastName: 'Doe', 
      dateOfBirth: '1990-01-01T00:00:00Z', 
      country: 'US',
      address: { 
        street: '123 Main St', 
        city: 'New York', 
        postalCode: '10001', 
        country: 'US' 
      }
    }
  })
});

// 7. Verify passcode for sensitive operations
const verifyPasscodeRes = await fetch('/api/v1/security/passcode/verify', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}` 
  },
  body: JSON.stringify({ passcode: '1234' })
});
const { sessionToken, expiresAt } = await verifyPasscodeRes.json();
// Use sessionToken in X-Passcode-Session header for sensitive operations

// 8. Refresh token when expired
const refreshRes = await fetch('/api/v1/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken })
});
const newTokens = await refreshRes.json();
// Update stored tokens

Python (requests)
import requests

base = 'http://localhost:8080'
headers = { 'Content-Type': 'application/json' }

# 1. Register
register_res = requests.post(f'{base}/api/v1/auth/register', json={
    'email': 'user@example.com', 
    'password': 'StrongP@ssw0rd!'
}, headers=headers)
print(register_res.json())  # { "message": "Verification code sent...", "identifier": "..." }

# 2. Verify email code (get from email)
verify_res = requests.post(f'{base}/api/v1/auth/verify-code', json={
    'email': 'user@example.com',
    'code': '123456'
}, headers=headers)
verify_data = verify_res.json()
access_token = verify_data['accessToken']
refresh_token = verify_data['refreshToken']
user = verify_data['user']
print(f"User ID: {user['id']}, Email verified: {user['emailVerified']}")

# Setup auth headers
auth_headers = {
    'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json'
}

# 3. Check onboarding status
status_res = requests.get(f'{base}/api/v1/onboarding/status', headers=auth_headers)
status = status_res.json()
print(f"Current step: {status['currentStep']}")  # "passcode_creation"
print(f"Required actions: {status['requiredActions']}")

# 4. Create passcode (REQUIRED)
passcode_res = requests.post(f'{base}/api/v1/security/passcode', json={
    'passcode': '1234',
    'confirmPasscode': '1234'
}, headers=auth_headers)
passcode_data = passcode_res.json()
print(passcode_data['message'])  # "Passcode created successfully"

# 5. Check status again (wallets provisioning)
status2_res = requests.get(f'{base}/api/v1/onboarding/status', headers=auth_headers)
status2 = status2_res.json()
print(f"Completed steps: {status2['completedSteps']}")
print(f"Wallet status: {status2['walletStatus']}")

# 6. Submit KYC (optional)
kyc_res = requests.post(f'{base}/api/v1/onboarding/kyc/submit', json={
    'documentType': 'passport',
    'documents': [
        {
            'type': 'id_front',
            'fileUrl': 'https://example.com/docs/id_front.jpg',
            'contentType': 'image/jpeg'
        },
        {
            'type': 'selfie',
            'fileUrl': 'https://example.com/docs/selfie.jpg',
            'contentType': 'image/jpeg'
        }
    ],
    'personalInfo': {
        'firstName': 'John',
        'lastName': 'Doe',
        'dateOfBirth': '1990-01-01T00:00:00Z',
        'country': 'US',
        'address': {
            'street': '123 Main St',
            'city': 'New York',
            'postalCode': '10001',
            'country': 'US'
        }
    }
}, headers=auth_headers)
print(kyc_res.json())

# 7. Verify passcode for sensitive operations
verify_passcode_res = requests.post(f'{base}/api/v1/security/passcode/verify', json={
    'passcode': '1234'
}, headers=auth_headers)
passcode_session = verify_passcode_res.json()
session_token = passcode_session['sessionToken']
# Use session_token in X-Passcode-Session header for sensitive operations

# 8. Refresh token when expired
refresh_res = requests.post(f'{base}/api/v1/auth/refresh', json={
    'refreshToken': refresh_token
}, headers=headers)
new_tokens = refresh_res.json()
access_token = new_tokens['accessToken']  # Update token

Expected Response Examples

Register (202 Accepted):
{
  "message": "Verification code sent to user@example.com. Please verify your account.",
  "identifier": "user@example.com"
}

Verify Code (200 OK):
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "phone": null,
    "emailVerified": true,
    "phoneVerified": false,
    "onboardingStatus": "wallets_pending",
    "kycStatus": "processing",
    "createdAt": "2025-10-23T10:00:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-10-23T18:00:00Z"
}

Login (200 OK):
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "phone": null,
    "emailVerified": true,
    "phoneVerified": false,
    "onboardingStatus": "wallets_pending",
    "kycStatus": "processing",
    "createdAt": "2025-10-23T10:00:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-10-23T18:00:00Z"
}

Passcode Status (200 OK):
{
  "enabled": true,
  "locked": false,
  "failedAttempts": 0,
  "remainingAttempts": 5,
  "lockedUntil": null,
  "updatedAt": "2025-10-23T10:00:00Z"
}

Passcode Create (201 Created):
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

Passcode Verify (200 OK):
{
  "verified": true,
  "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-10-23T10:15:00Z"
}

Onboarding Status (200 OK):
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "onboardingStatus": "wallets_pending",
  "kycStatus": "processing",
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
  "requiredActions": [
    "Create a 4-digit passcode to secure your account",
    "Complete wallet setup"
  ]
}

KYC Submit (202 Accepted):
{
  "message": "KYC documents submitted successfully",
  "status": "processing",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "next_steps": [
    "Wait for KYC review",
    "You can continue using core features while verification completes",
    "KYC unlocks virtual accounts, cards, and fiat withdrawals"
  ]
}

Error Handling Scenarios

Authentication Errors:
- Missing token on protected endpoints → `401 Unauthorized` with `UNAUTHORIZED`
- Invalid/expired JWT token → `401 Unauthorized` with `INVALID_TOKEN`
- Invalid credentials (login) → `401 Unauthorized` with `INVALID_CREDENTIALS`
- Account inactive → `401 Unauthorized` with `ACCOUNT_INACTIVE`
- Token generation failed → `500 Internal Server Error` with `TOKEN_GENERATION_FAILED`

Validation Errors:
- Invalid email format → `400 Bad Request` with `VALIDATION_ERROR`
- Invalid phone format (not E.164) → `400 Bad Request` with `VALIDATION_ERROR`
- Missing required fields → `400 Bad Request` with `INVALID_REQUEST` or `VALIDATION_ERROR`
- Invalid UUID format → `400 Bad Request` with `INVALID_USER_ID`
- Weak password (< 8 chars) → `400 Bad Request`

Registration & Verification Errors:
- Both email and phone provided → `400 Bad Request` with `VALIDATION_ERROR`
- Neither email nor phone provided → `400 Bad Request` with `VALIDATION_ERROR`
- User already exists (verified) → `409 Conflict` with `USER_EXISTS`
- Invalid verification code → `401 Unauthorized` with `INVALID_CODE`
- Code expired → `401 Unauthorized` with `INVALID_CODE`
- Too many resend attempts → `429 Too Many Requests` with `TOO_MANY_REQUESTS`
- Verification send failed → `500 Internal Server Error` with `VERIFICATION_SEND_FAILED`

Passcode Errors:
- Passcode not set → `400 Bad Request` with `PASSCODE_NOT_SET`
- Passcode already exists → `409 Conflict` with `PASSCODE_EXISTS`
- Passcode mismatch (setup/update) → `400 Bad Request` with `PASSCODE_MISMATCH`
- Invalid passcode format (not 4 digits) → `400 Bad Request` with `INVALID_PASSCODE_FORMAT`
- Incorrect passcode (verify/update) → `401 Unauthorized` with `INVALID_PASSCODE`
- New passcode same as current → `400 Bad Request` with `PASSCODE_UNCHANGED`
- Account locked (failed attempts) → `423 Locked` with `PASSCODE_LOCKED`
- Passcode operation failed → `500 Internal Server Error` with `PASSCODE_*_FAILED`

Onboarding Errors:
- User not found → `404 Not Found` with `USER_NOT_FOUND`
- User inactive → `403 Forbidden` with `USER_INACTIVE`
- Onboarding start failed → `500 Internal Server Error` with `ONBOARDING_FAILED`
- Status retrieval failed → `500 Internal Server Error` with `STATUS_RETRIEVAL_FAILED`

KYC Errors:
- Not eligible for KYC (email not verified) → `403 Forbidden` with `KYC_NOT_ELIGIBLE`
- KYC submission validation failed → `400 Bad Request` with `VALIDATION_ERROR`
- KYC submission failed → `500 Internal Server Error` with `KYC_SUBMISSION_FAILED`
- Malformed KYC callback → `400 Bad Request` with `INVALID_CALLBACK`
- Unknown provider_ref in callback → `404 Not Found`
- Callback processing failed → `500 Internal Server Error` with `CALLBACK_PROCESSING_FAILED`

Conflict Errors:
- Duplicate registration (verified user) → `409 Conflict` with `USER_EXISTS`
- Passcode already configured → `409 Conflict` with `PASSCODE_EXISTS`

Rate Limiting:
- Too many verification code requests → `429 Too Many Requests` with `TOO_MANY_REQUESTS`
- Too many login attempts → `429 Too Many Requests` (if configured)
- Too many passcode attempts → Account locked with `423 Locked` and `PASSCODE_LOCKED`

Common Error Response Format:
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    // Optional additional context
  }
}

Troubleshooting

Common Issues:
1. **401 Unauthorized on protected endpoints**
   - Verify JWT token is included in `Authorization: Bearer <token>` header
   - Check token hasn't expired (use refresh token to get new access token)
   - Ensure token was obtained from `/auth/login` or `/auth/verify-code`

2. **400 Bad Request errors**
   - Verify request payload matches expected structure
   - Check field types (string vs number, etc.)
   - Ensure email format is valid
   - Ensure phone format is E.164 (e.g., +1234567890)
   - Validate UUIDs are properly formatted

3. **Verification code not received**
   - Check spam/junk folder for email
   - Verify email service is configured correctly in server
   - Check server logs for email sending errors
   - Try resend-code endpoint (rate limited)

4. **Passcode locked**
   - Wait for lock timeout (check `lockedUntil` timestamp)
   - Typically 15-30 minutes
   - Cannot perform any passcode operations while locked

5. **Wallets not provisioning**
   - Verify passcode was created successfully
   - Check onboarding status endpoint for wallet creation status
   - Review server logs for wallet provisioning job errors
   - Admin can trigger manual retry if needed

6. **KYC submission fails**
   - Ensure email is verified first (check user.emailVerified)
   - Verify document URLs are publicly accessible
   - Check document format and size requirements
   - Review KYC provider logs for specific errors

7. **Token refresh fails**
   - Refresh token may have expired (require re-login)
   - Verify refresh token is valid JWT format
   - Check server-side refresh token TTL configuration

Debug Steps:
1. Enable verbose logging on server
2. Check `request_id` in error responses and correlate with server logs
3. Verify database migrations are applied correctly
4. Test endpoints in sequence (don't skip steps)
5. Verify DI container wiring for handlers and services
6. Check Redis connectivity for verification codes and rate limiting
7. Validate route registration in `internal/api/routes/routes.go`

References

Code Files:
- `internal/api/routes/routes.go` — All route definitions and middleware setup
- `internal/api/handlers/auth_signup_handlers.go` — Registration, verification, resend code handlers
- `internal/api/handlers/onboarding_handlers.go` — Onboarding status, KYC submission, callbacks
- `internal/api/handlers/security_handlers.go` — Passcode management handlers
- `internal/domain/services/onboarding/service.go` — Onboarding business logic
- `internal/domain/services/passcode/service.go` — Passcode service with rate limiting
- `internal/domain/entities/auth_entities.go` — Auth request/response types
- `internal/domain/entities/onboarding_entities.go` — Onboarding types and response models
- `internal/domain/entities/security_entities.go` — Passcode request/response types

Database:
- `migrations/` — All database migration files
- Required tables: `users`, `onboarding_flows`, `kyc_submissions`, `wallets`, `onboarding_jobs`
- Passcode stored in `users.passcode_hash` with `passcode_failed_attempts` and `passcode_locked_until`

Key Points for Frontend Integration:
1. **Token Management**: Store `accessToken` and `refreshToken` securely; refresh before expiration
2. **Passcode Required**: Cannot proceed with wallet operations without passcode creation
3. **Status Polling**: Use `/onboarding/status` to track progress and show appropriate UI
4. **Error Codes**: Handle specific error codes for better UX (e.g., show "already verified" vs "code expired")
5. **Field Validation**: Validate email format and phone E.164 format client-side before submission
6. **Passcode Security**: Show remaining attempts, lock status, and lockout timer in UI
7. **KYC Optional**: Wallets work without KYC; KYC unlocks premium features
8. **Email or Phone**: Registration accepts either email OR phone, not both
9. **Onboarding Steps**: Follow the sequence: register → verify → passcode → wallets → (optional) KYC
10. **Request IDs**: Log request IDs from responses for debugging and support tickets

API Base URL:
- Development: `http://localhost:8080`
- Production: (use appropriate production URL)

Security Notes:
- All sensitive operations require JWT authentication
- Passcode verification issues short-lived session token (15 min)
- Account locked after 5 failed passcode attempts (15-30 min lockout)
- Verification codes expire (check expiry in verification response)
- Rate limiting enforced on verification code resend
- All passwords must be min 8 characters
- Passcodes must be exactly 4 digits
- JWTs have TTL (access token: ~8h, refresh token: ~7 days - check config)
