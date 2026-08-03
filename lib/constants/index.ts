export * from './messages';

export const WITHDRAWAL_LIMITS = {
  maxPerDay: 3,
  dailyMaxNew: 10_000,
  dailyMaxEstablished: 100_000,
} as const;
