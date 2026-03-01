import type { ExtendedWithdrawMethod, FundingFlow, MethodCopy } from './types';

export const BRAND_RED = '#FF2E01';

export const springConfig = { damping: 15, stiffness: 200, mass: 0.8 };
export const gentleSpring = { damping: 20, stiffness: 150, mass: 1 };
export const FUNDING_POLL_INTERVAL_MS = 2_000;
export const FUNDING_POLL_TIMEOUT_MS = 90_000;
export const FALLBACK_AVAILABLE_BALANCE = 0;
export const MAX_INTEGER_DIGITS = 12;

const METHOD_ALIASES: Record<string, ExtendedWithdrawMethod> = {
  fiat: 'fiat',
  crypto: 'crypto',
  phantom: 'phantom',
  solflare: 'solflare',
  'fund-phantom': 'phantom',
  'fund-solflare': 'solflare',
  'asset-buy': 'asset-buy',
  'asset-sell': 'asset-sell',
  'stock-buy': 'asset-buy',
  'stock-sell': 'asset-sell',
  'buy-stock': 'asset-buy',
  'sell-stock': 'asset-sell',
  buy: 'asset-buy',
  sell: 'asset-sell',
};

const METHOD_COPY: Record<ExtendedWithdrawMethod, MethodCopy> = {
  fiat: {
    title: 'Withdraw to Bank',
    subtitle: 'Send USD to a linked US bank account',
    limitLabel: 'Fiat withdrawal limit',
    detailTitle: 'Add bank routing number',
    detailHint: 'We use this routing number to deliver your fiat withdrawal.',
    detailLabel: 'Routing number',
    detailPlaceholder: '9-digit routing number',
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
};

export const LIMITS: Record<ExtendedWithdrawMethod, number> = {
  fiat: 10_000,
  crypto: 50_000,
  phantom: 50_000,
  solflare: 50_000,
  'asset-buy': 100_000,
  'asset-sell': 100_000,
};

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
): method is 'phantom' | 'solflare' => method === 'phantom' || method === 'solflare';

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
