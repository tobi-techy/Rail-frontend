// ============= Settings Types =============

export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    biometricEnabled: boolean;
    passcodeEnabled: boolean;
  };
  preferences: {
    currency: string;
    language: string;
    theme: 'light' | 'dark' | 'auto';
  };
}

export interface UpdateSettingsRequest {
  notifications?: Partial<UserSettings['notifications']>;
  security?: Partial<UserSettings['security']>;
  preferences?: Partial<UserSettings['preferences']>;
}
