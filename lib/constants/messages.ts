export const ERROR_MESSAGES = {
  AUTH: {
    LOGIN_FAILED: 'Login failed. Please check your credentials.',
    REGISTRATION_FAILED: 'Registration failed. Please try again.',
    SESSION_EXPIRED: 'Your session has expired. Please log in again.',
    INVALID_CREDENTIALS: 'Invalid email or password.',
    ACCOUNT_LOCKED: 'Account locked. Try again later.',
  },
  WALLET: {
    INSUFFICIENT_BALANCE: 'Insufficient balance',
    INVALID_ADDRESS: 'Invalid wallet address',
    TRANSFER_FAILED: 'Transaction failed. Please try again.',
    LOAD_FAILED: 'Unable to load wallet balance',
  },
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email',
    INVALID_AMOUNT: 'Please enter a valid amount',
    MIN_PASSWORD_LENGTH: 'Password must be at least 8 characters',
  },
  NETWORK: {
    NO_CONNECTION: 'No internet connection',
    REQUEST_TIMEOUT: 'Request timed out. Please try again.',
    SERVER_ERROR: 'Server error. Please try again later.',
  },
};

export const SUCCESS_MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: 'Welcome back!',
    REGISTRATION_SUCCESS: 'Account created successfully',
    LOGOUT_SUCCESS: 'Logged out successfully',
  },
  WALLET: {
    TRANSFER_SUCCESS: 'Transfer completed successfully',
    DEPOSIT_SUCCESS: 'Deposit received',
  },
};
