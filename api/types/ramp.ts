/**
 * RampHub Types
 * Unified NGN on/off ramp — best rate via RampHub (primary), Paj fallback.
 */

export interface RampQuote {
  side: string;
  provider: string;
  asset: string;
  chain: string;
  currency: string;
  rate: number;
  estimatedOutput: number;
  tokenAmount: number;
  fee: number;
}

export interface RampBank {
  bankCode: string;
  bankName: string;
}

export interface RampResolvedAccount {
  success: boolean;
  accountName: string;
  accountNumber: string;
  bankCode: string;
}

export interface RampOnrampOrder {
  transactionId: string;
  provider: string;
  accountNumber: string;
  accountName: string;
  bank: string;
  fiatAmount: number;
  rate: number;
  asset: string;
  instructions: string;
}

export interface RampOfframpOrder {
  transactionId: string;
  provider: string;
  fiatAmount: number;
  rate: number;
  railFee: number;
  status: string;
}

/** Returned by GET /v1/funding/ramp/orders/:id/status */
export interface RampOrderStatus {
  transactionId: string;
  /** Normalized: pending | paid | processing | completed | failed */
  status: string;
  side: string;
  fiatAmount: number;
  tokenAmount: number;
  rate: number;
}

/** Returned by GET /v1/funding/ramp/orders (history) */
export interface RampOrder {
  transactionId: string;
  orderType: string;
  status: string;
  provider: string;
  fiatAmount: number;
  tokenAmount: number;
  asset: string;
  currency: string;
  rate: number;
  createdAt: string;
}
