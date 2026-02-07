export const ROUTES = {
  AUTH: {
    INDEX: '/(auth)',
    SIGNIN: '/(auth)/signin',
    VERIFY_EMAIL: '/(auth)/verify-email',
    FORGOT_PASSWORD: '/(auth)/forgot-password',
    RESET_PASSWORD: '/(auth)/reset-password',
    CREATE_PASSCODE: '/(auth)/create-passcode',
    CONFIRM_PASSCODE: '/(auth)/confirm-passcode',
    WELCOME_COMPLETE: '/(auth)/welcome-complete',
    COMPLETE_PROFILE: {
      PERSONAL_INFO: '/(auth)/complete-profile/personal-info',
      DATE_OF_BIRTH: '/(auth)/complete-profile/date-of-birth',
      ADDRESS: '/(auth)/complete-profile/address',
      PHONE: '/(auth)/complete-profile/phone',
      PROFILE_MILESTONE: '/(auth)/complete-profile/profile-milestone',
      CREATE_PASSWORD: '/(auth)/complete-profile/create-password',
      INVESTMENT_GOAL: '/(auth)/complete-profile/investment-goal',
      INVESTMENT_EXPERIENCE: '/(auth)/complete-profile/investment-experience',
      YEARLY_INCOME: '/(auth)/complete-profile/yearly-income',
      EMPLOYMENT_STATUS: '/(auth)/complete-profile/employment-status',
    },
    ONBOARDING: {
      TRUST_DEVICE: '/(auth)/onboarding/trust-device',
      ENABLE_FACEID: '/(auth)/onboarding/enable-faceid',
      ENABLE_NOTIFICATIONS: '/(auth)/onboarding/enable-notifications',
    },
  },
  TABS: '/(tabs)',
} as const;

export type AuthRoute = (typeof ROUTES.AUTH)[keyof typeof ROUTES.AUTH];

export type RootRoute = typeof ROUTES.TABS | AuthRoute;

export function isAuthRoute(route: string): boolean {
  const authRoutes = Object.values(ROUTES.AUTH).flatMap((value) => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return Object.values(value).flat();
    }
    return value;
  });
  return authRoutes.some((r) => {
    if (typeof r === 'string') return r === route;
    if (typeof r === 'object') return Object.values(r).some((v) => v === route);
    return false;
  });
}
