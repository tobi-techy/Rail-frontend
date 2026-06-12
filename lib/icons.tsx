/**
 * Phosphor Icon Compatibility Layer
 *
 * Drop-in replacement for @hugeicons/react-native and @hugeicons/core-free-icons.
 * Maps every HugeIcon name used in the codebase to its Phosphor equivalent.
 *
 * Usage (unchanged from before):
 *   import { Cancel01Icon } from '@/lib/icons';
 *   import { IconComponent } from '@/lib/icons';
 *   <IconComponent icon={Cancel01Icon} size={20} color="#000" />
 *
 * For fill variants, pass fillWeight="fill" or use the ExpandableActionMenu/TabBar
 * which automatically apply fill weight.
 */

import React from 'react';
import type { IconProps as PhosphorIconProps, IconWeight } from 'phosphor-react-native';
import {
  ArrowDownIcon,
  ArrowDownLeftIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowUpRightIcon,
  ArrowsLeftRightIcon,
  ArrowBendDownLeftIcon,
  ArrowBendUpRightIcon,
  ArrowLineDownIcon,
  BackspaceIcon,
  BankIcon as PhBankIcon,
  BellIcon,
  BellRingingIcon,
  BuildingsIcon,
  CalendarIcon,
  CameraIcon as PhCameraIcon,
  CaretDownIcon,
  CaretUpIcon,
  ChartLineUpIcon,
  ChartBarIcon,
  CheckIcon,
  CheckCircleIcon,
  ClockIcon,
  CoffeeIcon,
  CoinIcon as PhCoinIcon,
  CopyIcon,
  CreditCardIcon as PhCreditCardIcon,
  CrownIcon as PhCrownIcon,
  CurrencyCircleDollarIcon,
  DiamondIcon as PhDiamondIcon,
  EnvelopeIcon,
  EyeIcon as PhEyeIcon,
  EyeSlashIcon,
  FileIcon as PhFileIcon,
  FingerprintIcon,
  FireIcon as PhFireIcon,
  FlagIcon,
  FunnelIcon,
  GasPumpIcon,
  GearIcon,
  GiftIcon as PhGiftIcon,
  GlobeSimpleIcon,
  HeadphonesIcon as PhHeadphonesIcon,
  ImageIcon as PhImageIcon,
  InfoIcon,
  InvoiceIcon as PhInvoiceIcon,
  KeyIcon,
  LightningIcon,
  LinkIcon,
  LockIcon as PhLockIcon,
  LockKeyIcon,
  MagnifyingGlassIcon,
  MedalIcon,
  MinusIcon,
  MoneyIcon,
  DotsThreeIcon,
  DotsThreeOutlineIcon,
  NotificationIcon,
  PaperPlaneTiltIcon,
  PiggyBankIcon,
  PlusIcon,
  PlusCircleIcon,
  PushPinIcon,
  ArrowCounterClockwiseIcon,
  RepeatIcon as PhRepeatIcon,
  ScanIcon as PhScanIcon,
  ScrollIcon,
  ShareIcon,
  ShieldIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  SnowflakeIcon,
  StarIcon,
  SunIcon,
  SwapIcon as PhSwapIcon,
  TagIcon,
  TargetIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  TrashIcon,
  TrendDownIcon,
  TrendUpIcon,
  UserIcon as PhUserIcon,
  UsersIcon,
  UsersThreeIcon,
  WalletIcon,
  WarningIcon,
  WarningCircleIcon,
  WifiHighIcon,
  XIcon,
  XCircleIcon,
  ChatTextIcon,
  MicrophoneIcon,
  DeviceMobileIcon,
  BinocularsIcon,
  ShieldStarIcon,
  ScalesIcon,
  GraduationCapIcon,
  MapPinIcon as PhMapPinIcon,
  ListBulletsIcon,
  AtIcon,
  PhoneIcon as PhPhoneIcon,
  CaretRightIcon,
  HouseSimpleIcon,
  BuildingIcon,
  ImagesIcon,
  GridFourIcon,
} from 'phosphor-react-native';

// ─── Icon type (matches HugeiconsProps['icon']) ─────────────────────────────
// Each "icon" is a Phosphor component reference.
export type PhosphorIcon = React.ComponentType<PhosphorIconProps>;

// Compatibility type for code that references HugeiconsProps
export type HugeiconsProps = { icon: PhosphorIcon; size?: number; color?: string; fill?: string };

