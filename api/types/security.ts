// === Whitelist ===

export type WhitelistStatus = 'pending' | 'active' | 'removed';

export interface WhitelistedAddress {
  id: string;
  user_id: string;
  chain: string;
  address: string;
  label: string;
  status: WhitelistStatus;
  cooling_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface AddWhitelistRequest {
  chain: string;
  address: string;
  label?: string;
}

export interface WhitelistResponse {
  addresses: WhitelistedAddress[];
}

// === MFA ===

export type MFAChallengeType = 'otp_email' | 'otp_sms' | 'biometric';

export interface MFAChallengeRequest {
  challenge_type: MFAChallengeType;
}

export interface MFAChallengeResponse {
  challenge: {
    challenge_id: string;
    challenge_type: MFAChallengeType;
    expires_at: string;
  };
}

export interface MFAVerifyRequest {
  challenge_type: MFAChallengeType;
  code: string;
}

export interface MFAVerifyResponse {
  verified: boolean;
}

// === Risk ===

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type RiskAction = 'allow' | 'step_up_auth' | 'flag_review' | 'block';

export interface RiskAssessment {
  risk_score: number;
  risk_level: RiskLevel;
  action: RiskAction;
  signals: Record<string, number>;
}
