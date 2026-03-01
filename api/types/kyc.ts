// ============= KYC Types =============

// --- Sumsub Session ---

export type KycDisclosures = {
  is_control_person: boolean;
  is_affiliated_exchange_or_finra: boolean;
  is_politically_exposed: boolean;
  immediate_family_exposed: boolean;
};

export type Country = 'USA' | 'GBR' | 'NGA';

export type TaxIdType =
  | 'ssn'
  | 'itin'
  | 'nino'
  | 'utr'
  | 'nin'
  | 'bvn'
  | 'tin'
  | 'passport'
  | 'national_id';

export type KycIdentityDocumentType =
  | 'passport'
  | 'drivers_license'
  | 'national_id'
  | 'residence_permit';

export type EmploymentStatus =
  | 'employed'
  | 'self_employed'
  | 'student'
  | 'retired'
  | 'unemployed'
  | 'other';

export type InvestmentPurpose =
  | 'build_portfolio'
  | 'diversification'
  | 'retirement'
  | 'first_home'
  | 'dependants'
  | 'income_generation';

export type StartSumsubSessionRequest = {
  tax_id: string;
  tax_id_type: TaxIdType;
  issuing_country: Country;
  disclosures: KycDisclosures;
};

export type StartSumsubSessionResponse = {
  status: 'pending';
  applicant_id: string;
  token: string;
  level_name: string;
};

// --- Direct KYC Submit ---

export type SubmitKYCRequest = {
  tax_id: string;
  tax_id_type: TaxIdType;
  issuing_country: Country;
  id_document_front: string;
  id_document_back?: string;
  disclosures: KycDisclosures;
};

export interface KYCProviderResult {
  success: boolean;
  status: string;
  error?: string;
}

export interface SubmitKYCResponse {
  status: 'submitted' | 'partial_failure' | 'failed';
  provider_reference?: string;
  bridge_result: KYCProviderResult;
  alpaca_result: KYCProviderResult;
  message: string;
}

// --- KYC Status ---

export type KycStatus = 'pending' | 'processing' | 'approved' | 'rejected' | 'expired';

