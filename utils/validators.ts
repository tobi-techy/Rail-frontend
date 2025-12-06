/**
 * Input Validation Utilities
 * Centralized validation functions for consistent input validation
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Email validation
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
}

/**
 * Password validation
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  return { isValid: true };
}

/**
 * Passcode validation (4 or 6 digits)
 */
export function validatePasscode(passcode: string, length: number = 4): ValidationResult {
  if (!passcode) {
    return { isValid: false, error: 'Passcode is required' };
  }

  if (passcode.length !== length) {
    return { isValid: false, error: `Passcode must be ${length} digits` };
  }

  if (!/^\d+$/.test(passcode)) {
    return { isValid: false, error: 'Passcode must contain only numbers' };
  }

  return { isValid: true };
}

/**
 * Phone number validation
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  if (!phone) {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');

  if (digitsOnly.length < 10) {
    return { isValid: false, error: 'Please enter a valid phone number' };
  }

  return { isValid: true };
}

/**
 * Amount validation
 */
export function validateAmount(amount: string | number, min: number = 0, max?: number): ValidationResult {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Please enter a valid amount' };
  }

  if (numAmount <= min) {
    return { isValid: false, error: `Amount must be greater than ${min}` };
  }

  if (max !== undefined && numAmount > max) {
    return { isValid: false, error: `Amount must be less than ${max}` };
  }

  return { isValid: true };
}

/**
 * Name validation
 */
export function validateName(name: string): ValidationResult {
  if (!name) {
    return { isValid: false, error: 'Name is required' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }

  if (!/^[a-zA-Z\s'-]+$/.test(name)) {
    return { isValid: false, error: 'Name contains invalid characters' };
  }

  return { isValid: true };
}

/**
 * Wallet address validation (basic)
 */
export function validateWalletAddress(address: string, network: 'ethereum' | 'solana' = 'ethereum'): ValidationResult {
  if (!address) {
    return { isValid: false, error: 'Wallet address is required' };
  }

  if (network === 'ethereum') {
    // Ethereum address validation (0x + 40 hex characters)
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return { isValid: false, error: 'Invalid Ethereum address' };
    }
  } else if (network === 'solana') {
    // Solana address validation (base58, 32-44 characters)
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
      return { isValid: false, error: 'Invalid Solana address' };
    }
  }

  return { isValid: true };
}

/**
 * Verification code validation
 */
export function validateVerificationCode(code: string, length: number = 6): ValidationResult {
  if (!code) {
    return { isValid: false, error: 'Verification code is required' };
  }

  if (code.length !== length) {
    return { isValid: false, error: `Verification code must be ${length} digits` };
  }

  if (!/^\d+$/.test(code)) {
    return { isValid: false, error: 'Verification code must contain only numbers' };
  }

  return { isValid: true };
}
