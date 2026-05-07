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
  ArrowDown,
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  ArrowsLeftRight,
  ArrowBendDownLeft,
  ArrowBendUpRight,
  ArrowLineDown,
  Backspace,
  Bank,
  Bell,
  BellRinging,
  Buildings,
  Calendar,
  Camera,
  CaretDown,
  CaretUp,
  ChartLineUp,
  ChartBar,
  Check,
  CheckCircle,
  Clock,
  Coffee,
  Coin,
  Copy,
  CreditCard,
  Crown,
  CurrencyCircleDollar,
  Diamond,
  Envelope,
  Eye,
  EyeSlash,
  File,
  Fingerprint,
  Fire,
  Flag,
  Funnel,
  GasPump,
  Gear,
  Gift,
  GlobeSimple,
  Headphones,
  Image,
  Info,
  Invoice,
  Key,
  Lightning,
  Link,
  Lock,
  LockKey,
  MagnifyingGlass,
  Medal,
  Minus,
  Money,
  DotsThree,
  DotsThreeOutline,
  Notification,
  PaperPlaneTilt,
  PiggyBank,
  Plus,
  PlusCircle,
  PushPin,
  ArrowCounterClockwise,
  Repeat,
  Scan,
  Scroll,
  Share,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Snowflake,
  Star,
  Sun,
  Swap,
  Tag,
  Target,
  ThumbsDown,
  ThumbsUp,
  Trash,
  TrendDown,
  TrendUp,
  User,
  Users,
  UsersThree,
  Wallet,
  Warning,
  WarningCircle,
  WifiHigh,
  X,
  XCircle,
  ChatText,
  Microphone,
  DeviceMobile,
  Binoculars,
  ShieldStar,
  Scales,
  GraduationCap,
  MapPin,
  ListBullets,
  At,
  Phone,
  CaretRight,
  HouseSimpleIcon,
  BuildingIcon,
  ImageIcon,
  CameraIcon,
  FileIcon,
  ImagesIcon,
} from 'phosphor-react-native';

// ─── Icon type (matches HugeiconsProps['icon']) ─────────────────────────────
// Each "icon" is a Phosphor component reference.
export type PhosphorIcon = React.ComponentType<PhosphorIconProps>;

// Compatibility type for code that references HugeiconsProps
export type HugeiconsProps = { icon: PhosphorIcon; size?: number; color?: string; fill?: string };