export interface KYCStatusResponse {
  user_id?: string;
  status: KycStatus;
  verified: boolean;
  has_submitted: boolean;
  requires_kyc: boolean;
  required_for?: string[];
  last_submitted_at?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  provider_reference?: string | null;
  next_steps?: string[];
  // Legacy fields from Bridge/Alpaca era — kept for backward compat
  overall_status?: 'pending' | 'approved' | 'rejected' | 'not_started';
  bridge?: KYCProviderStatus;
  alpaca?: KYCProviderStatus;
  capabilities?: KYCCapabilities;
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

// --- UI State Machine ---

export type KycUiState =
  | 'idle'
  | 'collecting_inputs'
  | 'creating_session'
  | 'sdk_in_progress'
  | 'submitted_waiting_review'
  | 'approved'
  | 'rejected'
  | 'error';

// --- Country / Tax Config ---

export type TaxFieldConfig = {
  type: TaxIdType;
  label: string;
  placeholder: string;
  helpText?: string;
  validate: (value: string) => boolean;
};

export type KycIdentityDocumentConfig = {
  type: KycIdentityDocumentType;
  label: string;
  description: string;
  requiresBack: boolean;
};

export type CountryKycRequirements = {
  acceptedDocuments: KycIdentityDocumentConfig[];
  requiredDisclosures: (keyof KycDisclosures)[];
  summaryBullets: string[];
  uploadTips: string[];
};

const digitsOnly = (s: string) => s.replace(/\D/g, '');

export const COUNTRY_TAX_CONFIG: Record<Country, TaxFieldConfig[]> = {
  USA: [
    {
      type: 'ssn',
      label: 'Social Security Number (SSN)',
      placeholder: '123-45-6789',
      validate: (v) => /^\d{9}$/.test(digitsOnly(v)),
    },
    {
      type: 'itin',
      label: 'Individual Taxpayer ID (ITIN)',
      placeholder: '9XX-XX-XXXX',
      helpText: 'Must start with 9 and contain 9 digits',
      validate: (v) => /^9\d{8}$/.test(digitsOnly(v)),
    },
  ],
  GBR: [
    {
      type: 'nino',
      label: 'National Insurance Number (NINO)',
      placeholder: 'QQ 12 34 56 C',
      validate: (v) => /^[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]$/i.test(v.replace(/\s/g, '')),
    },
    {
      type: 'utr',
      label: 'Unique Taxpayer Reference (UTR)',
      placeholder: '1234567890',
      validate: (v) => /^\d{10}$/.test(digitsOnly(v)),
    },
    {
      type: 'passport',
      label: 'Passport Number',
      placeholder: 'e.g. 123456789',
      validate: (v) => v.trim().length >= 6,
    },
    {
      type: 'national_id',
      label: 'National ID',
      placeholder: 'National ID number',
      validate: (v) => v.trim().length >= 5,
    },
  ],
  NGA: [
    {
      type: 'nin',
      label: 'National Identification Number (NIN)',
      placeholder: '11 digits',
      validate: (v) => /^\d{11}$/.test(digitsOnly(v)),
    },
    {
      type: 'bvn',
      label: 'Bank Verification Number (BVN)',
      placeholder: '11 digits',
      validate: (v) => /^\d{11}$/.test(digitsOnly(v)),
    },
    {
      type: 'tin',
      label: 'Tax Identification Number (TIN)',
      placeholder: 'Tax ID number',
      validate: (v) => digitsOnly(v).length >= 8,
    },
    {
      type: 'passport',
      label: 'Passport Number',
      placeholder: 'Passport number',
      validate: (v) => v.trim().length >= 6,
    },
    {
      type: 'national_id',
      label: 'National ID',
      placeholder: 'National ID number',
      validate: (v) => v.trim().length >= 5,
    },
  ],
};

export const COUNTRY_LABELS: Record<Country, string> = {
  USA: 'United States',
  GBR: 'United Kingdom',
  NGA: 'Nigeria',
};

export const COUNTRY_HELP_TEXT: Record<Country, string> = {
  USA: 'Use SSN or ITIN exactly as registered.',
  GBR: 'Use NINO/UTR if available, or passport/national ID.',
  NGA: 'Use NIN or BVN where possible for fastest review.',
};

export const EMPLOYMENT_STATUS_OPTIONS: { value: EmploymentStatus; label: string }[] = [
  { value: 'employed', label: 'Employed' },
  { value: 'self_employed', label: 'Self-employed' },
  { value: 'student', label: 'Student' },
  { value: 'retired', label: 'Retired' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'other', label: 'Other' },
];

export const INVESTMENT_PURPOSE_OPTIONS: { value: InvestmentPurpose; label: string }[] = [
  { value: 'build_portfolio', label: 'Build an investment portfolio' },
  { value: 'diversification', label: 'Diversify investments' },
  { value: 'retirement', label: 'Prepare for retirement' },
  { value: 'first_home', label: 'Save for a first home' },
  { value: 'dependants', label: 'Support dependants' },
  { value: 'income_generation', label: 'Generate supplemental income' },
];

export const COUNTRY_KYC_REQUIREMENTS: Record<Country, CountryKycRequirements> = {
  USA: {
    acceptedDocuments: [
      {
        type: 'drivers_license',
        label: "Driver's license",
        description: 'Front and back photos',
        requiresBack: true,
      },
      {
        type: 'passport',
        label: 'Passport',
        description: 'Photo page only',
        requiresBack: false,
      },
      {
        type: 'national_id',
        label: 'State or national ID',
        description: 'Front and back photos',
        requiresBack: true,
      },
    ],
    requiredDisclosures: [
      'is_control_person',
      'is_affiliated_exchange_or_finra',
      'is_politically_exposed',
      'immediate_family_exposed',
    ],
    summaryBullets: [
      'Issuing country and tax identifier',
      'Government ID photos',
      'Regulatory disclosures required for U.S. accounts',
    ],
    uploadTips: [
      'Use a dark surface and avoid glare.',
      'All four corners of the document must be visible.',
      'Your name and document number must be readable.',
    ],
  },
  GBR: {
    acceptedDocuments: [
      {
        type: 'passport',
        label: 'Passport',
        description: 'Photo page only',
        requiresBack: false,
      },
      {
        type: 'drivers_license',
        label: 'UK driving licence',
        description: 'Front and back photos',
        requiresBack: true,
      },
      {
        type: 'national_id',
        label: 'National identity card',
        description: 'Front and back photos',
        requiresBack: true,
      },
      {
        type: 'residence_permit',
        label: 'Residence permit',
        description: 'Front and back photos',
        requiresBack: true,
      },
    ],
    requiredDisclosures: ['is_politically_exposed', 'immediate_family_exposed'],
    summaryBullets: [
      'Issuing country and tax identifier',
      'Government ID photos',
      'Political exposure declarations',
    ],
    uploadTips: [
      'Capture your ID in a bright environment.',
      'Keep text sharp and centered in frame.',
      'Retake if any corner appears cropped.',
    ],
  },
  NGA: {
    acceptedDocuments: [
      {
        type: 'national_id',
        label: 'National ID card',
        description: 'Front and back photos',
        requiresBack: true,
      },
      {
        type: 'passport',
        label: 'International passport',
        description: 'Photo page only',
        requiresBack: false,
      },
      {
        type: 'drivers_license',
        label: "Driver's licence",
        description: 'Front and back photos',
        requiresBack: true,
      },
      {
        type: 'residence_permit',
        label: 'Residence permit',
        description: 'Front and back photos',
        requiresBack: true,
      },
    ],
    requiredDisclosures: ['is_politically_exposed', 'immediate_family_exposed'],
    summaryBullets: [
      'Issuing country and tax identifier',
      'Government ID photos',
      'Political exposure declarations',
    ],
    uploadTips: [
      'Do not cover your photo or signature fields.',
      'Use the original document, not a photocopy.',
      'Ensure your document number is fully visible.',
    ],
  },
};

export function documentTypeRequiresBack(
  country: Country,
  documentType: KycIdentityDocumentType
): boolean {
  const selected = COUNTRY_KYC_REQUIREMENTS[country].acceptedDocuments.find(
    (document) => document.type === documentType
  );
  return selected ? selected.requiresBack : true;
}

export function validateTaxId(country: Country, type: TaxIdType, value: string): string | null {
  const cfg = COUNTRY_TAX_CONFIG[country].find((x) => x.type === type);
  if (!cfg) return 'Unsupported tax ID type for selected country';
  if (!cfg.validate(value)) return `Invalid ${cfg.label}`;
  return null;
}

// --- Feature Gating ---

export function getFeatureAccess(kyc: KYCStatusResponse) {
  const approved = kyc.status === 'approved';
  return {
    canInvest: approved,
    canUseFiatRamps: approved,
    canUseAdvancedTrading: approved,
  };
}

// Legacy types kept for backward compat
export interface BridgeKYCLinkResponse {
  kycLink: string;
  customerId: string;
  status: 'pending' | 'approved' | 'rejected' | string;
}

export interface KYCVerificationRequest {
  documentType: 'passport' | 'drivers_license' | 'national_id';
  documents: { type: string; fileUrl: string; contentType: string }[];
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
