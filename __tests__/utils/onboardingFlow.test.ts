import { ROUTES } from '../../constants/routes';
import {
  getPostAuthRoute,
  isKycSubmissionRequired,
  isOnboardingAppReady,
  isProfileCompletionRequired,
} from '../../utils/onboardingFlow';

describe('onboardingFlow helpers', () => {
  it('routes profile-incomplete statuses to complete-profile', () => {
    expect(getPostAuthRoute('started')).toBe(ROUTES.AUTH.COMPLETE_PROFILE.PERSONAL_INFO);
    expect(getPostAuthRoute('wallets_pending')).toBe(ROUTES.AUTH.COMPLETE_PROFILE.PERSONAL_INFO);
  });

  it('routes kyc-required statuses to KYC', () => {
    expect(getPostAuthRoute('kyc_pending')).toBe(ROUTES.AUTH.KYC);
    expect(getPostAuthRoute('kyc_rejected')).toBe(ROUTES.AUTH.KYC);
  });

  it('routes app-ready statuses to tabs', () => {
    expect(getPostAuthRoute('completed')).toBe(ROUTES.TABS);
    expect(getPostAuthRoute('kyc_approved')).toBe(ROUTES.TABS);
  });

  it('normalizes status casing and unknowns', () => {
    expect(getPostAuthRoute(' KYC_PENDING ')).toBe(ROUTES.AUTH.KYC);
    expect(getPostAuthRoute('unknown-status')).toBe(ROUTES.TABS);
    expect(getPostAuthRoute(undefined)).toBe(ROUTES.TABS);
  });

  it('exposes consistency predicates', () => {
    expect(isProfileCompletionRequired('started')).toBe(true);
    expect(isKycSubmissionRequired('kyc_rejected')).toBe(true);
    expect(isOnboardingAppReady('kyc_approved')).toBe(true);
  });
});
