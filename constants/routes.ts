export const ROUTES = {
  INTRO: '/intro',
  AUTH: {
    SIGNUP: '/(auth)/signup',
    SIGNIN: '/(auth)/signin',
    VERIFY_EMAIL: '/(auth)/verify-email',
    FORGOT_PASSWORD: '/(auth)/forgot-password',
    CREATE_PASSCODE: '/(auth)/create-passcode',
    CONFIRM_PASSCODE: '/(auth)/confirm-passcode',
    FIRST_JOB: '/(auth)/first-job',
    COMPLETE_PROFILE: {
      PERSONAL_INFO: '/(auth)/complete-profile/personal-info',
      CREATE_RAILTAG: '/(auth)/complete-profile/create-railtag',
      EMPLOYMENT_STATUS: '/(auth)/complete-profile/employment-status',
      ACCOUNT_PURPOSE: '/(auth)/complete-profile/account-purpose',
      SOURCE_OF_FUNDS: '/(auth)/complete-profile/source-of-funds',
    },
    COMPLETE_KYC: {
      DATE_OF_BIRTH: '/(auth)/complete-kyc/date-of-birth',
      ADDRESS: '/(auth)/complete-kyc/address',
      PHONE: '/(auth)/complete-kyc/phone',
    },
  },
  KYC: {
    MAP: '/kyc/map',
    INDEX: '/kyc',
    PENDING: '/kyc/pending',
  },
  TABS: '/(tabs)',
  SPENDING_STASH: '/spending-stash',
  INVESTMENT_STASH: '/investment-stash',
  CARD: '/card',
  RECEIPT_SCANNER: '/receipt-scanner',
  VOICE_MODE: '/voice-mode',
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
