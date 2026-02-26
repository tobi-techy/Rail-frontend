import React from 'react';
import { View, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { SvgProps } from 'react-native-svg';
import { Icon, Skeleton } from '../atoms';
import * as SvgAssets from '@/assets/svg';
import { useUIStore } from '@/stores';
import { MaskedBalance } from './MaskedBalance';

export type TransactionType = 'send' | 'receive' | 'swap' | 'deposit' | 'withdraw';
export type TransactionStatus = 'completed' | 'pending' | 'failed';
export type SvgComponent = React.ComponentType<SvgProps>;

export interface Transaction {
  id: string;
  type: TransactionType;
  title: string;
  subtitle: string;
  amount: number;
  currency?: string;
  assetSymbol?: string;
  merchant?: string;
  status: TransactionStatus;
  createdAt: Date;
  txHash?: string;
  toAddress?: string;
  fee?: string;
  icon?: {
    type: 'token' | 'icon' | 'swap';
    Token?: SvgComponent;
    bgColor?: string;
    iconName?: string;
    SwapFrom?: SvgComponent;
    SwapTo?: SvgComponent;
    swapFromBg?: string;
    swapToBg?: string;
  };
}

export interface TransactionItemProps extends TouchableOpacityProps {
  transaction: Transaction;
}

const formatAmount = (amount: number, type: TransactionType, currency = 'NGN') => {
  const isCredit = type === 'receive' || type === 'deposit';
  const sign = isCredit ? '+' : '-';
  const abs = Math.abs(amount);
  const hasDecimals = abs % 1 !== 0;
  const num = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(abs);
  return { text: `${sign}${num} ${currency}`, isCredit };
};

type ResolvedAssetIcon = {
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
  ([left], [right]) => right.length - left.length
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
    .map((token) => normalizeSymbol(token))
    .filter(Boolean);

const normalizeCompanyValue = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const resolveSymbolIcon = (symbol?: string): ResolvedAssetIcon | null => {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) return null;

  if (FIAT_ICON_BY_SYMBOL[normalized]) {
    const isNgn = normalized === 'NGN';
    return {
      Token: FIAT_ICON_BY_SYMBOL[normalized],
      bgColor: isNgn ? '#008751' : '#FFFFFF',
      withBorder: !isNgn,
      isSymbol: isNgn,
    };
  }

  if (TOKEN_ICON_BY_SYMBOL[normalized]) {
    return {
      Token: TOKEN_ICON_BY_SYMBOL[normalized],
      bgColor: 'transparent',
    };
  }

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

  const compactValue = normalizeCompanyValue(joined);
  const parts = joined
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  for (const [alias, Logo] of COMPANY_ALIAS_ENTRIES) {
    const isTokenMatch = parts.includes(alias);
    const isCompactMatch = COMPACT_ALIAS_MATCH.has(alias) && compactValue.includes(alias);
    const isMatch = isTokenMatch || isCompactMatch;
    if (isMatch) {
      return {
        Token: Logo,
        bgColor: '#FFFFFF',
        withBorder: true,
      };
    }
  }

  return null;
};

export const resolveTransactionAssetIcon = (transaction: Transaction): ResolvedAssetIcon | null => {
  const fromFields = [
    resolveSymbolIcon(transaction.assetSymbol),
    resolveSymbolIcon(transaction.currency),
    resolveSymbolIconFromText(transaction.title),
    resolveSymbolIconFromText(transaction.subtitle),
  ].find(Boolean);

  if (fromFields) return fromFields;

  return resolveCompanyLogo([transaction.merchant, transaction.title, transaction.subtitle]);
};

const ICON_SIZE = 44;

const TokenIcon = ({
  Token,
  bgColor,
  withBorder,
  isSymbol,
}: {
  Token?: SvgComponent;
  bgColor?: string;
  withBorder?: boolean;
  isSymbol?: boolean;
}) => (
  <View
    style={{
      width: ICON_SIZE,
      height: ICON_SIZE,
      borderRadius: ICON_SIZE / 2,
      backgroundColor: bgColor || '#1B84FF',
      borderWidth: withBorder ? 1 : 0,
      borderColor: '#E6E8EC',
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
    {Token ? (
      <Token width={isSymbol ? 28 : ICON_SIZE + 8} height={isSymbol ? 28 : ICON_SIZE + 8} />
    ) : (
      <Icon library="feather" name="dollar-sign" size={24} color="#FFFFFF" />
    )}
  </View>
);

const ActionIcon = ({ name }: { name: string }) => (
  <View className="h-12 w-12 items-center justify-center rounded-full border border-surface bg-background-main">
    <Icon library="feather" name={name} size={22} color="#757575" />
  </View>
);

const SwapIcon = ({
  SwapFrom,
  SwapTo,
  fromBg,
  toBg,
}: {
  SwapFrom?: SvgComponent;
  SwapTo?: SvgComponent;
  fromBg?: string;
  toBg?: string;
}) => (
  <View className="h-12 w-12">
    <View
      className="absolute left-0 top-0 h-8 w-8 items-center justify-center rounded-full"
      style={{ backgroundColor: fromBg || '#000' }}>
      {SwapFrom && <SwapFrom width={18} height={18} />}
    </View>
    <View
      className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-background-main"
      style={{ backgroundColor: toBg || '#1B84FF' }}>
      {SwapTo && <SwapTo width={18} height={18} />}
    </View>
  </View>
);

const TransactionIcon = ({ transaction }: { transaction: Transaction }) => {
  const { icon, type } = transaction;

  if (icon?.type === 'swap') {
    return (
      <SwapIcon
        SwapFrom={icon.SwapFrom}
        SwapTo={icon.SwapTo}
        fromBg={icon.swapFromBg}
        toBg={icon.swapToBg}
      />
    );
  }

  if (icon?.type === 'token') {
    return <TokenIcon Token={icon.Token} bgColor={icon.bgColor} />;
  }

  if (icon?.type === 'icon' && icon.iconName) {
    return <ActionIcon name={icon.iconName} />;
  }

  const inferredAssetIcon = resolveTransactionAssetIcon(transaction);
  if (inferredAssetIcon) {
    return (
      <TokenIcon
        Token={inferredAssetIcon.Token}
        bgColor={inferredAssetIcon.bgColor}
        withBorder={inferredAssetIcon.withBorder}
        isSymbol={inferredAssetIcon.isSymbol}
      />
    );
  }

  const defaultIcons: Record<TransactionType, string> = {
    send: 'arrow-up-right',
    receive: 'arrow-down-left',
    swap: 'repeat',
    deposit: 'plus',
    withdraw: 'minus',
  };

  return (
    <View className="h-12 w-12 items-center justify-center rounded-full bg-surface">
      <Icon library="feather" name={defaultIcons[type]} size={24} color="#121212" />
    </View>
  );
};

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, ...props }) => {
  const { text: amountText, isCredit } = formatAmount(
    transaction.amount,
    transaction.type,
    transaction.currency
  );
  const isPending = transaction.status === 'pending';
  const isFailed = transaction.status === 'failed';
  const isBalanceVisible = useUIStore((s) => s.isBalanceVisible);

  return (
    <TouchableOpacity className="flex-row items-center py-[10px]" activeOpacity={0.7} {...props}>
      <View className="mr-sm">
        <TransactionIcon transaction={transaction} />
      </View>

      <View className="flex-1">
        <Text className="font-subtitle text-[15px] text-text-primary" numberOfLines={1}>
          {transaction.title}
        </Text>
        <Text className="mt-[2px] font-caption text-[12px] text-text-secondary" numberOfLines={1}>
          {transaction.subtitle}
        </Text>
      </View>

      <View className="items-end">
        <MaskedBalance
          value={amountText}
          visible={isBalanceVisible}
          textClass="text-[16px]"
          colorClass={
            isPending
              ? 'text-text-secondary'
              : isFailed
                ? 'text-destructive'
                : isCredit
                  ? 'text-success'
                  : transaction.type === 'withdraw' || transaction.type === 'send'
                    ? 'text-destructive'
                    : 'text-text-primary'
          }
        />
        {isPending && (
          <Text className="mt-[2px] font-caption text-[12px] text-primary">Pending</Text>
        )}
        {isFailed && (
          <Text className="mt-[2px] font-caption text-[12px] text-destructive">Failed</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const TransactionItemSkeleton: React.FC = () => (
  <View className="flex-row items-center py-[10px]">
    <View className="mr-sm">
      <Skeleton className="h-12 w-12 rounded-full" />
    </View>

    <View className="flex-1">
      <Skeleton className="h-4 w-2/5 rounded-sm" />
      <Skeleton className="mt-[6px] h-3 w-3/5 rounded-sm" />
    </View>

    <View className="ml-3 items-end">
      <Skeleton className="h-4 w-[92px] rounded-sm" />
      <Skeleton className="mt-[6px] h-3 w-[62px] rounded-sm" />
    </View>
  </View>
);
