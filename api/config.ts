import { env } from '../utils/env';

export const API_CONFIG = {
  baseURL: env.EXPO_PUBLIC_API_URL,
  timeout: 120000,
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
    INVESTMENT_STASH: '/v1/account/investment-stash',
    INVESTMENT_POSITIONS: '/v1/account/investment-stash/positions',
    INVESTMENT_DISTRIBUTION: '/v1/account/investment-stash/distribution',
    INVESTMENT_TRANSACTIONS: '/v1/account/investment-stash/transactions',
    INVESTMENT_PERFORMANCE: '/v1/account/investment-stash/performance',
  },
  MARKET: {
    STATUS: '/v1/market/status',
  },
  USER: {
    PROFILE: '/v1/users/me',
    UPDATE: '/v1/users/me',
  },
  PASSCODE: {
    CREATE: '/security/passcode/create',
    VERIFY: '/security/passcode/verify',
  },
  GAMEPLAY: {
    PROFILE: '/v1/gameplay/profile',
    STREAKS: '/v1/gameplay/streaks',
    HEATMAP: '/v1/gameplay/activity-heatmap',
    XP: '/v1/gameplay/xp',
    XP_HISTORY: '/v1/gameplay/xp/history',
    CHALLENGES: '/v1/gameplay/challenges',
    ACHIEVEMENTS: '/v1/gameplay/achievements',
    LEADERBOARD: '/v1/gameplay/leaderboard',
  },
  SUBSCRIPTION: {
    STATUS: '/v1/subscription',
    SUBSCRIBE: '/v1/subscription',
    CANCEL: '/v1/subscription',
  },
} as const;
