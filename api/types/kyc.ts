// ============= KYC Types =============

export type KycDisclosures = {
  is_control_person: boolean;
  is_affiliated_exchange_or_finra: boolean;
  is_politically_exposed: boolean;
  immediate_family_exposed: boolean;
};

export type Country =
  | 'USA'
  | 'GBR'
  | 'NGA'
  | 'CAN'
  | 'AUS'
  | 'DEU'
  | 'FRA'
  | 'IND'
  | 'GHA'
  | 'KEN'
  | 'ZAF'
  | 'BRA'
  | 'MEX'
  | 'SGP'
  | 'ARE'
  | 'NLD'
  | 'ITA'
  | 'ESP'
  | 'POL'
  | 'SWE';

export type TaxIdType =
  | 'ssn'
  | 'itin'
  | 'nino'
  | 'utr'
  | 'nin'
  | 'bvn'
  | 'tin'
  | 'passport'
  | 'national_id'
  | 'sin'
  | 'tfn'
  | 'steuer_id'
  | 'pan'
  | 'ghana_tin'
  | 'kra_pin'
  | 'sa_id'
  | 'cpf'
  | 'rfc'
  | 'nric'
  | 'emirates_id'
  | 'bsn'
  | 'codice_fiscale'
  | 'nif'
  | 'pesel'
  | 'personnummer';

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

// --- Didit Session ---

export type StartDiditSessionRequest = {
  tax_id: string;
  tax_id_type: TaxIdType;
  issuing_country: Country;
  disclosures: KycDisclosures;
  source_of_funds?: string;
  employment_status?: string;
  expected_monthly_payments_usd?: string;
  account_purpose?: string;
  account_purpose_other?: string;
  most_recent_occupation?: string;
  acting_as_intermediary?: boolean;
};

export type StartDiditSessionResponse = {
  status: 'pending';
  session_id: string;
  session_token: string;
  url?: string;
};

// --- Direct KYC Submit ---

export type SubmitKYCRequest = {
  tax_id: string;
  tax_id_type: TaxIdType;
  issuing_country: Country;
  id_document_front: string;
  id_document_back?: string;
  disclosures: KycDisclosures;
  source_of_funds?: string;
  employment_status?: string;
  expected_monthly_payments_usd?: string;
  account_purpose?: string;
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

export type KycStatus =
  | 'not_started'
  | 'pending'
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'expired';

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
  overall_status?: KycStatus;
  supported_tax_id_type?: TaxIdType;
  bridge?: KYCProviderStatus;
  alpaca?: KYCProviderStatus;
  capabilities?: KYCCapabilities;
}

/**
 * True when the user is genuinely in review after submitting docs.
 * Some backend states may return pending/processing before a real submission.
 */
