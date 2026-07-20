/**
 * Self-imposed daily spending limit (commitment device).
 * Caps total daily outflow (card, crypto/fiat withdrawals, P2P sends).
 * Lowering the cap is free; raising it or turning it off charges a flat fee.
 * All money is integer USD cents — never floats.
 */

/** Camel-cased status used across the app (mapped from the snake_case API). */
export interface CommitmentStatus {
  active: boolean;
  dailyLimitCents: number;
  usedCents: number;
  remainingCents: number;
  currency: string;
  resetsAt?: string;
  increaseFeeCents: number;
  increaseCount: number;
}

/** Raw snake_case payload as returned by the backend inside `{ data }`. */
export interface CommitmentStatusResponse {
  active: boolean;
  daily_limit_cents: number;
  used_cents: number;
  remaining_cents: number;
  currency: string;
  resets_at?: string;
  increase_fee_cents: number;
  increase_count: number;
}

/** Discriminated result of a set/clear mutation. */
export type CommitmentMutationResult =
  | { ok: true; status: CommitmentStatus }
  | { ok: false; needsFeeConfirm: true; feeCents: number }
  | { ok: false; insufficientFunds: true }
  | { ok: false; invalidAmount: true };
