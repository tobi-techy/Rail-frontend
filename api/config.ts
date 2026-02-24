import { env, isDev } from '../utils/env';

export const API_CONFIG = {
  baseURL: env.EXPO_PUBLIC_API_URL,
  timeout: 45000,
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
    BALANCE: '/v1/balances',
    TRANSACTIONS: '/v1/withdrawals',
    TRANSFER: '/v1/withdrawals',
    DEPOSIT_ADDRESS: '/v1/funding/deposit/address',
    ADDRESSES: '/v1/wallets/:chain/address',
  },
  PORTFOLIO: {
    OVERVIEW: '/v1/portfolio/overview',
  },
  ACCOUNT: {
    STATION: '/v1/account/station',
  },
  USER: {
    PROFILE: '/v1/users/me',
    UPDATE: '/v1/users/me',
  },
  PASSCODE: {
    CREATE: '/security/passcode/create',
    VERIFY: '/security/passcode/verify',
  },
} as const;
