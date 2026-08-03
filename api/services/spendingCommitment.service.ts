/**
 * Self-Imposed Daily Spending Limit API Service
 *
 * A commitment device: users cap how much money can leave their account per day.
 * Lowering the cap is free and instant; raising it or turning it off charges a
 * flat fee and must be confirmed. The server is the source of truth for the fee
 * gate — it rejects an un-confirmed increase with 409, so we surface a confirm
 * step and retry with `confirm_fee: true`.
 *
 * Responses are wrapped in `{ data: ... }` and money is always integer USD cents.
 */

import apiClient from '../client';
import type {
  CommitmentMutationResult,
  CommitmentStatus,
  CommitmentStatusResponse,
} from '../types/spendingCommitment';
import type { TransformedApiError } from '../types';

const ENDPOINT = '/v1/spending-commitment';

interface Wrapped<T> {
  data: T;
}

function toStatus(res: CommitmentStatusResponse): CommitmentStatus {
  return {
    active: res.active,
    dailyLimitCents: res.daily_limit_cents,
    usedCents: res.used_cents,
    remainingCents: res.remaining_cents,
    currency: res.currency,
    resetsAt: res.resets_at,
    increaseFeeCents: res.increase_fee_cents,
    increaseCount: res.increase_count,
  };
}

function isApiError(error: unknown): error is TransformedApiError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

/** Best-effort fee extraction from a 409 body; UI falls back to GET status. */
function feeFromError(error: TransformedApiError): number {
  const details = error.details as { increase_fee_cents?: number } | undefined;
  return typeof details?.increase_fee_cents === 'number' ? details.increase_fee_cents : 0;
}

function mapMutationError(error: unknown): CommitmentMutationResult {
  if (isApiError(error)) {
    if (error.status === 409)
      return { ok: false, needsFeeConfirm: true, feeCents: feeFromError(error) };
    if (error.status === 402) return { ok: false, insufficientFunds: true };
    if (error.status === 400) return { ok: false, invalidAmount: true };
  }
  throw error;
}

export const spendingCommitmentService = {
  /** Current commitment + today's usage. Always 200 (inactive when unset). */
  async get(): Promise<CommitmentStatus> {
    const res = await apiClient.get<Wrapped<CommitmentStatusResponse>>(ENDPOINT);
    return toStatus(res.data);
  },

  /**
   * Set, create, lower, or (with confirmFee) raise the cap.
   * Decrease / first-time set → 200. Increase without confirm → 409.
   */
  async set(cents: number, confirmFee = false): Promise<CommitmentMutationResult> {
    try {
      const res = await apiClient.put<Wrapped<CommitmentStatusResponse>>(ENDPOINT, {
        daily_limit_cents: cents,
        confirm_fee: confirmFee,
      });
      return { ok: true, status: toStatus(res.data) };
    } catch (error) {
      return mapMutationError(error);
    }
  },

  /** Turn the cap off. Fee-gated exactly like an increase (needs confirmFee). */
  async clear(confirmFee: boolean): Promise<CommitmentMutationResult> {
    try {
      const res = await apiClient.delete<Wrapped<CommitmentStatusResponse>>(
        `${ENDPOINT}?confirm_fee=${confirmFee}`
      );
      return { ok: true, status: toStatus(res.data) };
    } catch (error) {
      return mapMutationError(error);
    }
  },
};

export default spendingCommitmentService;