export function isKycInReview(status?: KYCStatusResponse | null): boolean {
  if (!status) return false;
  const current = status.status;
  if (current !== 'pending' && current !== 'processing') return false;
  return status.has_submitted === true;
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

export function formatTaxId(country: Country, value: string): string {
  const digits = digitsOnly(value);
  if (country === 'USA') {
    // SSN: XXX-XX-XXXX
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
  }
  return value;
}

export const COUNTRY_TAX_CONFIG: Record<Country, TaxFieldConfig> = {
  USA: {
    type: 'ssn',
    label: 'Social Security Number (SSN)',
    placeholder: '123-45-6789',
    validate: (v) => /^\d{9}$/.test(digitsOnly(v)),
  },
  GBR: {
    type: 'nino',
    label: 'National Insurance Number (NINO)',
    placeholder: 'QQ 12 34 56 C',
    validate: (v) => /^[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]$/i.test(v.replace(/\s/g, '')),
  },
  NGA: {
    type: 'nin',
    label: 'National Identification Number (NIN)',
    placeholder: '11 digits',
    validate: (v) => /^\d{11}$/.test(digitsOnly(v)),
  },
  CAN: {
    type: 'sin',
    label: 'Social Insurance Number (SIN)',
    placeholder: '123 456 789',
    validate: (v) => /^\d{9}$/.test(digitsOnly(v)),
  },
  AUS: {
    type: 'tfn',
    label: 'Tax File Number (TFN)',
    placeholder: '123 456 789',
    validate: (v) => /^\d{8,9}$/.test(digitsOnly(v)),
  },
  DEU: {
    type: 'steuer_id',
    label: 'Steueridentifikationsnummer (Steuer-ID)',
    placeholder: '12 345 678 901',
    validate: (v) => /^\d{11}$/.test(digitsOnly(v)),
  },
  FRA: {
    type: 'tin',
    label: 'Numéro Fiscal (SPI)',
    placeholder: '13 digits',
    validate: (v) => /^\d{13}$/.test(digitsOnly(v)),
  },
  IND: {
    type: 'pan',
    label: 'Permanent Account Number (PAN)',
    placeholder: 'ABCDE1234F',
    validate: (v) => /^[A-Z]{5}\d{4}[A-Z]$/i.test(v.trim()),
  },
  GHA: {
    type: 'ghana_tin',
    label: 'Ghana TIN',
    placeholder: 'P000000000',
    validate: (v) => /^[A-Z]\d{9}$/i.test(v.trim()),
  },
  KEN: {
    type: 'kra_pin',
    label: 'KRA PIN',
    placeholder: 'A000000000Z',
    validate: (v) => /^[A-Z]\d{9}[A-Z]$/i.test(v.trim()),
  },
  ZAF: {
    type: 'sa_id',
    label: 'South African ID Number',
    placeholder: '13 digits',
    validate: (v) => /^\d{13}$/.test(digitsOnly(v)),
  },
  BRA: {
    type: 'cpf',
    label: 'CPF (Cadastro de Pessoas Físicas)',
    placeholder: '000.000.000-00',
    validate: (v) => /^\d{11}$/.test(digitsOnly(v)),
  },
  MEX: {
    type: 'rfc',
    label: 'RFC (Registro Federal de Contribuyentes)',
    placeholder: 'ABCD123456EFG',
    validate: (v) => /^[A-Z]{4}\d{6}[A-Z0-9]{3}$/i.test(v.trim()),
  },
  SGP: {
    type: 'nric',
    label: 'NRIC / FIN',
    placeholder: 'S1234567D',
    validate: (v) => /^[STFGM]\d{7}[A-Z]$/i.test(v.trim()),
  },
  ARE: {
    type: 'emirates_id',
    label: 'Emirates ID',
    placeholder: '784-XXXX-XXXXXXX-X',
    validate: (v) => /^\d{15}$/.test(digitsOnly(v)),
  },
  NLD: {
    type: 'bsn',
    label: 'Burgerservicenummer (BSN)',
    placeholder: '9 digits',
    validate: (v) => /^\d{9}$/.test(digitsOnly(v)),
  },
  ITA: {
    type: 'codice_fiscale',
    label: 'Codice Fiscale',
    placeholder: 'RSSMRA85T10A562S',
    validate: (v) => /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i.test(v.trim()),
  },
  ESP: {
    type: 'nif',
    label: 'NIF / NIE',
    placeholder: '12345678Z',
    validate: (v) => /^(\d{8}[A-Z]|[XYZ]\d{7}[A-Z])$/i.test(v.trim()),
  },
  POL: {
    type: 'pesel',
    label: 'PESEL',
    placeholder: '11 digits',
    validate: (v) => /^\d{11}$/.test(digitsOnly(v)),
  },
  SWE: {
    type: 'personnummer',
    label: 'Personnummer',
    placeholder: 'YYYYMMDD-XXXX',
    validate: (v) => /^\d{10,12}$/.test(digitsOnly(v)),
  },
};

export const COUNTRY_LABELS: Record<Country, string> = {
  USA: 'United States',
  GBR: 'United Kingdom',
  NGA: 'Nigeria',
  CAN: 'Canada',
  AUS: 'Australia',
  DEU: 'Germany',
  FRA: 'France',
  IND: 'India',
  GHA: 'Ghana',
  KEN: 'Kenya',
  ZAF: 'South Africa',
  BRA: 'Brazil',
  MEX: 'Mexico',
  SGP: 'Singapore',
  ARE: 'United Arab Emirates',
  NLD: 'Netherlands',
  ITA: 'Italy',
  ESP: 'Spain',
  POL: 'Poland',
  SWE: 'Sweden',
};

export const COUNTRY_HELP_TEXT: Record<Country, string> = {
  USA: 'SSN required for U.S. accounts.',
  GBR: 'National Insurance Number (NINO) required.',
  NGA: 'National Identification Number (NIN) required.',
  CAN: 'Social Insurance Number (SIN) required.',
  AUS: 'Tax File Number (TFN) required.',
  DEU: 'Steueridentifikationsnummer required.',
  FRA: 'Numéro fiscal (SPI) required.',
  IND: 'Permanent Account Number (PAN) required.',
  GHA: 'Ghana Revenue Authority TIN required.',
  KEN: 'KRA PIN required.',
  ZAF: 'South African ID number required.',
  BRA: 'CPF required.',
  MEX: 'RFC required.',
  SGP: 'NRIC or FIN required.',
  ARE: 'Emirates ID required.',
  NLD: 'Burgerservicenummer (BSN) required.',
  ITA: 'Codice Fiscale required.',
  ESP: 'NIF or NIE required.',
  POL: 'PESEL required.',
  SWE: 'Personnummer required.',
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

const STD_TIPS = [
  'Use a dark surface and avoid glare.',
  'All four corners of the document must be visible.',
  'Your name and document number must be readable.',
];

const STD_BULLETS = [
  'Issuing country and tax identifier',
  'Government ID photos',
  'Political exposure declarations',
];

const PEP_DISCLOSURES: (keyof KycDisclosures)[] = [
  'is_politically_exposed',
  'immediate_family_exposed',
];

const US_DISCLOSURES: (keyof KycDisclosures)[] = [
  'is_control_person',
  'is_affiliated_exchange_or_finra',
  'is_politically_exposed',
  'immediate_family_exposed',
];

const PASSPORT: KycIdentityDocumentConfig = {
  type: 'passport',
  label: 'Passport',
  description: 'Photo page only',
  requiresBack: false,
};

const DRIVERS_LICENSE: KycIdentityDocumentConfig = {
  type: 'drivers_license',
  label: "Driver's licence",
  description: 'Front and back photos',
  requiresBack: true,
};

const NATIONAL_ID: KycIdentityDocumentConfig = {
  type: 'national_id',
  label: 'National ID card',
  description: 'Front and back photos',
  requiresBack: true,
};

const RESIDENCE_PERMIT: KycIdentityDocumentConfig = {
  type: 'residence_permit',
  label: 'Residence permit',
  description: 'Front and back photos',
  requiresBack: true,
};

export const COUNTRY_KYC_REQUIREMENTS: Record<Country, CountryKycRequirements> = {
  USA: {
    acceptedDocuments: [
      { ...DRIVERS_LICENSE, label: "Driver's license" },
      PASSPORT,
      { ...NATIONAL_ID, label: 'State or national ID' },
    ],
    requiredDisclosures: US_DISCLOSURES,
    summaryBullets: [
      'Issuing country and tax identifier',
      'Government ID photos',
      'Regulatory disclosures required for U.S. accounts',
    ],
    uploadTips: STD_TIPS,
  },
  GBR: {
    acceptedDocuments: [
      PASSPORT,
      { ...DRIVERS_LICENSE, label: 'UK driving licence' },
      NATIONAL_ID,
      RESIDENCE_PERMIT,
    ],
    requiredDisclosures: PEP_DISCLOSURES,
    summaryBullets: STD_BULLETS,
    uploadTips: STD_TIPS,
  },
  NGA: {
    acceptedDocuments: [
      NATIONAL_ID,
      { ...PASSPORT, label: 'International passport' },
      DRIVERS_LICENSE,
      RESIDENCE_PERMIT,
    ],
    requiredDisclosures: PEP_DISCLOSURES,
    summaryBullets: STD_BULLETS,
    uploadTips: STD_TIPS,
  },
  CAN: {
    acceptedDocuments: [PASSPORT, DRIVERS_LICENSE, NATIONAL_ID, RESIDENCE_PERMIT],
    requiredDisclosures: PEP_DISCLOSURES,
    summaryBullets: STD_BULLETS,
    uploadTips: STD_TIPS,
  },
  AUS: {
    acceptedDocuments: [PASSPORT, DRIVERS_LICENSE, NATIONAL_ID],
    requiredDisclosures: PEP_DISCLOSURES,
    summaryBullets: STD_BULLETS,
    uploadTips: STD_TIPS,
  },
  DEU: {
    acceptedDocuments: [
      PASSPORT,
      { ...NATIONAL_ID, label: 'Personalausweis (national ID)' },
      RESIDENCE_PERMIT,
    ],
    requiredDisclosures: PEP_DISCLOSURES,
    summaryBullets: STD_BULLETS,
    uploadTips: STD_TIPS,
  },
  FRA: {
    acceptedDocuments: [
      PASSPORT,
      { ...NATIONAL_ID, label: "Carte nationale d'identité" },
      RESIDENCE_PERMIT,
    ],
    requiredDisclosures: PEP_DISCLOSURES,
    summaryBullets: STD_BULLETS,
    uploadTips: STD_TIPS,
  },
  IND: {
    acceptedDocuments: [PASSPORT, { ...NATIONAL_ID, label: 'Aadhaar card' }, DRIVERS_LICENSE],
    requiredDisclosures: PEP_DISCLOSURES,
    summaryBullets: STD_BULLETS,
    uploadTips: STD_TIPS,
  },
  GHA: {
    acceptedDocuments: [NATIONAL_ID, PASSPORT, DRIVERS_LICENSE],
    requiredDisclosures: PEP_DISCLOSURES,
    summaryBullets: STD_BULLETS,
    uploadTips: STD_TIPS,
  },
  KEN: {
    acceptedDocuments: [NATIONAL_ID, PASSPORT, DRIVERS_LICENSE],
    requiredDisclosures: PEP_DISCLOSURES,
    summaryBullets: STD_BULLETS,
    uploadTips: STD_TIPS,
  },
  ZAF: {
    acceptedDocuments: [
      { ...NATIONAL_ID, label: 'South African ID card' },
      PASSPORT,
      DRIVERS_LICENSE,
    ],
    requiredDisclosures: PEP_DISCLOSURES,
    summaryBullets: STD_BULLETS,
    uploadTips: STD_TIPS,
  },
  BRA: {
    acceptedDocuments: [
      PASSPORT,
      { ...NATIONAL_ID, label: 'RG (Registro Geral)' },
      DRIVERS_LICENSE,
    ],
    requiredDisclosures: PEP_DISCLOSURES,
    summaryBullets: STD_BULLETS,
    uploadTips: STD_TIPS,
  },
  MEX: {
    acceptedDocuments: [PASSPORT, { ...NATIONAL_ID, label: 'INE / IFE voter ID' }, DRIVERS_LICENSE],
    requiredDisclosures: PEP_DISCLOSURES,
    summaryBullets: STD_BULLETS,
    uploadTips: STD_TIPS,
  },
  SGP: {
    acceptedDocuments: [{ ...NATIONAL_ID, label: 'NRIC / FIN card' }, PASSPORT, RESIDENCE_PERMIT],
    requiredDisclosures: PEP_DISCLOSURES,
    summaryBullets: STD_BULLETS,
    uploadTips: STD_TIPS,
  },
  ARE: {
    acceptedDocuments: [{ ...NATIONAL_ID, label: 'Emirates ID' }, PASSPORT, RESIDENCE_PERMIT],
    requiredDisclosures: PEP_DISCLOSURES,
    summaryBullets: STD_BULLETS,
    uploadTips: STD_TIPS,
  },
  NLD: {
    acceptedDocuments: [
      PASSPORT,
      { ...NATIONAL_ID, label: 'Dutch identity card (ID-kaart)' },
      DRIVERS_LICENSE,
      RESIDENCE_PERMIT,
    ],
    requiredDisclosures: PEP_DISCLOSURES,
    summaryBullets: STD_BULLETS,
    uploadTips: STD_TIPS,
  },
  ITA: {
    acceptedDocuments: [
      PASSPORT,
      { ...NATIONAL_ID, label: 'Carta di identità' },
      DRIVERS_LICENSE,
      RESIDENCE_PERMIT,
    ],
    requiredDisclosures: PEP_DISCLOSURES,
    summaryBullets: STD_BULLETS,
    uploadTips: STD_TIPS,
  },
  ESP: {
    acceptedDocuments: [
      PASSPORT,
      { ...NATIONAL_ID, label: 'DNI (Documento Nacional de Identidad)' },
      DRIVERS_LICENSE,
      RESIDENCE_PERMIT,
    ],
    requiredDisclosures: PEP_DISCLOSURES,
    summaryBullets: STD_BULLETS,
    uploadTips: STD_TIPS,
  },
  POL: {
    acceptedDocuments: [
      PASSPORT,
      { ...NATIONAL_ID, label: 'Dowód osobisty (national ID)' },
      DRIVERS_LICENSE,
      RESIDENCE_PERMIT,
    ],
    requiredDisclosures: PEP_DISCLOSURES,
    summaryBullets: STD_BULLETS,
    uploadTips: STD_TIPS,
  },
  SWE: {
    acceptedDocuments: [
      PASSPORT,
      { ...NATIONAL_ID, label: 'Swedish national ID card' },
      DRIVERS_LICENSE,
      RESIDENCE_PERMIT,
    ],
    requiredDisclosures: PEP_DISCLOSURES,
    summaryBullets: STD_BULLETS,
    uploadTips: STD_TIPS,
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
  const cfg = COUNTRY_TAX_CONFIG[country];
  if (!cfg || cfg.type !== type) return 'Unsupported tax ID type for selected country';
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
