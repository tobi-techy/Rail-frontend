type AmountErrorInput = {
  availableBalance: number;
  isFundFlow: boolean;
  limitLabel: string;
  numericAmount: number;
  withdrawalLimit: number;
};

type DestinationErrorInput = {
  destinationInput: string;
  isAssetTradeMethod: boolean;
  isCryptoDestinationMethod: boolean;
  isFiatMethod: boolean;
  isMobileWalletFundingFlow: boolean;
  destinationChain?: string;
};

type DestinationSanitizeInput = {
  isAssetTradeMethod: boolean;
  isFiatMethod: boolean;
  value: string;
};

type FlowLabelsInput = {
  isAssetBuyMethod: boolean;
  isAssetTradeMethod: boolean;
  isFundFlow: boolean;
};

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export const toDisplayAmount = (rawAmount: string) => {
  const normalized = rawAmount || '0';
  const hasDecimal = normalized.includes('.');
  const [intPartRaw, decimalPart = ''] = normalized.split('.');

  const intPart = intPartRaw.replace(/^0+(?=\d)/, '') || '0';
  const groupedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return hasDecimal ? `${groupedInt}.${decimalPart}` : groupedInt;
};

export const normalizeAmount = (nextValue: string) => {
  if (!nextValue || nextValue === '.') {
    return '0';
  }

  if (nextValue.includes('.')) {
    const [intPartRaw, decimalPart = ''] = nextValue.split('.');
    const intPart = intPartRaw.replace(/^0+(?=\d)/, '') || '0';
    return `${intPart}.${decimalPart}`;
  }

  return nextValue.replace(/^0+(?=\d)/, '') || '0';
};

export const formatMaxAmount = (amount: number) => {
  const fixed = amount.toFixed(2);
  return fixed.endsWith('.00') ? String(Math.trunc(amount)) : fixed;
};

export const safeName = (value?: string) => value?.trim() || '';

export { normalizePasskeyGetRequest } from '@/utils/passkeyNative';

export const getAmountError = ({
  availableBalance,
  isFundFlow,
  limitLabel,
  numericAmount,
  withdrawalLimit,
}: AmountErrorInput) => {
  if (numericAmount <= 0) return 'Enter an amount greater than $0.00.';
  if (numericAmount < 1) return 'Minimum withdrawal is $1.00.';
  if (numericAmount > withdrawalLimit) {
    return `This amount is above your ${limitLabel.toLowerCase()} of $${formatCurrency(withdrawalLimit)}.`;
  }
  if (!isFundFlow && numericAmount > availableBalance) {
    // return `Insufficient balance. You have $${formatCurrency(availableBalance)} available.`;
  }
  return '';
};

export const getDestinationError = ({
  destinationInput,
  isAssetTradeMethod,
  isCryptoDestinationMethod,
  isFiatMethod,
  isMobileWalletFundingFlow,
  destinationChain,
}: DestinationErrorInput) => {
  if (isMobileWalletFundingFlow) {
    return '';
  }

  if (!destinationInput.trim()) {
    if (isFiatMethod) return 'Routing number is required.';
    if (isAssetTradeMethod) return 'Asset symbol is required.';
    return 'Wallet address is required.';
  }

  if (isFiatMethod) {
    const digitsOnly = destinationInput.replace(/\D/g, '');
    if (digitsOnly.length !== 9) {
      return 'Routing number must be exactly 9 digits.';
    }
    // ABA checksum: 3*(d0+d3+d6) + 7*(d1+d4+d7) + 1*(d2+d5+d8) must be divisible by 10
    const d = digitsOnly.split('').map(Number);
    const checksum = 3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8]);
    if (checksum % 10 !== 0) {
      return 'Routing number is invalid. Please double-check it.';
    }
  }

  if (isAssetTradeMethod) {
    const ticker = destinationInput.trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9.-]{0,11}$/.test(ticker)) {
      return 'Enter a valid asset symbol (e.g. AAPL).';
    }
  }

  if (isCryptoDestinationMethod) {
    const trimmedAddress = destinationInput.trim();
    // Basic base58 check for Solana (32-44 chars, no 0/O/I/l)
    const isSolanaLike = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmedAddress);
    // Basic hex check for EVM (0x + 40 hex chars)
    const isEvmLike = /^0x[0-9a-fA-F]{40}$/.test(trimmedAddress);
    const isEvmChain = ['MATIC', 'CELO', 'BASE', 'AVAX'].includes(destinationChain ?? '');
    const isSolChain = !isEvmChain;

    if (isSolChain && isEvmLike) {
      return 'Please enter a Solana address for this network.';
    }
    if (isEvmChain && isSolanaLike) {
      return 'Please enter an EVM address (starting with 0x) for this network.';
    }
    if (!isSolanaLike && !isEvmLike) {
      return 'Enter a valid wallet address.';
    }
  }

  return '';
};

export const sanitizeDestinationInput = ({
  isAssetTradeMethod,
  isFiatMethod,
  value,
}: DestinationSanitizeInput) => {
  if (isFiatMethod) {
    return value.replace(/\D/g, '').slice(0, 9);
  }

  if (isAssetTradeMethod) {
    return value
      .toUpperCase()
      .replace(/[^A-Z0-9.-]/g, '')
      .slice(0, 12);
  }

  return value;
};

export const getFiatAccountNumberError = (accountNumber: string): string => {
  const digits = accountNumber.replace(/\D/g, '');
  if (!digits) return 'Account number is required.';
  if (digits.length < 4 || digits.length > 17) return 'Account number must be 4–17 digits.';
  return '';
};

export const getFlowLabels = ({
  isAssetBuyMethod,
  isAssetTradeMethod,
  isFundFlow,
}: FlowLabelsInput) => ({
  balanceLabel: isAssetBuyMethod
    ? 'Buying power'
    : isAssetTradeMethod
      ? 'Invest balance'
      : 'Balance',
  flowTitle: isAssetTradeMethod ? 'Trade' : isFundFlow ? 'Fund' : 'Withdraw',
  authorizeTitle: isAssetTradeMethod
    ? 'Confirm order'
    : isFundFlow
      ? 'Confirm funding'
      : 'Confirm withdrawal',
  submittingTitle: isAssetTradeMethod
    ? 'Preparing order...'
    : isFundFlow
      ? 'Submitting funding...'
      : 'Submitting withdrawal...',
});
