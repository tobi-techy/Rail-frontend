// ============= KYC Types =============

export interface BridgeKYCLinkResponse {
  kycLink: string;
  customerId: string;
  status: 'pending' | 'approved' | 'rejected' | string;
}

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

export interface KYCStatusResponse {
  userId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'verified' | string;
  verified?: boolean;
  hasSubmitted?: boolean;
  requiresKyc?: boolean;
  requiredFor?: string[];
  lastSubmittedAt?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  providerReference?: string | null;
  nextSteps?: string[];
  verificationId?: string;
  submittedAt?: string;
  verifiedAt?: string;
}
