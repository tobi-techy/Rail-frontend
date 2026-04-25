import type { ExtendedWithdrawMethod, FundingFlow, MethodCopy } from './types';

export const BRAND_RED = '#FF2E01';

export const springConfig = { damping: 15, stiffness: 200, mass: 0.8 };
export const gentleSpring = { damping: 20, stiffness: 150, mass: 1 };
export const FUNDING_POLL_INTERVAL_MS = 2_000;
export const FUNDING_POLL_TIMEOUT_MS = 90_000;
export const FALLBACK_AVAILABLE_BALANCE = 0;
export const MAX_INTEGER_DIGITS = 9;

const METHOD_ALIASES: Record<string, ExtendedWithdrawMethod> = {
  fiat: 'fiat',
  crypto: 'crypto',
  phantom: 'phantom',
  solflare: 'solflare',
  'fund-phantom': 'phantom',
  'fund-solflare': 'solflare',
  'fund-mwa': 'mwa-fund',
  'mwa-fund': 'mwa-fund',
  'mwa-withdraw': 'mwa-withdraw',
  'asset-buy': 'asset-buy',
  'asset-sell': 'asset-sell',
  'stock-buy': 'asset-buy',
  'stock-sell': 'asset-sell',
  'buy-stock': 'asset-buy',
  'sell-stock': 'asset-sell',
  buy: 'asset-buy',
  sell: 'asset-sell',
  p2p: 'p2p',
  railtag: 'railtag',
  email: 'email',
  contact: 'contact',
  send: 'p2p',
};

const METHOD_COPY: Record<ExtendedWithdrawMethod, MethodCopy> = {
  fiat: {
    title: 'Withdraw to Bank',
    subtitle: 'Send funds to your bank account',
    limitLabel: 'Fiat withdrawal limit',
    detailTitle: 'Enter bank details',
    detailHint: 'We use your bank details to deliver your withdrawal.',
    detailLabel: 'Bank details',
    detailPlaceholder: 'Enter your bank details',
  },
  crypto: {
    title: 'Withdraw to Wallet',
    subtitle: 'Send assets to an external wallet address',
    limitLabel: 'Crypto withdrawal limit',
    detailTitle: 'Add wallet address',
    detailHint: 'Double-check this address. Crypto withdrawals cannot be reversed.',
    detailLabel: 'Wallet address',
    detailPlaceholder: 'Paste wallet address',
  },
  phantom: {
    title: 'Send to Phantom',
    subtitle: 'Send assets to your Phantom wallet',
    limitLabel: 'Wallet withdrawal limit',
    detailTitle: 'Add Phantom wallet address',
    detailHint: 'Use your Solana wallet address from Phantom.',
    detailLabel: 'Phantom wallet address',
    detailPlaceholder: 'Paste Phantom address',
  },
  solflare: {
    title: 'Send to Solflare',
    subtitle: 'Send assets to your Solflare wallet',
    limitLabel: 'Wallet withdrawal limit',
    detailTitle: 'Add Solflare wallet address',
    detailHint: 'Use your Solana wallet address from Solflare.',
    detailLabel: 'Solflare wallet address',
    detailPlaceholder: 'Paste Solflare address',
  },
  'mwa-withdraw': {
    title: 'Withdraw to Wallet',
    subtitle: 'Send USDC to your Solana wallet via MWA',
    limitLabel: 'Wallet withdrawal limit',
    detailTitle: 'Withdraw to Wallet',
    detailHint: 'Your wallet app will open to confirm your address. No signing required.',
    detailLabel: 'Wallet',
    detailPlaceholder: '',
  },
  'mwa-fund': {
    title: 'Fund with Wallet',
    subtitle: 'Send USDC from your Solana wallet into Rail',
    limitLabel: 'Funding limit',
    detailTitle: 'Confirm funding details',
    detailHint: 'Your wallet will open to sign the USDC transfer into Rail.',
    detailLabel: 'Wallet',
    detailPlaceholder: '',
  },
  'asset-buy': {
    title: 'Buy asset',
    subtitle: 'Set amount and symbol for an asset buy',
    limitLabel: 'Asset buy limit',
    detailTitle: 'Add asset symbol',
    detailHint: 'Use the symbol you want to buy, like AAPL, SPY, or BTC.',
    detailLabel: 'Asset symbol',
    detailPlaceholder: 'AAPL',
  },
  'asset-sell': {
    title: 'Sell asset',
    subtitle: 'Set amount and symbol for an asset sell',
    limitLabel: 'Asset sell limit',
    detailTitle: 'Add asset symbol',
    detailHint: 'Use the symbol you want to sell, like AAPL, SPY, or BTC.',
    detailLabel: 'Asset symbol',
    detailPlaceholder: 'AAPL',
  },
  p2p: {
    title: 'Send to someone',
    subtitle: 'Send money via RailTag, email, or phone',
    limitLabel: 'P2P send limit',
    detailTitle: 'Who are you sending to?',
    detailHint: 'Enter a RailTag, email, or phone number.',
    detailLabel: 'Recipient',
    detailPlaceholder: '@railtag, email, or phone',
  },
  railtag: {
    title: 'Send via RailTag',
    subtitle: 'Instant send to any Rail user by their @tag',
    limitLabel: 'P2P send limit',
    detailTitle: 'Enter RailTag',
    detailHint: 'RailTags start with @. Funds arrive instantly.',
    detailLabel: 'RailTag',
    detailPlaceholder: '@username',
  },
  email: {
    title: 'Send via Email',
    subtitle: 'Send money to anyone by email address',
    limitLabel: 'P2P send limit',
    detailTitle: 'Enter email address',
    detailHint: "If they're not on Rail yet, they'll get an invite to claim.",
    detailLabel: 'Email',
    detailPlaceholder: 'name@example.com',
  },
  contact: {
    title: 'Send to Contact',
    subtitle: 'Pick someone from your contacts',
    limitLabel: 'P2P send limit',
    detailTitle: 'Search contacts',
    detailHint: 'Send to anyone in your phone contacts.',
    detailLabel: 'Contact',
    detailPlaceholder: 'Search name or number',
  },
};

