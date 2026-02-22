import { create } from 'zustand';
import type { KycDisclosures, TaxIdType, Country } from '@/api/types/kyc';
import type { KycDocumentType } from '@/components/sheets/CameraOverlay';

export type CaptureSide = 'front' | 'back';

export type CapturedDocument = {
  dataUri: string;
  capturedAt: number;
};

interface KycState {
  // Details
  country: Country;
  taxIdType: TaxIdType;
  taxId: string;
  documentType: KycDocumentType | null;
  documentNumber: string;

  // Documents
  frontDoc: CapturedDocument | null;
  backDoc: CapturedDocument | null;

  // Disclosures
  disclosures: KycDisclosures;

  // Actions
  setCountry: (country: Country) => void;
  setTaxIdType: (taxIdType: TaxIdType) => void;
  setTaxId: (taxId: string) => void;
  setDocumentType: (type: KycDocumentType) => void;
  setDocumentNumber: (documentNumber: string) => void;
  setDocument: (side: CaptureSide, document: CapturedDocument | null) => void;
  setDisclosure: (key: keyof KycDisclosures, value: boolean) => void;
  resetKycState: () => void;
}

const DEFAULT_DISCLOSURES: KycDisclosures = {
  is_control_person: false,
  is_affiliated_exchange_or_finra: false,
  is_politically_exposed: false,
  immediate_family_exposed: false,
};

export const useKycStore = create<KycState>((set) => ({
  country: 'USA',
  taxIdType: 'ssn',
  taxId: '',
  documentType: null,
  documentNumber: '',
  frontDoc: null,
  backDoc: null,
  disclosures: DEFAULT_DISCLOSURES,

  setCountry: (country) => set({ country }),
  setTaxIdType: (taxIdType) => set({ taxIdType }),
  setTaxId: (taxId) => set({ taxId }),
  setDocumentType: (documentType) => set({ documentType }),
  setDocumentNumber: (documentNumber) => set({ documentNumber }),

  setDocument: (side, document) =>
    set((state) => ({
      ...state,
      [side === 'front' ? 'frontDoc' : 'backDoc']: document,
    })),

  setDisclosure: (key, value) =>
    set((state) => ({
      disclosures: { ...state.disclosures, [key]: value },
    })),

  resetKycState: () =>
    set({
      country: 'USA',
      taxIdType: 'ssn',
      taxId: '',
      documentType: null,
      documentNumber: '',
      frontDoc: null,
      backDoc: null,
      disclosures: DEFAULT_DISCLOSURES,
    }),
}));
