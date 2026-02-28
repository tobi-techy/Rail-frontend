import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  COUNTRY_KYC_REQUIREMENTS,
  COUNTRY_TAX_CONFIG,
  documentTypeRequiresBack,
  INVESTMENT_PURPOSE_OPTIONS,
  type EmploymentStatus,
  type InvestmentPurpose,
  type KycIdentityDocumentType,
  type KycDisclosures,
  type Country,
  type TaxIdType,
} from '@/api/types/kyc';

export type CaptureSide = 'front' | 'back';

export type CapturedDocument = {
  dataUri: string;
  capturedAt: number;
};

/** Auto-resolve whether back-of-ID is needed based on selected country + document type */
export function documentRequiresBack(
  country: Country,
  documentType: KycIdentityDocumentType
): boolean {
  return documentTypeRequiresBack(country, documentType);
}

interface KycState {
  // Details
  country: Country;
  taxIdType: TaxIdType;
  taxId: string;
  documentType: KycIdentityDocumentType;
  employmentStatus: EmploymentStatus | null;
  investmentPurposes: InvestmentPurpose[];

  // Documents
  frontDoc: CapturedDocument | null;
  backDoc: CapturedDocument | null;

  // Disclosures
  disclosures: KycDisclosures;
  disclosuresConfirmed: boolean;

  // Profile gaps (from backend missing_fields error)
  missingProfileFields: string[];

  // Actions
  setCountry: (country: Country) => void;
  setTaxIdType: (taxIdType: TaxIdType) => void;
  setTaxId: (taxId: string) => void;
  setDocumentType: (documentType: KycIdentityDocumentType) => void;
  setEmploymentStatus: (value: EmploymentStatus | null) => void;
  toggleInvestmentPurpose: (value: InvestmentPurpose) => void;
  setDocument: (side: CaptureSide, document: CapturedDocument | null) => void;
  setDisclosure: (key: keyof KycDisclosures, value: boolean) => void;
  setDisclosuresConfirmed: (confirmed: boolean) => void;
  setMissingProfileFields: (fields: string[]) => void;
  resetKycState: () => void;
}

const DEFAULT_DISCLOSURES: KycDisclosures = {
  is_control_person: false,
  is_affiliated_exchange_or_finra: false,
  is_politically_exposed: false,
  immediate_family_exposed: false,
};

export const useKycStore = create<KycState>()(
  persist(
    (set) => ({
      country: 'USA',
      taxIdType: 'ssn',
      taxId: '',
      documentType: COUNTRY_KYC_REQUIREMENTS.USA.acceptedDocuments[0].type,
      employmentStatus: null,
      investmentPurposes: [],
      frontDoc: null,
      backDoc: null,
      disclosures: DEFAULT_DISCLOSURES,
      disclosuresConfirmed: false,
      missingProfileFields: [],

      // #10: Reset taxIdType to first valid option when country changes
      setCountry: (country) =>
        set({
          country,
          taxIdType: COUNTRY_TAX_CONFIG[country][0].type,
          documentType: COUNTRY_KYC_REQUIREMENTS[country].acceptedDocuments[0].type,
          taxId: '',
          frontDoc: null,
          backDoc: null,
        }),

      setTaxIdType: (taxIdType) => set({ taxIdType }),
      setTaxId: (taxId) => set({ taxId }),
      setDocumentType: (documentType) => set({ documentType, frontDoc: null, backDoc: null }),
      setEmploymentStatus: (employmentStatus) => set({ employmentStatus }),
      toggleInvestmentPurpose: (value) =>
        set((state) => {
          const hasValue = state.investmentPurposes.includes(value);
          if (hasValue) {
            return {
              investmentPurposes: state.investmentPurposes.filter((item) => item !== value),
            };
          }
          const maxSelectable = INVESTMENT_PURPOSE_OPTIONS.length;
          if (state.investmentPurposes.length >= maxSelectable) return state;
          return { investmentPurposes: [...state.investmentPurposes, value] };
        }),

      setDocument: (side, document) =>
        set((state) => ({
          ...state,
          [side === 'front' ? 'frontDoc' : 'backDoc']: document,
        })),

      setDisclosure: (key, value) =>
        set((state) => ({
          disclosures: { ...state.disclosures, [key]: value },
        })),

      setDisclosuresConfirmed: (disclosuresConfirmed) => set({ disclosuresConfirmed }),
      setMissingProfileFields: (missingProfileFields) => set({ missingProfileFields }),

      resetKycState: () =>
        set({
          country: 'USA',
          taxIdType: 'ssn',
          taxId: '',
          documentType: COUNTRY_KYC_REQUIREMENTS.USA.acceptedDocuments[0].type,
          employmentStatus: null,
          investmentPurposes: [],
          frontDoc: null,
          backDoc: null,
          disclosures: DEFAULT_DISCLOSURES,
          disclosuresConfirmed: false,
          missingProfileFields: [],
        }),
    }),
    {
      name: 'kyc-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
