/**
 * Paj Cash Types
 * NGN on/off ramp via Paj Cash
 */

export interface PajRate {
  baseCurrency: string;
  targetCurrency: string;
  isActive: boolean;
  rate: number;
  type: string;
}

export interface PajRatesResponse {
  onRampRate: PajRate;
  offRampRate: PajRate;
}

export interface PajBank {
  id: string;
  code: string;
  name: string;
  logo: string;
  country: string;
}

export interface PajResolvedAccount {
  accountName: string;
  accountNumber: string;
  bank: PajBank;
}

export interface PajSavedBankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bank: string;
}

export interface PajOnrampOrder {
  orderId: string;
  accountNumber: string;
  accountName: string;
  bank: string;
  fiatAmount: number;
  tokenAmount: number;
  fee: number;
  instructions: string;
}

export interface PajOfframpOrder {
  orderId: string;
  fiatAmount: number;
  amount: number;
  rate: number;
  fee: number;
  status: string;
}

export interface PajOrderStatus {
  orderId: string;
  status: string; // INIT, PAID, COMPLETED, FAILED
  amount: number;
  fiatAmount: number;
  rate: number;
  type: string; // ON_RAMP, OFF_RAMP
}
