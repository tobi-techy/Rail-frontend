/**
 * Helpers for the self-imposed daily spending limit decline path.
 *
 * When an outflow (card auth, withdrawal, P2P send) would push today's total
 * over the user's cap, the backend declines it with a `commitment_exceeded`
 * reason. We surface an informative inline message and route the user to
 * Settings — deliberately NOT a one-tap "raise limit" shortcut, which would
 * defeat the commitment device.
 */

import type { TransformedApiError } from '@/api/types';

interface CommitmentExceededDetails {
  remaining_cents?: number;
  daily_limit_cents?: number;
  resets_at?: string;
}

/** True when an error is a daily-spending-limit decline. */
export function isCommitmentExceededError(err: unknown): boolean {
  const e = err as Partial<TransformedApiError> | undefined;
  if (!e) return false;
  const code = String(e.code ?? '').toUpperCase();
  if (code === 'COMMITMENT_EXCEEDED') return true;
  return /commitment[_\s]?exceeded/i.test(String(e.message ?? ''));
}

const formatUsd = (cents: number, withCents = false) =>
  `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: withCents ? 2 : 0,
    maximumFractionDigits: withCents ? 2 : 0,
  })}`;

function resetPhrase(resetsAt?: string): string {
  if (!resetsAt) return 'Resets at midnight UTC';
  const ms = new Date(resetsAt).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return 'Resets shortly';
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `Resets in ${hours}h`;
  return `Resets in ${Math.max(1, Math.floor(ms / 60_000))}m`;
}

/**
 * Inline decline copy, e.g.
 * "This would put you over your $500 daily limit. $120 remaining today. Resets in 5h."
 * Falls back gracefully when the backend omits the numeric details.
 */
export function commitmentDeclineMessage(err: unknown): string {
  const e = err as Partial<TransformedApiError> | undefined;
  const details = (e?.details ?? undefined) as CommitmentExceededDetails | undefined;

  const limit =
    typeof details?.daily_limit_cents === 'number'
      ? `your ${formatUsd(details.daily_limit_cents)} daily limit`
      : 'your daily limit';
  const remaining =
    typeof details?.remaining_cents === 'number'
      ? ` ${formatUsd(details.remaining_cents, true)} remaining today.`
      : '';

  return `This would put you over ${limit}.${remaining} ${resetPhrase(details?.resets_at)}. Adjust it in Settings.`;
}