// ─── HugeIcon name → Phosphor component mapping ────────────────────────────
export const iconMap: Record<string, PhosphorIcon> = {
  // Arrows & navigation
  ArrowDown01Icon: ArrowDown,
  ArrowDownLeft01Icon: ArrowDownLeft,
  ArrowLeft01Icon: ArrowLeft,
  ArrowRight01Icon: ArrowRight,
  ArrowUp01Icon: ArrowUp,
  ArrowUpRight01Icon: ArrowUpRight,
  ArrowLeftRightIcon: ArrowsLeftRight,
  ArrowDataTransferHorizontalIcon: ArrowsLeftRight,
  ArrowMoveDownLeftIcon: ArrowBendDownLeft,
  ArrowMoveUpRightIcon: ArrowBendUpRight,
  ArrowLineDown01Icon: ArrowLineDown,

  // Actions
  Cancel01Icon: X,
  CancelCircleIcon: XCircle,
  Delete01Icon: Backspace,
  Delete02Icon: Trash,
  Copy01Icon: Copy,
  Share01Icon: Share,
  RefreshIcon: ArrowCounterClockwise,
  RepeatIcon: Repeat,
  PlusSignIcon: Plus,
  MinusSignIcon: Minus,
  Add01Icon: PlusCircle,
  FilterIcon: Funnel,
  Search01Icon: MagnifyingGlass,
  ScanIcon: Scan,
  ScanEyeIcon: Binoculars,
  Menu01Icon: ListBullets,

  // Status & feedback
  CheckmarkCircle01Icon: CheckCircle,
  CheckmarkCircle02Icon: CheckCircle,
  CheckUnread01Icon: Check,
  Tick02Icon: Check,
  Alert02Icon: Warning,
  AlertCircleIcon: WarningCircle,
  InformationCircleIcon: Info,
  HelpCircleIcon: Info,

  // Finance & money
  Money01Icon: Money,
  MoneyReceiveSquareIcon: Money,
  DollarCircleIcon: CurrencyCircleDollar,
  CreditCardIcon: CreditCard,
  BankIcon: Bank,
  Wallet01Icon: Wallet,
  SavingsIcon: PiggyBank,
  CoinIcon: Coin,
  InvoiceIcon: Invoice,
  Invoice02Icon: Invoice,

  // Charts & data
  ChartUpIcon: TrendUp,
  ChartDownIcon: TrendDown,
  ChartIncreaseIcon: ChartLineUp,
  BarChartIcon: ChartBar,

  // Communication
  Message01Icon: ChatText,
  MessageIcon: ChatText,
  Mail01Icon: Envelope,
  MailAtSign01Icon: At,
  Notification01Icon: Notification,
  Notification03Icon: Bell,
  BellDotIcon: BellRinging,

  // Security
  LockIcon: Lock,
  LockPasswordIcon: LockKey,
  ShieldKeyIcon: ShieldCheck,
  Shield01Icon: Shield,
  ShieldEnergyIcon: ShieldStar,
  Key01Icon: Key,
  FingerPrintIcon: Fingerprint,

  // User & people
  UserIcon: User,
  UserGroupIcon: Users,
  UserMultiple02Icon: UsersThree,

  // Home & buildings
  Home01Icon: HouseSimpleIcon,
  Building04Icon: BuildingIcon,

  // Media & files
  Image01Icon: ImageIcon,
  Camera01Icon: CameraIcon,
  File01Icon: FileIcon,
  Gif01Icon: ImagesIcon,
  Scroll01Icon: Scroll,

  // Settings & tools
  Settings01Icon: Gear,
  Clock01Icon: Clock,
  Calendar03Icon: Calendar,

  // Misc
  EyeIcon: Eye,
  ViewOffIcon: EyeSlash,
  FireIcon: Fire,
  SnowIcon: Snowflake,
  ZapIcon: Lightning,
  FlashIcon: Lightning,
  InternetIcon: GlobeSimple,
  Wifi01Icon: WifiHigh,
  Tag01Icon: Tag,
  PinIcon: PushPin,
  LinkSquare01Icon: Link,
  MoreHorizontalIcon: DotsThree,
  MoreIcon: DotsThreeOutline,
  SmartPhone01Icon: DeviceMobile,
  Mic01Icon: Microphone,
  HeadphonesIcon: Headphones,

  // Lifestyle
  CrownIcon: Crown,
  DiamondIcon: Diamond,
  GiftIcon: Gift,
  CoffeeIcon: Coffee,
  Coffee01Icon: Coffee,
  FuelIcon: GasPump,
  Sun01Icon: Sun,
  Beach02Icon: Sun,
  ShoppingBag01Icon: ShoppingBag,
  Car01Icon: GasPump,
  Airplane01Icon: PaperPlaneTilt,
  AirplaneTakeOff01Icon: PaperPlaneTilt,

  // Achievements & rewards
  Award01Icon: Medal,
  Target01Icon: Target,
  Target02Icon: Target,
  Star01Icon: Star,
  LoyaltyIcon: Star,
  MortarboardIcon: GraduationCap,

  // Profile & account
  Logout01Icon: ArrowLeft,
  CustomerServiceIcon: Headphones,
  BalanceScaleIcon: Scales,
  MapPinIcon: MapPin,
  PhoneIcon: Phone,

  // Swap / transfer
  SwapIcon: Swap,
};

