import React, { ComponentType } from 'react';
import { SvgProps } from 'react-native-svg';

// Import SVG icons
import AccountBalance10 from '@/assets/Icons/account-balance-10.svg';
import AccountBalanceWallet11 from '@/assets/Icons/account-balance-wallet-11.svg';
import AttachMoney9 from '@/assets/Icons/attach-money-9.svg';
import CardMembership18 from '@/assets/Icons/card-membership-18.svg';
import Checkbook29 from '@/assets/Icons/checkbook-29.svg';
import CreditCard8 from '@/assets/Icons/credit-card-8.svg';
import CurrencyBitcoin19 from '@/assets/Icons/currency-bitcoin-19.svg';
import CurrencyExchange13 from '@/assets/Icons/currency-exchange-13.svg';
import CurrencyFranc23 from '@/assets/Icons/currency-franc-23.svg';
import CurrencyLira25 from '@/assets/Icons/currency-lira-25.svg';
import CurrencyPound21 from '@/assets/Icons/currency-pound-21.svg';
import CurrencyRuble24 from '@/assets/Icons/currency-ruble-24.svg';
import CurrencyRupee16 from '@/assets/Icons/currency-rupee-16.svg';
import CurrencyRupeeCircle30 from '@/assets/Icons/currency-rupee-circle-30.svg';
import CurrencyYen22 from '@/assets/Icons/currency-yen-22.svg';
import DataExploration20 from '@/assets/Icons/data-exploration-20.svg';
import Dollar31 from '@/assets/Icons/dollar-31.svg';
import EncryptedOff7 from '@/assets/Icons/encrypted-off-7.svg';
import EnhancedEncryption0 from '@/assets/Icons/enhanced-encryption-0.svg';
import Enterprise17 from '@/assets/Icons/enterprise-17.svg';
import Ethereum33 from '@/assets/Icons/ethereum-33.svg';
import Finance26 from '@/assets/Icons/finance-26.svg';
import Loyalty14 from '@/assets/Icons/loyalty-14.svg';
import Naira32 from '@/assets/Icons/naira-32.svg';
import OrderApprove28 from '@/assets/Icons/order-approve-28.svg';
import Paid12 from '@/assets/Icons/paid-12.svg';
import Passkey4 from '@/assets/Icons/passkey-4.svg';
import PieChart15 from '@/assets/Icons/pie-chart-15.svg';
import Policy3 from '@/assets/Icons/policy-3.svg';
import PrivacyTip2 from '@/assets/Icons/privacy-tip-2.svg';
import PrivateConnectivity1 from '@/assets/Icons/private-connectivity-1.svg';
import QrCode27 from '@/assets/Icons/qr-code-27.svg';
import Savings1 from '@/assets/Icons/savings-1.svg';
import Sell0 from '@/assets/Icons/sell-0.svg';
import SendMoney7 from '@/assets/Icons/send-money-7.svg';
import ShieldLock5 from '@/assets/Icons/shield-lock-5.svg';
import ShieldPerson6 from '@/assets/Icons/shield-person-6.svg';
import UniversalCurrency6 from '@/assets/Icons/universal-currency-6.svg';
import UniversalCurrencyAlt5 from '@/assets/Icons/universal-currency-alt-5.svg';
import Usdc8 from '@/assets/Icons/usdc-8.svg';
import Wallet3 from '@/assets/Icons/wallet-3.svg';
import WaterfallChart4 from '@/assets/Icons/waterfall-chart-4.svg';
import Work2 from '@/assets/Icons/work-2.svg';

export interface SvgIconProps extends SvgProps {
  name: string;
  width?: number;
  height?: number;
  color?: string;
}

// Icon mapping
const iconMap: Record<string, ComponentType<SvgProps>> = {
  'account-balance-10': AccountBalance10,
  'account-balance-wallet-11': AccountBalanceWallet11,
  'attach-money-9': AttachMoney9,
  'card-membership-18': CardMembership18,
  'checkbook-29': Checkbook29,
  'credit-card-8': CreditCard8,
  'currency-bitcoin-19': CurrencyBitcoin19,
  'currency-exchange-13': CurrencyExchange13,
  'currency-franc-23': CurrencyFranc23,
  'currency-lira-25': CurrencyLira25,
  'currency-pound-21': CurrencyPound21,
  'currency-ruble-24': CurrencyRuble24,
  'currency-rupee-16': CurrencyRupee16,
  'currency-rupee-circle-30': CurrencyRupeeCircle30,
  'currency-yen-22': CurrencyYen22,
  'data-exploration-20': DataExploration20,
  'dollar-31': Dollar31,
  'encrypted-off-7': EncryptedOff7,
  'enhanced-encryption-0': EnhancedEncryption0,
  'enterprise-17': Enterprise17,
  'ethereum-33': Ethereum33,
  'finance-26': Finance26,
  'loyalty-14': Loyalty14,
  'naira-32': Naira32,
  'order-approve-28': OrderApprove28,
  'paid-12': Paid12,
  'passkey-4': Passkey4,
  'pie-chart-15': PieChart15,
  'policy-3': Policy3,
  'privacy-tip-2': PrivacyTip2,
  'private-connectivity-1': PrivateConnectivity1,
  'qr-code-27': QrCode27,
  'savings-1': Savings1,
  'sell-0': Sell0,
  'send-money-7': SendMoney7,
  'shield-lock-5': ShieldLock5,
  'shield-person-6': ShieldPerson6,
  'universal-currency-6': UniversalCurrency6,
  'universal-currency-alt-5': UniversalCurrencyAlt5,
  'usdc-8': Usdc8,
  'wallet-3': Wallet3,
  'waterfall-chart-4': WaterfallChart4,
  'work-2': Work2,
};

export const SvgIcon: React.FC<SvgIconProps> = ({
  name,
  width = 24,
  height = 24,
  color,
  ...props
}) => {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in iconMap`);
    return null;
  }

  return <IconComponent width={width} height={height} fill={color} {...props} />;
};
