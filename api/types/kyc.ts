// ============= KYC Types =============

export interface BridgeKYCLinkResponse {
  kycLink: string;
  customerId: string;
  status: 'pending' | 'approved' | 'rejected' | string;
}

export interface KYCProviderStatus {
  status: string;
  submitted_at?: string | null;
  approved_at?: string | null;
  rejection_reasons?: string[];
}

export interface KYCCapabilities {
  can_deposit_crypto: boolean;
  can_deposit_fiat: boolean;
  can_use_card: boolean;
  can_invest: boolean;
}

export interface KYCStatusResponse {
  user_id?: string;
  status: string;
  verified: boolean;
  has_submitted: boolean;
  requires_kyc: boolean;
  required_for?: string[];
  last_submitted_at?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  provider_reference?: string | null;
  next_steps?: string[];
  overall_status: 'pending' | 'approved' | 'rejected' | 'not_started';
  bridge: KYCProviderStatus;
  alpaca: KYCProviderStatus;
  capabilities: KYCCapabilities;
}

// Legacy types used by onboarding/user services
export interface KYCVerificationRequest {
  documentType: 'passport' | 'drivers_license' | 'national_id';
  documents: {
    type: string;
    fileUrl: string;
    contentType: string;
  }[];
  personalInfo?: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    country: string;
    address?: {
      street: string;
      city: string;
      state?: string;
      postalCode: string;
      country: string;
    };
  };
  metadata?: Record<string, any>;
}

export interface KYCVerificationResponse {
  message: string;
  status: string;
  user_id: string;
  next_steps: string[];
}
