export type WithdrawMethod = 'fiat' | 'crypto';

export type P2PMethod = 'p2p' | 'railtag' | 'email' | 'contact';

export type ExtendedWithdrawMethod =
  | WithdrawMethod
  | 'phantom'
  | 'solflare'
  | 'mwa-fund'
  | 'mwa-withdraw'
  | 'asset-buy'
  | 'asset-sell'
  | P2PMethod;

export type FundingFlow = 'send' | 'fund';

/** Step-based withdrawal flow states */
export type WithdrawalStep =
  | 'amount' // Step 1: Amount entry (red keypad)
  | 'destination' // Step 2: Wallet address / bank details
  | 'details' // Step 3: Category, narration, review
  | 'confirm'; // Step 4: Final review + auth

export type FiatCurrency = 'USD' | 'EUR' | 'GBP' | 'NGN';

export type MethodCopy = {
  title: string;
  subtitle: string;
  limitLabel: string;
  detailTitle: string;
  detailHint: string;
  detailLabel: string;
  detailPlaceholder: string;
};

export type ProfileNamePayload = {
  email?: string;
};

export type WebAuthnOptionsPayload = {
  publicKey?: Record<string, any>;
  [key: string]: any;
};

/** Withdrawal flow state for step-based navigation */
export interface WithdrawalFlowState {
  step: WithdrawalStep;
  amount: string;
  destination: string;
  chain: string;
  fiatCurrency: FiatCurrency;
  fiatHolderName: string;
  fiatAccountNumber: string;
  category: string;
  narration: string;
}
