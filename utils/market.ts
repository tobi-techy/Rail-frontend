import type { MarketInstrumentCard, MarketInstrumentQuote } from '@/api/types';

export const toNumber = (value: string | number | null | undefined): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = Number.parseFloat(value ?? '');
  return Number.isFinite(parsed) ? parsed : 0;
};

const firstPositive = (values: (string | number | null | undefined)[]): number => {
  for (const value of values) {
    const parsed = toNumber(value);
    if (parsed > 0) return parsed;
  }
  return 0;
};

export const getEffectivePrice = (quote: MarketInstrumentQuote): number =>
  firstPositive([
    quote.price,
    quote.previous_close,
    quote.open,
    quote.high,
    quote.low,
    quote.bid,
    quote.ask,
  ]);

export const getEffectivePreviousClose = (quote: MarketInstrumentQuote): number =>
  firstPositive([quote.previous_close, quote.open, quote.price]);

export const getEffectiveChange = (quote: MarketInstrumentQuote): number => {
  const rawChange = toNumber(quote.change);
  if (rawChange !== 0) return rawChange;

  const price = getEffectivePrice(quote);
  const previousClose = getEffectivePreviousClose(quote);
  if (price > 0 && previousClose > 0) return price - previousClose;
  return 0;
};

export const getEffectiveChangePct = (quote: MarketInstrumentQuote): number => {
  const rawChangePct = toNumber(quote.change_pct);
  if (rawChangePct !== 0) return rawChangePct;

  const change = getEffectiveChange(quote);
  const previousClose = getEffectivePreviousClose(quote);
  if (previousClose > 0) return (change / previousClose) * 100;
  return 0;
};

export const hasMeaningfulQuote = (asset: MarketInstrumentCard): boolean =>
  getEffectivePrice(asset.quote) > 0;

export const sanitizeAssets = (assets: MarketInstrumentCard[]): MarketInstrumentCard[] =>
  assets.filter(hasMeaningfulQuote);
