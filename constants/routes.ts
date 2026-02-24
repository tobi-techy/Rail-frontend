export const ROUTES = {
  INTRO: '/intro',
  AUTH: {
    SIGNUP: '/(auth)/signup',
    SIGNIN: '/(auth)/signin',
    VERIFY_EMAIL: '/(auth)/verify-email',
    FORGOT_PASSWORD: '/(auth)/forgot-password',
    RESET_PASSWORD: '/(auth)/reset-password',
    KYC: '/(auth)/kyc',
    CREATE_PASSCODE: '/(auth)/create-passcode',
    CONFIRM_PASSCODE: '/(auth)/confirm-passcode',
    COMPLETE_PROFILE: {
      PERSONAL_INFO: '/(auth)/complete-profile/personal-info',
      DATE_OF_BIRTH: '/(auth)/complete-profile/date-of-birth',
      ADDRESS: '/(auth)/complete-profile/address',
      PHONE: '/(auth)/complete-profile/phone',
      CREATE_PASSWORD: '/(auth)/complete-profile/create-password',
    },
  },
  TABS: '/(tabs)',
  SPENDING_STASH: '/spending-stash',
  INVESTMENT_STASH: '/investment-stash',
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