// Default limits - these should be fetched from API based on user's KYC tier
// TODO: Fetch limits from API endpoint /v1/limits or similar
export const LIMITS: Record<ExtendedWithdrawMethod, number> = {
  fiat: 10_000,
  crypto: 50_000,
  phantom: 50_000,
  solflare: 50_000,
  'mwa-withdraw': 50_000,
  'mwa-fund': 50_000,
  'asset-buy': 100_000,
  'asset-sell': 100_000,
  p2p: 10_000,
  railtag: 10_000,
  email: 10_000,
  contact: 10_000,
};

export function getWithdrawalLimit(method: ExtendedWithdrawMethod): number {
  // In production, this should fetch from API based on user's KYC tier
  // For now, return hardcoded limit
  return LIMITS[method] ?? 10_000;
}

export const resolveMethod = (value?: string): ExtendedWithdrawMethod => {
  if (!value) return 'crypto';
  return METHOD_ALIASES[value.toLowerCase()] ?? 'crypto';
};

export const resolveFlow = (value?: string): FundingFlow => {
  if (!value) return 'send';
  return value.toLowerCase() === 'fund' ? 'fund' : 'send';
};

export const isWalletFundingMethod = (
  method: ExtendedWithdrawMethod
): method is 'phantom' | 'solflare' | 'mwa-fund' =>
  method === 'phantom' || method === 'solflare' || method === 'mwa-fund';

export const isP2PMethod = (
  method: ExtendedWithdrawMethod
): method is 'p2p' | 'railtag' | 'email' | 'contact' =>
  method === 'p2p' || method === 'railtag' || method === 'email' || method === 'contact';

export const getMethodCopy = (method: ExtendedWithdrawMethod, isFundFlow: boolean): MethodCopy => {
  const base = METHOD_COPY[method];
  if (!isFundFlow) return base;

  if (method === 'phantom') {
    return {
      ...base,
      title: 'Fund with Phantom',
      subtitle: 'Send USDC from Phantom into your Rail wallet',
      limitLabel: 'Funding limit',
      detailTitle: 'Confirm funding details',
      detailHint: 'You will be redirected to Phantom to confirm this transfer.',
      detailLabel: 'Wallet',
      detailPlaceholder: 'Phantom',
    };
  }

  if (method === 'solflare') {
    return {
      ...base,
      title: 'Fund with Solflare',
      subtitle: 'Send USDC from Solflare into your Rail wallet',
      limitLabel: 'Funding limit',
      detailTitle: 'Confirm funding details',
      detailHint: 'You will be redirected to Solflare to confirm this transfer.',
      detailLabel: 'Wallet',
      detailPlaceholder: 'Solflare',
    };
  }

  if (method === 'crypto') {
    return {
      ...base,
      title: 'Fund with Wallet',
      subtitle: 'Move assets from your wallet into Rail',
      limitLabel: 'Funding limit',
    };
  }

  return base;
};
