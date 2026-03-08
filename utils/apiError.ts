import type { TransformedApiError } from '@/api/types';

/**
 * Maps backend error codes to user-friendly messages.
 * Keep in sync with backend common/errors.go error codes.
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Auth
  UNAUTHORIZED: 'Please log in to continue.',
  INVALID_CREDENTIALS: 'Incorrect email or password.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  ACCOUNT_INACTIVE: 'Your account is inactive. Please contact support.',
  PASSCODE_SESSION_REQUIRED: 'Please verify your PIN to continue.',
  PASSCODE_SESSION_INVALID: 'Authorization expired. Please verify your PIN again.',
  INVALID_PASSCODE_FORMAT: 'Invalid PIN format.',
  PASSCODE_LOCKED: 'Too many failed attempts. Please try again later.',

  // Withdrawal
  INSUFFICIENT_FUNDS: 'Insufficient balance for this withdrawal.',
  INVALID_AMOUNT: 'Minimum withdrawal is $1.00.',
  LIMIT_EXCEEDED: 'Withdrawal limit exceeded. Please try a smaller amount.',
  TRANSFER_FAILED: 'Transfer failed. Please try again.',
  WITHDRAWAL_ERROR: 'Withdrawal could not be processed. Please try again.',
  NO_WALLET: 'No wallet found for your account. Please contact support.',
  PROVIDER_NOT_CONFIGURED: 'Withdrawal service is temporarily unavailable.',
  BANK_ACCOUNT_ERROR: 'There was an issue with your bank account details.',
  BANK_ACCOUNT_NOT_VERIFIED: 'Your bank account must be verified before withdrawing.',
  CURRENCY_MISMATCH: 'Currency mismatch. Please check your account details.',

  // Validation
  INVALID_REQUEST: 'Invalid request. Please check your input.',
  VALIDATION_ERROR: 'Please check your input and try again.',

  // Network
  NETWORK_ERROR: 'No internet connection. Please check your network.',
  NETWORK_TIMEOUT: 'Request timed out. Please try again.',

  // Generic
  INTERNAL_ERROR: 'Something went wrong on our end. Please try again.',
  SERVICE_UNAVAILABLE: 'Service is temporarily unavailable. Please try again later.',
};

/**
 * Extracts a user-friendly error message from any error shape.
 * Handles TransformedApiError, plain Error, and unknown values.
 */
export function parseApiError(
  err: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  if (!err) return fallback;

  // TransformedApiError (from api/client.ts transformError)
  const e = err as Partial<TransformedApiError>;
  if (e.code && e.message) {
    // Prefer mapped user-friendly message, fall back to server message
    return ERROR_MESSAGES[e.code] ?? e.message;
  }

  // Plain Error
  if (err instanceof Error) return err.message || fallback;

  // String
  if (typeof err === 'string') return err || fallback;

  return fallback;
}

/**
 * Returns true if the error is a passcode/session auth error.
 */
export function isPasscodeSessionError(err: unknown): boolean {
  const e = err as Partial<TransformedApiError>;
  return (
    e.code === 'PASSCODE_SESSION_REQUIRED' ||
    e.code === 'PASSCODE_SESSION_INVALID' ||
    e.status === 403
  );
}
