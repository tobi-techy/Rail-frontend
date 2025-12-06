// ============= 2FA Types =============

export interface Enable2FAResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface Verify2FARequest {
  code: string;
}

export interface Verify2FAResponse {
  verified: boolean;
}
