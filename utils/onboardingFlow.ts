import { ROUTES } from '@/constants/routes';
import type { FirstJob } from '@/stores/authStore';

const PROFILE_REQUIRED_STATUSES = new Set(['started']);
const APP_READY_STATUSES = new Set([
  'started',
  'basic_complete',
  'completed',
  'kyc_approved',
  'kyc_rejected',
  'kyc_pending',
  'wallets_pending',
]);

export const resolveOnboardingStatus = (status?: string | null): string => {
  return typeof status === 'string' ? status.trim().toLowerCase() : '';
};

export const isProfileCompletionRequired = (status?: string | null): boolean => {
  return PROFILE_REQUIRED_STATUSES.has(resolveOnboardingStatus(status));
};

export const hasChosenFirstJob = (firstJob?: FirstJob | null): boolean => {
  return Boolean(firstJob);
};

/** First-session is incomplete until the user picks a first job (or skips). */
export const isFirstJobRequired = (status?: string | null, firstJob?: FirstJob | null): boolean => {
  return isProfileCompletionRequired(status) && !hasChosenFirstJob(firstJob);
};

export const isOnboardingAppReady = (status?: string | null): boolean => {
  const resolved = resolveOnboardingStatus(status);
  return APP_READY_STATUSES.has(resolved) || resolved.length === 0;
};

export interface VerifyProgressInput {
  firstName?: string | null;
  lastName?: string | null;
  dob?: string | null;
  street?: string | null;
  employmentStatus?: string | null;
  sourceOfFunds?: string | null;
}

export const getVerifyStartRoute = (input: VerifyProgressInput): string => {
  if (!input.firstName?.trim() || !input.lastName?.trim()) {
    return ROUTES.AUTH.COMPLETE_PROFILE.PERSONAL_INFO;
  }
  if (!input.dob) return ROUTES.AUTH.COMPLETE_KYC.DATE_OF_BIRTH;
  if (!input.street) return ROUTES.AUTH.COMPLETE_KYC.ADDRESS;
  if (!input.employmentStatus) return ROUTES.AUTH.COMPLETE_PROFILE.EMPLOYMENT_STATUS;
  if (!input.sourceOfFunds) return ROUTES.AUTH.COMPLETE_PROFILE.SOURCE_OF_FUNDS;
  return '/kyc';
};

export const hasVerifyProgress = (input: VerifyProgressInput): boolean => {
  return Boolean(
    input.firstName?.trim() ||
    input.lastName?.trim() ||
    input.dob ||
    input.street ||
    input.employmentStatus ||
    input.sourceOfFunds
  );
};

export type KycContinuationStatus = {
  status?: string | null;
  hasSubmitted?: boolean;
  progress: VerifyProgressInput;
};

/** Resume the next unfinished verify step. First tap with no progress opens the map. */
export const getKycContinuationRoute = ({
  status,
  hasSubmitted,
  progress,
}: KycContinuationStatus): string => {
  const resolved = resolveOnboardingStatus(status);
  if (resolved === 'pending' || resolved === 'processing' || hasSubmitted) {
    return ROUTES.KYC.PENDING;
  }
  if (resolved === 'rejected' || resolved === 'expired') {
    return ROUTES.KYC.INDEX;
  }
  if (!hasVerifyProgress(progress)) return ROUTES.KYC.MAP;
  return getVerifyStartRoute(progress);
};

export const getKycContinuationLabel = ({
  status,
  hasSubmitted,
  progress,
}: KycContinuationStatus): string => {
  const resolved = resolveOnboardingStatus(status);
  if (resolved === 'rejected' || resolved === 'expired') return 'Try again';
  if (resolved === 'pending' || resolved === 'processing' || hasSubmitted) return 'In review';
  if (hasVerifyProgress(progress)) return 'Continue';
  return 'Get started';
};

/**
 * Returns the KYC map by default so users see the unlock list before forms.
 * Specific steps are used only when already inside the capture flow.
 */
export const getKycResumeRoute = (step?: string | null): string => {
  switch (step) {
    case 'kyc_address':
    case 'address':
      return ROUTES.AUTH.COMPLETE_KYC.ADDRESS;
    case 'kyc_phone':
    case 'phone':
      return ROUTES.AUTH.COMPLETE_KYC.PHONE;
    case 'kyc_name':
    case 'name':
      return ROUTES.AUTH.COMPLETE_PROFILE.PERSONAL_INFO;
    case 'none':
      return '/kyc';
    case 'capture':
      return ROUTES.AUTH.COMPLETE_KYC.DATE_OF_BIRTH;
    default:
      return ROUTES.KYC.MAP;
  }
};

/**
 * Canonical post-auth route selection used by sign-in and verification flows.
 * Started users land on first-job once, then home — never a form stack.
 */
export const getPostAuthRoute = (
  status?: string | null,
  opts?: { firstJob?: FirstJob | null }
): string => {
  if (isFirstJobRequired(status, opts?.firstJob)) return ROUTES.AUTH.FIRST_JOB;
  return ROUTES.TABS;
};