// ─── Fallback: returns X icon if no mapping found ───────────────────────────
export function resolveIcon(name: string): PhosphorIcon {
  return iconMap[name] ?? X;
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

export const ArrowDown01Icon = ArrowDown;
export const ArrowDownLeft01Icon = ArrowDownLeft;
export const ArrowLeft01Icon = ArrowLeft;
export const ArrowRight01Icon = ArrowRight;
export const ArrowUp01Icon = ArrowUp;
export const ArrowUpRight01Icon = ArrowUpRight;
export const ArrowLeftRightIcon = ArrowsLeftRight;
export const ArrowDataTransferHorizontalIcon = ArrowsLeftRight;
export const ArrowMoveDownLeftIcon = ArrowBendDownLeft;
export const ArrowMoveUpRightIcon = ArrowBendUpRight;
export const Cancel01Icon = X;
export const CancelCircleIcon = XCircle;
export const Delete01Icon = Backspace;
export const Delete02Icon = Trash;
export const Copy01Icon = Copy;
export const Share01Icon = Share;
export const RefreshIcon = ArrowCounterClockwise;
export const RepeatIcon = Repeat;
export const PlusSignIcon = Plus;
export const MinusSignIcon = Minus;
export const Add01Icon = PlusCircle;
export const FilterIcon = Funnel;
export const Search01Icon = MagnifyingGlass;
export const ScanIcon = Scan;
export const ScanEyeIcon = Binoculars;
export const Menu01Icon = ListBullets;
export const CheckmarkCircle01Icon = CheckCircle;
export const CheckmarkCircle02Icon = CheckCircle;
export const CheckUnread01Icon = Check;
export const Tick02Icon = Check;
export const Alert02Icon = Warning;
export const AlertCircleIcon = WarningCircle;
export const InformationCircleIcon = Info;
export const HelpCircleIcon = Info;
export const Money01Icon = Money;
export const MoneyReceiveSquareIcon = Money;
export const DollarCircleIcon = CurrencyCircleDollar;
export { CreditCard as CreditCardIcon };
export { Bank as BankIcon };
export { Wallet as Wallet01Icon };
export { PiggyBank as SavingsIcon };
export { Coin as CoinIcon };
export { Invoice as Invoice02Icon };
export const ChartUpIcon = TrendUp;
export const ChartDownIcon = TrendDown;
export const ChartIncreaseIcon = ChartLineUp;
export { ChartBar as BarChartIcon };
export const Message01Icon = ChatText;
export const MessageIcon = ChatText;
export const Mail01Icon = Envelope;
export const MailAtSign01Icon = At;
export const Notification03Icon = Bell;
export const BellDotIcon = BellRinging;
export { Lock as LockIcon };
export { LockKey as LockPasswordIcon };
export const ShieldKeyIcon = ShieldCheck;
export const Shield01Icon = Shield;
export const ShieldEnergyIcon = ShieldStar;
export { Key as Key01Icon };
export { Fingerprint as FingerPrintIcon };
export { User as UserIcon };
export { Users as UserGroupIcon };
export { UsersThree as UserMultiple02Icon };
export { HouseSimpleIcon as Home01Icon };
export { Buildings as Building04Icon };
export { Image as Image01Icon };
export { Camera as Camera01Icon };
export { File as File01Icon };
export { Scroll as Scroll01Icon };
export { Gear as Settings01Icon };
export { Clock as Clock01Icon };
export { Calendar as Calendar03Icon };
export { Eye as EyeIcon };
export { EyeSlash as ViewOffIcon };
export { Fire as FireIcon };
export { Snowflake as SnowIcon };
export { Lightning as ZapIcon };
export { Lightning as FlashIcon };
export { GlobeSimple as InternetIcon };
export { WifiHigh as Wifi01Icon };
export { Tag as Tag01Icon };
export { PushPin as PinIcon };
export { Link as LinkSquare01Icon };
export { DotsThree as MoreHorizontalIcon };
export { DotsThreeOutline as MoreIcon };
export { DeviceMobile as SmartPhone01Icon };
export { Microphone as Mic01Icon };
export { Headphones as HeadphonesIcon };
export { Crown as CrownIcon };
export { Diamond as DiamondIcon };
export { Gift as GiftIcon };
export { Coffee as Coffee01Icon };
export { GasPump as FuelIcon };
export { Sun as Sun01Icon };
export { Sun as Beach02Icon };
export { ShoppingBag as ShoppingBag01Icon };
export { GasPump as Car01Icon };
export { PaperPlaneTilt as Airplane01Icon };
export { PaperPlaneTilt as AirplaneTakeOff01Icon };
export { ImagesIcon as Gif01Icon };
export { Medal as Award01Icon };
export { Target as Target01Icon };
export { Target as Target02Icon };
export { GraduationCap as MortarboardIcon };
export { ArrowLeft as Logout01Icon };
export { Headphones as CustomerServiceIcon };
export { Scales as BalanceScaleIcon };
export { Swap as SwapIcon };
export { CaretDown as ArrowDown01IconAlt };
export { CaretUp as ArrowUp01IconAlt };
export { CaretRight as ArrowRight01IconAlt };

// Additional missing exports
export { Warning as Alert01Icon };
export { Flag as Flag01Icon };
export { ThumbsUp as ThumbsUpIcon };
export { ThumbsDown as ThumbsDownIcon };
