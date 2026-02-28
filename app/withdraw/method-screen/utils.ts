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
  if (numericAmount > withdrawalLimit) {
    return `This amount is above your ${limitLabel.toLowerCase()} of $${formatCurrency(withdrawalLimit)}.`;
  }
  if (!isFundFlow && numericAmount > availableBalance) {
    return `Insufficient funds. You need $${formatCurrency(numericAmount - availableBalance)} more.`;
  }
  return '';
};

export const getDestinationError = ({
  destinationInput,
  isAssetTradeMethod,
  isCryptoDestinationMethod,
  isFiatMethod,
  isMobileWalletFundingFlow,
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
  }

  if (isAssetTradeMethod) {
    const ticker = destinationInput.trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9.-]{0,11}$/.test(ticker)) {
      return 'Enter a valid asset symbol (e.g. AAPL).';
    }
  }

  if (isCryptoDestinationMethod) {
    const trimmedAddress = destinationInput.trim();
    if (trimmedAddress.length < 18) {
      return 'Wallet address looks too short.';
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
