/**
 * Input Validator
 * SECURITY: Provides validation for sensitive user inputs to prevent injection attacks
 * and malicious payloads
 */

export interface ValidationResult {
  isValid: boolean;
  sanitized: string;
  errors: string[];
}

/**
 * Validate and sanitize email input
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email) {
    errors.push('Email is required');
  }

  const sanitized = email.trim().toLowerCase();

  // RFC 5322 simplified regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    errors.push('Invalid email format');
  }

  // Prevent excessively long emails (max 254 chars per RFC)
  if (sanitized.length > 254) {
    errors.push('Email is too long');
  }

  // Prevent injection attempts
  if (
    sanitized.includes('<') ||
    sanitized.includes('>') ||
    sanitized.includes('"') ||
    sanitized.includes("'")
  ) {
    errors.push('Email contains invalid characters');
  }

  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
  };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (password.length > 128) {
    errors.push('Password is too long');
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for at least one digit
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one digit');
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    sanitized: password, // Don't modify password, only validate
    errors,
  };
}

/**
 * Validate device ID format (alphanumeric + dash/underscore)
 */
export function validateDeviceId(deviceId: string): ValidationResult {
  const errors: string[] = [];

  if (!deviceId) {
    errors.push('Device ID is required');
  }

  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(deviceId)) {
    errors.push('Device ID contains invalid characters');
  }

  return {
    isValid: errors.length === 0,
    sanitized: deviceId,
    errors,
  };
}

/**
 * Validate URL path parameter (prevent traversal attacks)
 */
export function validateUrlParameter(param: string, maxLength: number = 100): ValidationResult {
  const errors: string[] = [];

  if (!param) {
    errors.push('Parameter is required');
  }

  // Prevent path traversal
  if (param.includes('..') || param.includes('//') || param.includes('\\')) {
    errors.push('Parameter contains invalid path characters');
  }

  // Prevent special characters that could break URL
  if (!/^[a-zA-Z0-9_-]+$/.test(param)) {
    errors.push('Parameter contains invalid characters');
  }

  if (param.length > maxLength) {
    errors.push(`Parameter exceeds maximum length of ${maxLength}`);
  }

  return {
    isValid: errors.length === 0,
    sanitized: param,
    errors,
  };
}

/**
 * Validate phone number (basic validation)
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  const errors: string[] = [];

  if (!phone) {
    errors.push('Phone number is required');
  }

  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-()\.]/g, '');

  // Should be 7-15 digits (E.164 standard)
  if (!/^\d{7,15}$/.test(cleaned)) {
    errors.push('Phone number must contain between 7 and 15 digits');
  }

  return {
    isValid: errors.length === 0,
    sanitized: cleaned,
    errors,
  };
}

/**
 * Generic string validator with configurable rules
 */
export function validateString(
  value: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    allowedCharacters?: string; // regex character class
  } = {}
): ValidationResult {
  const errors: string[] = [];

  if (options.required && !value) {
    errors.push('Value is required');
  }

  if (options.minLength && value.length < options.minLength) {
    errors.push(`Value must be at least ${options.minLength} characters`);
  }

  if (options.maxLength && value.length > options.maxLength) {
    errors.push(`Value must not exceed ${options.maxLength} characters`);
  }

  if (options.pattern && !options.pattern.test(value)) {
    errors.push('Value does not match required pattern');
  }

  if (options.allowedCharacters) {
    const regex = new RegExp(`^[${options.allowedCharacters}]*$`);
    if (!regex.test(value)) {
      errors.push('Value contains invalid characters');
    }
  }

  return {
    isValid: errors.length === 0,
    sanitized: value,
    errors,
  };
}
