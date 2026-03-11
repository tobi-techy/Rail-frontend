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
