import { ROUTES } from '@/constants/routes';

const PROFILE_REQUIRED_STATUSES = new Set(['started']);
const APP_READY_STATUSES = new Set([
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

export const isOnboardingAppReady = (status?: string | null): boolean => {
  return APP_READY_STATUSES.has(resolveOnboardingStatus(status));
};

/**
 * Returns the correct complete-kyc step to resume based on currentOnboardingStep
 * or backend-provided startStep.
 * Used by the KYC flow to route users who haven't submitted DOB/address/phone yet.
 */
export const getKycResumeRoute = (step?: string | null): string => {
  switch (step) {
    case 'kyc_address':
    case 'address':
      return ROUTES.AUTH.COMPLETE_KYC.ADDRESS;
    case 'kyc_phone':
    case 'phone':
      return ROUTES.AUTH.COMPLETE_KYC.PHONE;
    case 'none':
      return '/kyc';
    default:
      return ROUTES.AUTH.COMPLETE_KYC.DATE_OF_BIRTH;
  }
};

/**
 * Canonical post-auth route selection used by sign-in and verification flows.
 * Defaults to tabs for unknown statuses so completed users are not trapped.
 */
export const getPostAuthRoute = (status?: string | null): string => {
  if (isProfileCompletionRequired(status)) return ROUTES.AUTH.COMPLETE_PROFILE.PERSONAL_INFO;
  return ROUTES.TABS;
};
