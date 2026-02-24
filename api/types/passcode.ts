// ============= Passcode Types =============

export interface PasscodeStatus {
  enabled: boolean;
  locked: boolean;
  failedAttempts: number;
  remainingAttempts: number;
  lockedUntil: string | null;
  updatedAt: string;
}

export interface CreatePasscodeRequest {
  passcode: string;
  confirmPasscode: string;
}

export interface CreatePasscodeResponse {
  message: string;
  status: PasscodeStatus;
}

export interface UpdatePasscodeRequest {
  currentPasscode: string;
  newPasscode: string;
  confirmPasscode: string;
}

export interface UpdatePasscodeResponse {
  message: string;
  status: PasscodeStatus;
}

export interface VerifyPasscodeRequest {
  passcode: string;
}

export interface PasscodeLoginRequest {
  passcode: string;
  refresh_token: string;
  email?: string;
  phone?: string;
}

export interface VerifyPasscodeResponse {
  verified: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  passcodeSessionToken?: string;
  passcodeSessionExpiresAt?: string;
}

export interface DeletePasscodeRequest {
  passcode: string;
}

export interface DeletePasscodeResponse {
  message: string;
  status: PasscodeStatus;
}
