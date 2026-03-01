import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  COUNTRY_KYC_REQUIREMENTS,
  COUNTRY_TAX_CONFIG,
  INVESTMENT_PURPOSE_OPTIONS,
  type EmploymentStatus,
  type InvestmentPurpose,
  type KycDisclosures,
  type Country,
  type TaxIdType,
} from '@/api/types/kyc';

const DEFAULT_DISCLOSURES: KycDisclosures = {
  is_control_person: false,
  is_affiliated_exchange_or_finra: false,
  is_politically_exposed: false,
  immediate_family_exposed: false,
};

interface KycState {
  country: Country;
  taxIdType: TaxIdType;
  taxId: string;
  employmentStatus: EmploymentStatus | null;
  investmentPurposes: InvestmentPurpose[];
  disclosures: KycDisclosures;
  disclosuresConfirmed: boolean;
  missingProfileFields: string[];

  // Sumsub session (non-sensitive — token is short-lived, not PII)
  sumsubToken: string | null;
  applicantId: string | null;

  setCountry: (country: Country) => void;
  setTaxIdType: (taxIdType: TaxIdType) => void;
  setTaxId: (taxId: string) => void;
  setEmploymentStatus: (value: EmploymentStatus | null) => void;
  toggleInvestmentPurpose: (value: InvestmentPurpose) => void;
  setDisclosure: (key: keyof KycDisclosures, value: boolean) => void;
  setDisclosuresConfirmed: (confirmed: boolean) => void;
  setMissingProfileFields: (fields: string[]) => void;
  setSumsubSession: (token: string, applicantId: string) => void;
  resetKycState: () => void;
}

export const useKycStore = create<KycState>()(
  persist(
    (set) => ({
      country: 'USA',
      taxIdType: 'ssn',
      taxId: '',
      employmentStatus: null,
      investmentPurposes: [],
      disclosures: DEFAULT_DISCLOSURES,
      disclosuresConfirmed: false,
      missingProfileFields: [],
      sumsubToken: null,
      applicantId: null,

      setCountry: (country) =>
        set({
          country,
          taxIdType: COUNTRY_TAX_CONFIG[country][0].type,
          taxId: '',
        }),

      setTaxIdType: (taxIdType) => set({ taxIdType }),
      setTaxId: (taxId) => set({ taxId }),
      setEmploymentStatus: (employmentStatus) => set({ employmentStatus }),

      toggleInvestmentPurpose: (value) =>
        set((state) => {
          if (state.investmentPurposes.includes(value)) {
            return { investmentPurposes: state.investmentPurposes.filter((v) => v !== value) };
          }
          if (state.investmentPurposes.length >= INVESTMENT_PURPOSE_OPTIONS.length) return state;
          return { investmentPurposes: [...state.investmentPurposes, value] };
        }),

      setDisclosure: (key, value) =>
        set((state) => ({ disclosures: { ...state.disclosures, [key]: value } })),

      setDisclosuresConfirmed: (disclosuresConfirmed) => set({ disclosuresConfirmed }),
      setMissingProfileFields: (missingProfileFields) => set({ missingProfileFields }),
      setSumsubSession: (sumsubToken, applicantId) => set({ sumsubToken, applicantId }),

      resetKycState: () =>
        set({
          country: 'USA',
          taxIdType: 'ssn',
          taxId: '',
          employmentStatus: null,
          investmentPurposes: [],
          disclosures: DEFAULT_DISCLOSURES,
          disclosuresConfirmed: false,
          missingProfileFields: [],
          sumsubToken: null,
          applicantId: null,
        }),
    }),
    {
      name: 'kyc-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Never persist taxId — it's transient PII
      partialize: (state) => {
        const { taxId: _taxId, ...rest } = state;
        return rest;
      },
    }
  )
);
