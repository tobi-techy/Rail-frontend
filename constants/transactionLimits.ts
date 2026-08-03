// Matches the backend minimum (pajfunding.MinNGNTransactionAmount = 500).
export const MIN_NGN_TRANSACTION_AMOUNT = 500;
// Hard cap for NGN deposits — prevents accidental mega-transfers.
// The backend may enforce lower per-tier limits.
export const MAX_NGN_DEPOSIT_AMOUNT = 10_000_000;
export const MIN_CRYPTO_TRANSACTION_AMOUNT_USD = 1;
export const MIN_EUR_TRANSACTION_AMOUNT = 1;
