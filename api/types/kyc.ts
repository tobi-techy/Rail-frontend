// ============= KYC Types =============

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
  status: 'pending' | 'verified' | 'rejected';
  verificationId?: string;
  rejectionReason?: string;
  submittedAt?: string;
  verifiedAt?: string;
}
