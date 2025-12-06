export interface User {
  id: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  hasPasscode?: boolean;
  onboardingStatus?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
}