// ─── HugeIcon name → Phosphor component mapping ────────────────────────────
export const iconMap: Record<string, PhosphorIcon> = {
  // Arrows & navigation
  ArrowDown01Icon: ArrowDownIcon,
  ArrowDownLeft01Icon: ArrowDownLeftIcon,
  ArrowLeft01Icon: ArrowLeftIcon,
  ArrowRight01Icon: ArrowRightIcon,
  ArrowUp01Icon: ArrowUpIcon,
  ArrowUpRight01Icon: ArrowUpRightIcon,
  ArrowLeftRightIcon: ArrowsLeftRightIcon,
  ArrowDataTransferHorizontalIcon: ArrowsLeftRightIcon,
  ArrowMoveDownLeftIcon: ArrowBendDownLeftIcon,
  ArrowMoveUpRightIcon: ArrowBendUpRightIcon,
  ArrowLineDown01Icon: ArrowLineDownIcon,

  // Actions
  Cancel01Icon: XIcon,
  CancelCircleIcon: XCircleIcon,
  Delete01Icon: BackspaceIcon,
  Delete02Icon: TrashIcon,
  Copy01Icon: CopyIcon,
  Share01Icon: ShareIcon,
  RefreshIcon: ArrowCounterClockwiseIcon,
  RepeatIcon: PhRepeatIcon,
  PlusSignIcon: PlusIcon,
  MinusSignIcon: MinusIcon,
  Add01Icon: PlusCircleIcon,
  FilterIcon: FunnelIcon,
  Search01Icon: MagnifyingGlassIcon,
  ScanIcon: PhScanIcon,
  ScanEyeIcon: BinocularsIcon,
  Menu01Icon: ListBulletsIcon,

  // Status & feedback
  CheckmarkCircle01Icon: CheckCircleIcon,
  CheckmarkCircle02Icon: CheckCircleIcon,
  CheckUnread01Icon: CheckIcon,
  Tick02Icon: CheckIcon,
  Alert02Icon: WarningIcon,
  AlertCircleIcon: WarningCircleIcon,
  InformationCircleIcon: InfoIcon,
  HelpCircleIcon: InfoIcon,

  // Finance & money
  Money01Icon: MoneyIcon,
  MoneyReceiveSquareIcon: MoneyIcon,
  DollarCircleIcon: CurrencyCircleDollarIcon,
  CreditCardIcon: PhCreditCardIcon,
  BankIcon: PhBankIcon,
  Wallet01Icon: WalletIcon,
  SavingsIcon: PiggyBankIcon,
  CoinIcon: PhCoinIcon,
  InvoiceIcon: PhInvoiceIcon,
  Invoice02Icon: PhInvoiceIcon,

  // Charts & data
  ChartUpIcon: TrendUpIcon,
  ChartDownIcon: TrendDownIcon,
  ChartIncreaseIcon: ChartLineUpIcon,
  BarChartIcon: ChartBarIcon,

  // Communication
  Message01Icon: ChatTextIcon,
  MessageIcon: ChatTextIcon,
  Mail01Icon: EnvelopeIcon,
  MailAtSign01Icon: AtIcon,
  Notification01Icon: NotificationIcon,
  Notification03Icon: BellIcon,
  BellDotIcon: BellRingingIcon,

  // Security
  LockIcon: PhLockIcon,
  LockPasswordIcon: LockKeyIcon,
  ShieldKeyIcon: ShieldCheckIcon,
  Shield01Icon: ShieldIcon,
  ShieldEnergyIcon: ShieldStarIcon,
  Key01Icon: KeyIcon,
  FingerPrintIcon: FingerprintIcon,

  // User & people
  UserIcon: PhUserIcon,
  UserGroupIcon: UsersIcon,
  UserMultiple02Icon: UsersThreeIcon,

  // Home & buildings
  Home01Icon: HouseSimpleIcon,
  Building04Icon: BuildingIcon,

  // Media & files
  Image01Icon: PhImageIcon,
  Camera01Icon: PhCameraIcon,
  File01Icon: PhFileIcon,
  Gif01Icon: ImagesIcon,
  Scroll01Icon: ScrollIcon,

  // Settings & tools
  Settings01Icon: GearIcon,
  Clock01Icon: ClockIcon,
  Calendar03Icon: CalendarIcon,

  // Misc
  EyeIcon: PhEyeIcon,
  ViewOffIcon: EyeSlashIcon,
  FireIcon: PhFireIcon,
  SnowIcon: SnowflakeIcon,
  ZapIcon: LightningIcon,
  FlashIcon: LightningIcon,
  InternetIcon: GlobeSimpleIcon,
  Wifi01Icon: WifiHighIcon,
  Tag01Icon: TagIcon,
  PinIcon: PushPinIcon,
  LinkSquare01Icon: LinkIcon,
  MoreHorizontalIcon: DotsThreeIcon,
  MoreIcon: DotsThreeOutlineIcon,
  SmartPhone01Icon: DeviceMobileIcon,
  Mic01Icon: MicrophoneIcon,
  HeadphonesIcon: PhHeadphonesIcon,

  // Lifestyle
  CrownIcon: PhCrownIcon,
  DiamondIcon: PhDiamondIcon,
  GiftIcon: PhGiftIcon,
  CoffeeIcon: CoffeeIcon,
  Coffee01Icon: CoffeeIcon,
  FuelIcon: GasPumpIcon,
  Sun01Icon: SunIcon,
  Beach02Icon: SunIcon,
  ShoppingBag01Icon: ShoppingBagIcon,
  Car01Icon: GasPumpIcon,
  Airplane01Icon: PaperPlaneTiltIcon,
  AirplaneTakeOff01Icon: PaperPlaneTiltIcon,

  // Achievements & rewards
  Award01Icon: MedalIcon,
  Target01Icon: TargetIcon,
  Target02Icon: TargetIcon,
  Star01Icon: StarIcon,
  LoyaltyIcon: StarIcon,
  MortarboardIcon: GraduationCapIcon,

  // Profile & account
  Logout01Icon: ArrowLeftIcon,
  CustomerServiceIcon: PhHeadphonesIcon,
  BalanceScaleIcon: ScalesIcon,
  MapPinIcon: PhMapPinIcon,
  PhoneIcon: PhPhoneIcon,

  // Swap / transfer
  SwapIcon: PhSwapIcon,
};

