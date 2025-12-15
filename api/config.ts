import { env, isDev } from '../utils/env';

export const API_CONFIG = {
  baseURL: env.EXPO_PUBLIC_API_URL,
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
} as const;

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY_EMAIL: '/auth/verify-email',
    VERIFY_CODE: '/auth/verify-code',
    RESEND_CODE: '/auth/resend-code',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  WALLET: {
    BALANCE: '/wallet/balance',
    TRANSACTIONS: '/wallet/transactions',
    TRANSFER: '/wallet/transfer',
    DEPOSIT_ADDRESS: '/wallet/deposit-address',
    ADDRESSES: '/v1/wallets/:chain/address',
  },
  PORTFOLIO: {
    OVERVIEW: '/portfolio/overview',
  },
  USER: {
    PROFILE: '/user/profile',
    UPDATE: '/user/update',
  },
  PASSCODE: {
    CREATE: '/security/passcode/create',
    VERIFY: '/security/passcode/verify',
  },
} as const;
