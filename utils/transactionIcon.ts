import type { SvgProps } from 'react-native-svg';
import * as SvgAssets from '@/assets/svg';

export type SvgComponent = React.ComponentType<SvgProps>;

export type ResolvedAssetIcon = {
  Token: SvgComponent;
  bgColor?: string;
  withBorder?: boolean;
  isSymbol?: boolean;
};

const TOKEN_ICON_BY_SYMBOL: Record<string, SvgComponent> = {
  USDC: SvgAssets.UsdcIcon,
  USDT: SvgAssets.UsdtIcon,
  SOL: SvgAssets.SolanaIcon,
  SOLANA: SvgAssets.SolanaIcon,
  BNB: SvgAssets.BnbIcon,
  MATIC: SvgAssets.MaticIcon,
  BASE: SvgAssets.BaseIcon,
  AVAX: SvgAssets.AvalancheIcon,
  AVALANCHE: SvgAssets.AvalancheIcon,
  NGN: SvgAssets.NgnIcon,
  USD: SvgAssets.UsdIcon,
  GBP: SvgAssets.GbpIcon,
  EUR: SvgAssets.EurIcon,
  CAD: SvgAssets.CadIcon,
  MXN: SvgAssets.MxnIcon,
};

const FIAT_ICON_BY_SYMBOL: Record<string, SvgComponent> = {
  USD: SvgAssets.UsdIcon,
  EUR: SvgAssets.EurIcon,
  GBP: SvgAssets.GbpIcon,
  NGN: SvgAssets.NgnIcon,
  CAD: SvgAssets.CadIcon,
  MXN: SvgAssets.MxnIcon,
};

const COMPANY_LOGO_BY_ALIAS: Record<string, SvgComponent> = {
  adidas: SvgAssets.AdidasLogo,
  airbnb: SvgAssets.AirbnbLogo,
  amazon: SvgAssets.AmazonLogo,
  apple: SvgAssets.AppleLogo,
  asianpaints: SvgAssets.AsianPaintsLogo,
  asus: SvgAssets.AsusLogo,
  audi: SvgAssets.AudiLogo,
  bitcon: SvgAssets.BitconLogo,
  bitcoin: SvgAssets.BitconLogo,
  blinkit: SvgAssets.BlinkitLogo,
  bmw: SvgAssets.BmwLogo,
  cocacola: SvgAssets.CocacolaLogo,
  coca: SvgAssets.CocacolaLogo,
  discord: SvgAssets.DiscordLogo,
  facebook: SvgAssets.FacebookLogo,
  fila: SvgAssets.FilaLogo,
  flipkart: SvgAssets.FlipkartLogo,
  ford: SvgAssets.FordLogo,
  gpay: SvgAssets.GpayLogo,
  googlepay: SvgAssets.GpayLogo,
  hdfc: SvgAssets.HdfcLogo,
  hero: SvgAssets.HeroLogo,
  honda: SvgAssets.HondaLogo,
  hp: SvgAssets.HpLogo,
  ikea: SvgAssets.IkeaLogo,
  instagram: SvgAssets.InstagramLogo,
  inter: SvgAssets.InterLogo,
  kia: SvgAssets.KiaLogo,
  lenovo: SvgAssets.LenovoLogo,
  mahindra: SvgAssets.MahindraLogo,
  mcdonalds: SvgAssets.McdonaldsLogo,
  mercedes: SvgAssets.MercedesLogo,
  netflix: SvgAssets.NetflixLogo,
  nike: SvgAssets.NikeLogo,
  nokia: SvgAssets.NokiaLogo,
  oppo: SvgAssets.OppoLogo,
  paypal: SvgAssets.PaypalLogo,
  pepsi: SvgAssets.PepsiLogo,
  puma: SvgAssets.PumaLogo,
  rbi: SvgAssets.RbiLogo,
  royalenfield: SvgAssets.RoyalenfieldLogo,
  samsung: SvgAssets.SamsungLogo,
  sbi: SvgAssets.SbiLogo,
  skoda: SvgAssets.SkodaLogo,
  starbucks: SvgAssets.StarbucksLogo,
  suzuki: SvgAssets.SuzukiLogo,
  swiggy: SvgAssets.SwiggyLogo,
  tata: SvgAssets.TataLogo,
  tesla: SvgAssets.TeslaLogo,
  toyata: SvgAssets.ToyataLogo,
  toyota: SvgAssets.ToyataLogo,
  tvs: SvgAssets.TvsLogo,
  visa: SvgAssets.VisaLogo,
  vivo: SvgAssets.VivoLogo,
  twitter: SvgAssets.XLogo,
};

const COMPANY_ALIAS_ENTRIES = Object.entries(COMPANY_LOGO_BY_ALIAS).sort(
  ([a], [b]) => b.length - a.length
);
const COMPACT_ALIAS_MATCH = new Set([
  'asianpaints',
  'cocacola',
  'googlepay',
  'mcdonalds',
  'royalenfield',
]);

const normalizeSymbol = (value?: string) =>
  value
    ?.trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '') ?? '';

const tokenizeSymbols = (value?: string) =>
  (value ?? '')
    .split(/[\s,./|()\-_:·]+/)
    .map(normalizeSymbol)
    .filter(Boolean);

const normalizeCompanyValue = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const resolveSymbolIcon = (symbol?: string): ResolvedAssetIcon | null => {
  const n = normalizeSymbol(symbol);
  if (!n) return null;
  if (FIAT_ICON_BY_SYMBOL[n]) {
    const isNgn = n === 'NGN';
    return {
      Token: FIAT_ICON_BY_SYMBOL[n],
      bgColor: isNgn ? '#008751' : '#FFFFFF',
      withBorder: !isNgn,
      isSymbol: isNgn,
    };
  }
  if (TOKEN_ICON_BY_SYMBOL[n]) return { Token: TOKEN_ICON_BY_SYMBOL[n], bgColor: 'transparent' };
  return null;
};

const resolveSymbolIconFromText = (value?: string): ResolvedAssetIcon | null => {
  for (const token of tokenizeSymbols(value)) {
    const icon = resolveSymbolIcon(token);
    if (icon) return icon;
  }
  return null;
};

const resolveCompanyLogo = (
  values: (string | undefined)[]
): { Token: SvgComponent; bgColor: string; withBorder: true } | null => {
  const joined = values.filter(Boolean).join(' ');
  if (!joined) return null;
  const compact = normalizeCompanyValue(joined);
  const parts = joined
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  for (const [alias, Logo] of COMPANY_ALIAS_ENTRIES) {
    if (parts.includes(alias) || (COMPACT_ALIAS_MATCH.has(alias) && compact.includes(alias))) {
      return { Token: Logo, bgColor: '#FFFFFF', withBorder: true };
    }
  }
  return null;
};

export interface TransactionIconInput {
  assetSymbol?: string;
  currency?: string;
  title?: string;
  subtitle?: string;
  merchant?: string;
}

export const resolveTransactionAssetIcon = (tx: TransactionIconInput): ResolvedAssetIcon | null => {
  const fromFields = [
    resolveSymbolIcon(tx.assetSymbol),
    resolveSymbolIcon(tx.currency),
    resolveSymbolIconFromText(tx.title),
    resolveSymbolIconFromText(tx.subtitle),
  ].find(Boolean);
  return fromFields ?? resolveCompanyLogo([tx.merchant, tx.title, tx.subtitle]);
};
