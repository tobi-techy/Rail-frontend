export type WithdrawMethod = 'fiat' | 'crypto';

export type ExtendedWithdrawMethod =
  | WithdrawMethod
  | 'phantom'
  | 'solflare'
  | 'asset-buy'
  | 'asset-sell';

export type FundingFlow = 'send' | 'fund';

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
