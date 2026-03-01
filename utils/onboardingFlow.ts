import { ROUTES } from '@/constants/routes';

const PROFILE_REQUIRED_STATUSES = new Set(['started', 'wallets_pending']);
const KYC_REQUIRED_STATUSES = new Set(['kyc_rejected']);
const APP_READY_STATUSES = new Set(['completed', 'kyc_approved', 'kyc_pending']);

export const resolveOnboardingStatus = (status?: string | null): string => {
  return typeof status === 'string' ? status.trim().toLowerCase() : '';
};

export const isProfileCompletionRequired = (status?: string | null): boolean => {
  return PROFILE_REQUIRED_STATUSES.has(resolveOnboardingStatus(status));
};

export const isKycSubmissionRequired = (status?: string | null): boolean => {
  return KYC_REQUIRED_STATUSES.has(resolveOnboardingStatus(status));
};

export const isOnboardingAppReady = (status?: string | null): boolean => {
  return APP_READY_STATUSES.has(resolveOnboardingStatus(status));
};

/**
 * Canonical post-auth route selection used by sign-in and verification flows.
 * Defaults to tabs for unknown statuses so completed users are not trapped.
 */
export const getPostAuthRoute = (status?: string | null): string => {
  if (isProfileCompletionRequired(status)) return ROUTES.AUTH.COMPLETE_PROFILE.PERSONAL_INFO;
  // KYC is handled in-context via bottom sheets after auth.
  if (isKycSubmissionRequired(status)) return ROUTES.TABS;
  return ROUTES.TABS;
};
