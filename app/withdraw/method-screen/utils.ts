import type { FiatCurrency } from './types';

type AmountErrorInput = {
  availableBalance: number;
  isFundFlow: boolean;
  limitLabel: string;
  numericAmount: number;
  withdrawalLimit: number;
  feeAmount?: number;
  currencySymbol?: string;
};

type DestinationErrorInput = {
  destinationInput: string;
  isAssetTradeMethod: boolean;
  isCryptoDestinationMethod: boolean;
  isFiatMethod: boolean;
  isMobileWalletFundingFlow: boolean;
  destinationChain?: string;
  fiatCurrency?: FiatCurrency;
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
  feeAmount = 0,
  currencySymbol = '$',
}: AmountErrorInput) => {
  if (numericAmount <= 0) return `Enter an amount greater than ${currencySymbol}0.00.`;
  if (numericAmount < 1) return `Minimum withdrawal is ${currencySymbol}1.00.`;
  if (numericAmount > withdrawalLimit) {
    return `This amount is above your ${limitLabel.toLowerCase()} of ${currencySymbol}${formatCurrency(withdrawalLimit)}.`;
  }
  const totalWithFee = numericAmount + feeAmount;
  if (!isFundFlow && totalWithFee > availableBalance) {
    const maxAfterFee = Math.max(0, availableBalance - feeAmount);
    return `Insufficient balance. Max withdrawable is ${currencySymbol}${formatCurrency(maxAfterFee)} (includes ${currencySymbol}${feeAmount.toFixed(2)} fee).`;
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
  fiatCurrency,
}: DestinationErrorInput) => {
  if (isMobileWalletFundingFlow) {
    return '';
  }

  if (!destinationInput.trim()) {
    if (isFiatMethod) {
      if (fiatCurrency === 'EUR') return 'IBAN is required.';
      if (fiatCurrency === 'GBP') return 'Sort code is required.';
      return 'Routing number is required.';
    }
    if (isAssetTradeMethod) return 'Asset symbol is required.';
    return 'Wallet address is required.';
  }

  if (isFiatMethod) {
    if (fiatCurrency === 'EUR') {
      return getIbanError(destinationInput);
    }
    if (fiatCurrency === 'GBP') {
      return getGbpSortCodeError(destinationInput);
    }
    // USD
    const digitsOnly = destinationInput.replace(/\D/g, '');
    if (digitsOnly.length !== 9) {
      return 'Routing number must be exactly 9 digits.';
    }
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
    // Starknet: 0x + up to 64 hex chars
    const isStarknetLike = /^0x[0-9a-fA-F]{1,64}$/.test(trimmedAddress);
    const isStarknetChain = destinationChain === 'STARKNET';
    const isEvmChain = [
      'ETH',
      'BASE',
      'ARB',
      'OP',
      'MATIC',
      'AVAX',
      'BSC',
      'MONAD',
      'HYPEREVM',
      'LISK',
    ].includes(destinationChain ?? '');
    const isSolChain = !isEvmChain && !isStarknetChain;

    if (isStarknetChain) {
      if (!isStarknetLike) {
        return 'Enter a valid Starknet address (0x followed by up to 64 hex characters).';
      }
      return '';
    }
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
  fiatCurrency,
}: DestinationSanitizeInput & { fiatCurrency?: FiatCurrency }) => {
  if (isFiatMethod) {
    if (fiatCurrency === 'EUR')
      return value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 34);
    if (fiatCurrency === 'GBP') return value.replace(/\D/g, '').slice(0, 6);
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

export const getIbanError = (iban: string): string => {
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  if (!cleaned) return 'IBAN is required.';
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(cleaned)) {
    return 'Enter a valid IBAN (e.g. DE89370400440532013000).';
  }
  return '';
};

export const getGbpSortCodeError = (sortCode: string): string => {
  const digits = sortCode.replace(/\D/g, '');
  if (!digits) return 'Sort code is required.';
  if (!/^\d{6}$/.test(digits)) return 'Sort code must be exactly 6 digits.';
  return '';
};

export const getGbpAccountNumberError = (accountNumber: string): string => {
  const digits = accountNumber.replace(/\D/g, '');
  if (!digits) return 'Account number is required.';
  if (!/^\d{8}$/.test(digits)) return 'Account number must be exactly 8 digits.';
  return '';
};

export const getBicError = (bic: string): string => {
  if (!bic.trim()) return ''; // optional
  const cleaned = bic.replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cleaned)) {
    return 'BIC must be 8 or 11 characters (e.g. COBADEFFXXX).';
  }
  return '';
};

export const getFiatAccountNumberError = (
  accountNumber: string,
  fiatCurrency?: FiatCurrency
): string => {
  if (fiatCurrency === 'GBP') return getGbpAccountNumberError(accountNumber);
  // EUR doesn't use a separate account number field (IBAN covers it)
  if (fiatCurrency === 'EUR') return '';
  // USD default
  const digits = accountNumber.replace(/\D/g, '');
  if (!digits) return 'Account number is required.';
  if (digits.length < 4 || digits.length > 17) return 'Account number must be 4–17 digits.';
  return '';
};

export const formatSortCode = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 6);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
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