// ─── Fallback: returns X icon if no mapping found ───────────────────────────
export function resolveIcon(name: string): PhosphorIcon {
  return iconMap[name] ?? XIcon;
}

// ─── Drop-in HugeiconsIcon replacement ──────────────────────────────────────
// Accepts the same props as <HugeiconsIcon icon={X} size={20} color="#000" />
// plus optional `weight` for Phosphor weight control.

interface IconComponentProps {
  icon: PhosphorIcon;
  size?: number;
  color?: string;
  fill?: string;
  strokeWidth?: number;
  weight?: IconWeight;
  style?: any;
  className?: string;
}

export function IconComponent({
  icon: Icon,
  size = 24,
  color = '#000000',
  fill,
  weight = 'regular',
  style,
}: IconComponentProps) {
  // If fill is provided (like ExpandableActionMenu does), use "fill" weight
  const resolvedWeight: IconWeight = fill ? 'fill' : weight;
  const resolvedColor = fill || color;
  return <Icon size={size} color={resolvedColor} weight={resolvedWeight} style={style} />;
}

// ─── Re-export all icon constants for import compatibility ──────────────────
// These are the Phosphor components themselves, keyed by HugeIcon names.
// Usage: import { Cancel01Icon } from '@/lib/icons';

export const ArrowDown01Icon = ArrowDownIcon;
export const ArrowDownLeft01Icon = ArrowDownLeftIcon;
export const ArrowLeft01Icon = ArrowLeftIcon;
export const ArrowRight01Icon = ArrowRightIcon;
export const ArrowUp01Icon = ArrowUpIcon;
export const ArrowUpRight01Icon = ArrowUpRightIcon;
export const ArrowLeftRightIcon = ArrowsLeftRightIcon;
export const ArrowDataTransferHorizontalIcon = ArrowsLeftRightIcon;
export const ArrowMoveDownLeftIcon = ArrowBendDownLeftIcon;
export const ArrowMoveUpRightIcon = ArrowBendUpRightIcon;
export const Cancel01Icon = XIcon;
export const CancelCircleIcon = XCircleIcon;
export const Delete01Icon = BackspaceIcon;
export const Delete02Icon = TrashIcon;
export const Copy01Icon = CopyIcon;
export const Share01Icon = ShareIcon;
export const RefreshIcon = ArrowCounterClockwiseIcon;
export const RepeatIcon = PhRepeatIcon;
export const PlusSignIcon = PlusIcon;
export const MinusSignIcon = MinusIcon;
export const Add01Icon = PlusCircleIcon;
export const FilterIcon = FunnelIcon;
export const Search01Icon = MagnifyingGlassIcon;
export const ScanIcon = PhScanIcon;
export const ScanEyeIcon = BinocularsIcon;
export const Menu01Icon = ListBulletsIcon;
export const CheckmarkCircle01Icon = CheckCircleIcon;
export const CheckmarkCircle02Icon = CheckCircleIcon;
export const CheckUnread01Icon = CheckIcon;
export const Tick02Icon = CheckIcon;
export const Alert02Icon = WarningIcon;
export const AlertCircleIcon = WarningCircleIcon;
export const InformationCircleIcon = InfoIcon;
export const HelpCircleIcon = InfoIcon;
export const Money01Icon = MoneyIcon;
export const MoneyReceiveSquareIcon = MoneyIcon;
export const DollarCircleIcon = CurrencyCircleDollarIcon;
export { PhCreditCardIcon as CreditCardIcon };
export { PhBankIcon as BankIcon };
export { WalletIcon as Wallet01Icon };
export { PiggyBankIcon as SavingsIcon };
export { PhCoinIcon as CoinIcon };
export { PhInvoiceIcon as Invoice02Icon };
export const ChartUpIcon = TrendUpIcon;
export const ChartDownIcon = TrendDownIcon;
export const ChartIncreaseIcon = ChartLineUpIcon;
export { ChartBarIcon as BarChartIcon };
export const Message01Icon = ChatTextIcon;
export const MessageIcon = ChatTextIcon;
export const Mail01Icon = EnvelopeIcon;
export const MailAtSign01Icon = AtIcon;
export const Notification03Icon = BellIcon;
export const BellDotIcon = BellRingingIcon;
export { PhLockIcon as LockIcon };
export { LockKeyIcon as LockPasswordIcon };
export const ShieldKeyIcon = ShieldCheckIcon;
export const Shield01Icon = ShieldIcon;
export const ShieldEnergyIcon = ShieldStarIcon;
export { KeyIcon as Key01Icon };
export { FingerprintIcon as FingerPrintIcon };
export { PhUserIcon as UserIcon };
export { UsersIcon as UserGroupIcon };
export { UsersThreeIcon as UserMultiple02Icon };
export { HouseSimpleIcon as Home01Icon };
export { BuildingsIcon as Building04Icon };
export { PhImageIcon as Image01Icon };
export { PhCameraIcon as Camera01Icon };
export { PhFileIcon as File01Icon };
export { ScrollIcon as Scroll01Icon };
export { GearIcon as Settings01Icon };
export { ClockIcon as Clock01Icon };
export { CalendarIcon as Calendar03Icon };
export { PhEyeIcon as EyeIcon };
export { EyeSlashIcon as ViewOffIcon };
export { PhFireIcon as FireIcon };
export { SnowflakeIcon as SnowIcon };
export { LightningIcon as ZapIcon };
export { LightningIcon as FlashIcon };
export { GlobeSimpleIcon as InternetIcon };
export { WifiHighIcon as Wifi01Icon };
export { TagIcon as Tag01Icon };
export { PushPinIcon as PinIcon };
export { LinkIcon as LinkSquare01Icon };
export { DotsThreeIcon as MoreHorizontalIcon };
export { DotsThreeOutlineIcon as MoreIcon };
export { DeviceMobileIcon as SmartPhone01Icon };
export { PhPhoneIcon as PhoneIcon };
export { MicrophoneIcon as Mic01Icon };
export { PhHeadphonesIcon as HeadphonesIcon };
export { PhCrownIcon as CrownIcon };
export { PhDiamondIcon as DiamondIcon };
export { PhGiftIcon as GiftIcon };
export { CoffeeIcon as Coffee01Icon };
export { GasPumpIcon as FuelIcon };
export { SunIcon as Sun01Icon };
export { SunIcon as Beach02Icon };
export { ShoppingBagIcon as ShoppingBag01Icon };
export { GasPumpIcon as Car01Icon };
export { PaperPlaneTiltIcon as Airplane01Icon };
export { PaperPlaneTiltIcon as AirplaneTakeOff01Icon };
export { ImagesIcon as Gif01Icon };
export { MedalIcon as Award01Icon };
export { TargetIcon as Target01Icon };
export { TargetIcon as Target02Icon };
export { GraduationCapIcon as MortarboardIcon };
export { ArrowLeftIcon as Logout01Icon };
export { PhHeadphonesIcon as CustomerServiceIcon };
export { ScalesIcon as BalanceScaleIcon };
export { PhSwapIcon as SwapIcon };
export { CaretDownIcon as ArrowDown01IconAlt };
export { CaretUpIcon as ArrowUp01IconAlt };
export { CaretRightIcon as ArrowRight01IconAlt };

// Additional missing exports
export { WarningIcon as Alert01Icon };
export { FlagIcon as Flag01Icon };
export { ThumbsUpIcon as ThumbsUpIcon };
export { ThumbsDownIcon as ThumbsDownIcon };
export { GridFourIcon };
