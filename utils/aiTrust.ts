/**
 * AI Trust scoring utilities
 * Provides confidence indicators, escalation triggers, and data freshness formatting
 * for all Miriam-generated financial insights.
 */

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ConfidenceResult {
  level: ConfidenceLevel;
  label: string;
  explanation: string;
  sourceCount: number;
  dataAgeMinutes: number;
}

export interface DataSource {
  name: string;
  type: 'account' | 'transaction' | 'market' | 'prediction' | 'user_input';
  lastSyncedAt: string;
}

const TRUST_THRESHOLDS = {
  HIGH_MIN_SOURCES: 5,
  HIGH_MAX_AGE_MINUTES: 60,
  MEDIUM_MIN_SOURCES: 2,
  MEDIUM_MAX_AGE_MINUTES: 24 * 60,
};

/**
 * Calculate confidence level for an AI insight based on data sources and freshness.
 */
export function calculateConfidence(
  sources: DataSource[],
  modelVersion?: string
): ConfidenceResult {
  const now = Date.now();
  const sourceCount = sources.length;
  const ages = sources.map((s) => (now - new Date(s.lastSyncedAt).getTime()) / 60000);
  const maxAge = ages.length > 0 ? Math.max(...ages) : Infinity;
  const hasMarketData = sources.some((s) => s.type === 'market');
  const hasUserInput = sources.some((s) => s.type === 'user_input');

  let level: ConfidenceLevel;
  let label: string;
  let explanation: string;

  if (
    sourceCount >= TRUST_THRESHOLDS.HIGH_MIN_SOURCES &&
    maxAge <= TRUST_THRESHOLDS.HIGH_MAX_AGE_MINUTES &&
    !hasUserInput
  ) {
    level = 'high';
    label = 'High confidence';
    explanation = `Based on ${sourceCount} verified data sources, last updated ${formatDataFreshness(maxAge)}`;
  } else if (
    sourceCount >= TRUST_THRESHOLDS.MEDIUM_MIN_SOURCES &&
    maxAge <= TRUST_THRESHOLDS.MEDIUM_MAX_AGE_MINUTES
  ) {
    level = 'medium';
    label = hasUserInput ? 'Partial estimate' : 'Moderate confidence';
    explanation = hasUserInput
      ? 'Includes your input — verify before acting'
      : `Based on ${sourceCount} sources, some data may be stale`;
  } else {
    level = 'low';
    label = 'Verify this';
    explanation =
      sourceCount < 2
        ? 'Limited data available — double-check before acting'
        : 'Data is stale — refresh for current information';
  }

  return {
    level,
    label,
    explanation,
    sourceCount,
    dataAgeMinutes: Math.round(maxAge),
  };
}

/**
 * Determine if a proposed action should trigger human escalation.
 */
export function shouldEscalate(
  actionType: string,
  params: Record<string, any>,
  userProfile: { hasLargeBalance?: boolean; isNewUser?: boolean; hasSupportHistory?: boolean }
): { escalate: boolean; reason: string } {
  const amount = parseFloat(params.amount) || 0;

  // High-value transfers
  if (amount > 500) {
    return {
      escalate: true,
      reason: 'Large amount — human review recommended',
    };
  }

  // Irreversible actions for new users
  if (userProfile.isNewUser && ['transfer_funds', 'set_budget'].includes(actionType)) {
    return {
      escalate: true,
      reason: 'New user — we recommend reviewing with support',
    };
  }

  // Users with prior support interactions
  if (userProfile.hasSupportHistory && amount > 100) {
    return {
      escalate: true,
      reason: 'Based on your support history, we recommend a quick review',
    };
  }

  return { escalate: false, reason: '' };
}

/**
 * Format data freshness as human-readable string.
 */
export function formatDataFreshness(ageMinutes: number): string {
  if (ageMinutes < 1) return 'just now';
  if (ageMinutes < 60) return `${Math.round(ageMinutes)} min ago`;
  const hours = Math.round(ageMinutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

/**
 * Format a timestamp to freshness string.
 */
export function formatTimestampFreshness(timestamp: string): string {
  const age = (Date.now() - new Date(timestamp).getTime()) / 60000;
  return formatDataFreshness(age);
}
