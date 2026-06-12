import { ROUTES } from '../../constants/routes';
import {
  getPostAuthRoute,
  isOnboardingAppReady,
  isProfileCompletionRequired,
} from '../../utils/onboardingFlow';

describe('onboardingFlow helpers', () => {
  it('routes profile-incomplete statuses to complete-profile', () => {
    expect(getPostAuthRoute('started')).toBe(ROUTES.AUTH.COMPLETE_PROFILE.PERSONAL_INFO);
  });

  it('routes wallets_pending to tabs (KYC no longer blocks app access)', () => {
    expect(getPostAuthRoute('wallets_pending')).toBe(ROUTES.TABS);
  });
});
