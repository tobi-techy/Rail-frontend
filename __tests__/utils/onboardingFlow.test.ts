import { ROUTES } from '../../constants/routes';
import {
  getKycContinuationLabel,
  getKycContinuationRoute,
  getPostAuthRoute,
  getVerifyStartRoute,
} from '../../utils/onboardingFlow';

describe('onboardingFlow helpers', () => {
  it('routes started users to first-job until they pick one', () => {
    expect(getPostAuthRoute('started')).toBe(ROUTES.AUTH.FIRST_JOB);
  });

  it('routes started users to tabs after a first job is chosen', () => {
    expect(getPostAuthRoute('started', { firstJob: 'explore' })).toBe(ROUTES.TABS);
  });

  it('routes wallets_pending to tabs (KYC no longer blocks app access)', () => {
    expect(getPostAuthRoute('wallets_pending')).toBe(ROUTES.TABS);
  });

  it('starts verification at the first missing unlock step', () => {
    expect(getVerifyStartRoute({})).toBe(ROUTES.AUTH.COMPLETE_PROFILE.PERSONAL_INFO);
    expect(
      getVerifyStartRoute({
        firstName: 'Ada',
        lastName: 'Lovelace',
        dob: '2000-01-01',
        street: '1 Rail St',
      })
    ).toBe(ROUTES.AUTH.COMPLETE_PROFILE.EMPLOYMENT_STATUS);
  });

  it('resumes KYC from the last unfinished step', () => {
    expect(getKycContinuationRoute({ progress: {} })).toBe(ROUTES.KYC.MAP);
    expect(
      getKycContinuationRoute({
        progress: { firstName: 'Ada', lastName: 'Lovelace' },
      })
    ).toBe(ROUTES.AUTH.COMPLETE_KYC.DATE_OF_BIRTH);
    expect(
      getKycContinuationLabel({
        progress: { firstName: 'Ada', lastName: 'Lovelace' },
      })
    ).toBe('Continue');
    expect(
      getKycContinuationRoute({
        status: 'pending',
        hasSubmitted: true,
        progress: { firstName: 'Ada', lastName: 'Lovelace' },
      })
    ).toBe(ROUTES.KYC.PENDING);
  });
});
