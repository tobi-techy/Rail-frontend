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
  sourceOfFunds: string | null;
  expectedMonthlyPayments: string | null;
  accountPurpose: string | null;
  accountPurposeOther: string | null;
  mostRecentOccupation: string | null;
  actingAsIntermediary: boolean;
  investmentPurposes: InvestmentPurpose[];
  disclosures: KycDisclosures;
  disclosuresConfirmed: boolean;
  missingProfileFields: string[];

  // Sumsub session (non-sensitive — token is short-lived, not PII)
  sumsubToken: string | null;
  applicantId: string | null;
  localSubmissionPendingAt: string | null;

  setCountry: (country: Country) => void;
  setTaxIdType: (taxIdType: TaxIdType) => void;
  setTaxId: (taxId: string) => void;
  setEmploymentStatus: (value: EmploymentStatus | null) => void;
  setSourceOfFunds: (value: string | null) => void;
  setExpectedMonthlyPayments: (value: string | null) => void;
  setAccountPurpose: (value: string | null) => void;
  setAccountPurposeOther: (value: string | null) => void;
  setMostRecentOccupation: (value: string | null) => void;
  setActingAsIntermediary: (value: boolean) => void;
  toggleInvestmentPurpose: (value: InvestmentPurpose) => void;
  setDisclosure: (key: keyof KycDisclosures, value: boolean) => void;
  setDisclosuresConfirmed: (confirmed: boolean) => void;
  setMissingProfileFields: (fields: string[]) => void;
  setSumsubSession: (token: string, applicantId: string) => void;
  setLocalSubmissionPendingAt: (submittedAt: string | null) => void;
  resetKycState: () => void;
}

export const useKycStore = create<KycState>()(
  persist(
    (set) => ({
      country: 'USA',
      taxIdType: COUNTRY_TAX_CONFIG['USA'].type,
      taxId: '',
      employmentStatus: null,
      sourceOfFunds: null,
      expectedMonthlyPayments: null,
      accountPurpose: null,
      accountPurposeOther: null,
      mostRecentOccupation: null,
      actingAsIntermediary: false,
      investmentPurposes: [],
      disclosures: DEFAULT_DISCLOSURES,
      disclosuresConfirmed: false,
      missingProfileFields: [],
      sumsubToken: null,
      applicantId: null,
      localSubmissionPendingAt: null,

      setCountry: (country) =>
        set({
          country,
          taxIdType: COUNTRY_TAX_CONFIG[country].type,
          taxId: '',
          employmentStatus: null,
          sourceOfFunds: null,
          expectedMonthlyPayments: null,
          accountPurpose: null,
          accountPurposeOther: null,
          mostRecentOccupation: null,
          actingAsIntermediary: false,
          investmentPurposes: [],
          disclosures: DEFAULT_DISCLOSURES,
          disclosuresConfirmed: false,
        }),

      setTaxIdType: (taxIdType) => set({ taxIdType }),
      setTaxId: (taxId) => set({ taxId }),
      setEmploymentStatus: (employmentStatus) => set({ employmentStatus }),
      setSourceOfFunds: (sourceOfFunds) => set({ sourceOfFunds }),
      setExpectedMonthlyPayments: (expectedMonthlyPayments) => set({ expectedMonthlyPayments }),
      setAccountPurpose: (accountPurpose) => set({ accountPurpose }),
      setAccountPurposeOther: (accountPurposeOther) => set({ accountPurposeOther }),
      setMostRecentOccupation: (mostRecentOccupation) => set({ mostRecentOccupation }),
      setActingAsIntermediary: (actingAsIntermediary) => set({ actingAsIntermediary }),

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
      setLocalSubmissionPendingAt: (localSubmissionPendingAt) => set({ localSubmissionPendingAt }),

      resetKycState: () =>
        set({
          country: 'USA',
          taxIdType: COUNTRY_TAX_CONFIG['USA'].type,
          taxId: '',
          employmentStatus: null,
          sourceOfFunds: null,
          expectedMonthlyPayments: null,
          accountPurpose: null,
          accountPurposeOther: null,
          mostRecentOccupation: null,
          actingAsIntermediary: false,
          investmentPurposes: [],
          disclosures: DEFAULT_DISCLOSURES,
          disclosuresConfirmed: false,
          missingProfileFields: [],
          sumsubToken: null,
          applicantId: null,
          localSubmissionPendingAt: null,
        }),
    }),
    {
      name: 'kyc-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Never persist taxId or sumsub session tokens — transient PII/sensitive data
      partialize: (state) => {
        const {
          taxId: _taxId,
          sumsubToken: _sumsubToken,
          applicantId: _applicantId,
          ...rest
        } = state;
        return rest;
      },
    }
  )
);
