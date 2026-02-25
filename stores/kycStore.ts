import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  COUNTRY_TAX_CONFIG,
  type KycDisclosures,
  type TaxIdType,
  type Country,
} from '@/api/types/kyc';

export type CaptureSide = 'front' | 'back';

export type CapturedDocument = {
  dataUri: string;
  capturedAt: number;
};

/** Tax ID types that use passport-style docs (single side only) */
const SINGLE_SIDE_TAX_TYPES: TaxIdType[] = ['passport'];

/** Auto-resolve whether back-of-ID is needed based on tax ID type */
export function documentRequiresBack(taxIdType: TaxIdType): boolean {
  return !SINGLE_SIDE_TAX_TYPES.includes(taxIdType);
}

interface KycState {
  // Details
  country: Country;
  taxIdType: TaxIdType;
  taxId: string;

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
          taxId: '',
        }),

      setTaxIdType: (taxIdType) => set({ taxIdType }),
      setTaxId: (taxId) => set({ taxId }),

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
