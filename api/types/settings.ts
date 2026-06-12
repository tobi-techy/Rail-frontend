// ============= Settings Types =============

export interface UserSettings {
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
  security?: Partial<UserSettings['security']>;
  preferences?: Partial<UserSettings['preferences']>;
}
