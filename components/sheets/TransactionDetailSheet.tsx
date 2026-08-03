import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import { GorhomBottomSheet } from './GorhomBottomSheet';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';
import { Transaction, TransactionType, SvgComponent } from '../molecules/TransactionItem';
import { resolveTransactionAssetIcon } from '@/utils/transactionIcon';
import { formatAbsAmount } from '@/utils/transactionFormat';
import { MaskedBalance } from '../molecules/MaskedBalance';
import { useUIStore } from '@/stores';
import { useCancelWithdrawal } from '@/api/hooks/useFunding';
import { usePajBanks } from '@/api/hooks/usePaj';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { safeError } from '@/utils/logSanitizer';
import { useButtonFeedback } from '@/hooks/useButtonFeedback';
import {
  ArrowDownLeft01Icon,
  ArrowUpRight01Icon,
  Copy01Icon,
  CreditCardIcon,
  DollarCircleIcon,
  Mail01Icon,
  MinusSignIcon,
  PlusSignIcon,
  RepeatIcon,
  Tag01Icon,
  Wallet01Icon,
  Share01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Cancel01Icon,
  Clock01Icon,
  Tick02Icon,
} from '@/lib/icons';

interface TransactionDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

const typeLabels: Record<TransactionType, string> = {
  send: 'Sent',
  receive: 'Received',
  swap: 'Swapped',
  deposit: 'Deposited',
  withdraw: 'Withdrawn',
};

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
  ' at ' +
  date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const formatDateShort = (date: Date) =>
  date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

const truncateAddress = (address: string) =>
  address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;

const statusLabel = (status: Transaction['status']) => {
  if (status === 'completed') return 'Completed';
  if (status === 'failed') return 'Failed';
  return 'Processing';
};

const DetailRow = ({
  label,
  value,
  copyable,
  isGreen,
  isDanger,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  isGreen?: boolean;
  isDanger?: boolean;
}) => {
  const triggerFeedback = useButtonFeedback();
  const handleCopy = async () => {
    await Clipboard.setStringAsync(value);
  };

  return (
    <View className="flex-row items-center justify-between py-3">
      <Text className="font-caption text-body text-text-secondary">{label}</Text>
      <View className="ml-4 flex-1 flex-row items-center justify-end">
        <Text
          className={`font-subtitle text-body ${isGreen ? 'text-success' : isDanger ? 'text-destructive' : 'text-text-primary'}`}
          numberOfLines={1}
          style={{ maxWidth: '75%', textAlign: 'right' }}>
          {copyable ? truncateAddress(value) : value}
        </Text>
        {copyable && (
          <TouchableOpacity
            onPress={() => {
              triggerFeedback();
              handleCopy();
            }}
            className="ml-2 p-1"
            hitSlop={8}>
            <HugeiconsIcon icon={Copy01Icon} size={16} color="#757575" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const LARGE_ICON_SIZE = 48;

const WITHDRAWAL_BADGE: Record<string, { icon: any; bg: string }> = {
  fiat: { icon: CreditCardIcon, bg: '#0090ff' },
  card: { icon: CreditCardIcon, bg: '#0090ff' },
  crypto: { icon: Wallet01Icon, bg: '#9f4fff' },
  p2p: { icon: Mail01Icon, bg: '#00ca48' },
};

const LargeTokenIcon = ({
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
      width: LARGE_ICON_SIZE,
      height: LARGE_ICON_SIZE,
      borderRadius: LARGE_ICON_SIZE / 2,
      borderWidth: withBorder && isSymbol ? 1 : 0,
      borderColor: '#E6E8EC',
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: bgColor || '#0090ff',
    }}>
    {Token ? (
      <Token
        width={isSymbol ? 28 : LARGE_ICON_SIZE + 8}
        height={isSymbol ? 28 : LARGE_ICON_SIZE + 8}
      />
    ) : (
      <HugeiconsIcon icon={DollarCircleIcon} size={24} color="#FFFFFF" />
    )}
  </View>
);

const LARGE_ACTION_ICON_MAP: Record<string, any> = {
  'arrow-up-right': ArrowUpRight01Icon,
  'arrow-down-left': ArrowDownLeft01Icon,
  repeat: RepeatIcon,
  plus: PlusSignIcon,
  minus: MinusSignIcon,
};

const LargeActionIcon = ({ name }: { name: string }) => (
  <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-surface bg-background-main">
    <HugeiconsIcon
      icon={LARGE_ACTION_ICON_MAP[name] ?? ArrowUpRight01Icon}
      size={22}
      color="#757575"
    />
  </View>
);

const LargeSwapIcon = ({
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
      className="absolute left-0 top-0 h-9 w-9 items-center justify-center rounded-full"
      style={{ backgroundColor: fromBg || '#000' }}>
      {SwapFrom && <SwapFrom width={20} height={20} />}
    </View>
    <View
      className="absolute bottom-0 right-0 h-9 w-9 items-center justify-center rounded-full border-2 border-white"
      style={{ backgroundColor: toBg || '#0090ff' }}>
      {SwapTo && <SwapTo width={20} height={20} />}
    </View>
  </View>
);

/* ── Receipt row (used inside the ViewShot capture) ── */
const ReceiptRow = ({ label, value }: { label: string; value: string }) => (
  <View
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#f7f2e8',
    }}>
    <Text style={{ fontFamily: 'Geist-Regular', fontSize: 13, color: '#848281' }}>{label}</Text>
    <Text
      style={{
        fontFamily: 'Geist-Medium',
        fontSize: 13,
        color: '#343433',
        maxWidth: '55%',
        textAlign: 'right',
      }}>
      {value}
    </Text>
  </View>
);

export function TransactionDetailSheet({
  visible,
  onClose,
  transaction,
}: TransactionDetailSheetProps) {
  const { isBalanceVisible } = useUIStore();
  const cancelWithdrawal = useCancelWithdrawal();
  const { showSuccess, showError } = useFeedbackPopup();
  const { data: pajBanksData } = usePajBanks();
  const triggerFeedback = useButtonFeedback();
  const [showMore, setShowMore] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const receiptRef = useRef<ViewShot>(null);

  const handleShareReceipt = useCallback(async () => {
    if (!transaction) return;
    setShowReceipt(true);
    // Wait for the receipt view to render
    await new Promise((r) => setTimeout(r, 100));
    try {
      const uri = await receiptRef.current?.capture?.();
      if (!uri) {
        // Fallback to text share
        Share.share({ message: buildTextReceipt(transaction) });
        return;
      }
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share Receipt' });
      } else {
        Share.share({ url: uri });
      }
    } catch {
      Share.share({ message: buildTextReceipt(transaction) });
    } finally {
      setShowReceipt(false);
    }
  }, [transaction]);

  if (!transaction) return null;

  const isCancellable = transaction.type === 'withdraw' && transaction.status === 'pending';
  const meta = transaction.metadata ?? {};
  const resolvedBankName = meta.bankName
    ? String(meta.bankName)
    : meta.bankId
      ? ((pajBanksData?.banks ?? []).find((b) => b.id === meta.bankId)?.name ?? String(meta.bankId))
      : undefined;

  const handleCancel = () => {
    Alert.alert('Cancel Withdrawal', 'Are you sure you want to cancel this withdrawal?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: () => {
          cancelWithdrawal.mutate(transaction.id, {
            onSuccess: () => {
              showSuccess('Withdrawal cancelled');
              onClose();
            },
            onError: (error) => {
              safeError('Cancel withdrawal failed', error);
              showError('Cancellation failed', (error as any)?.message || 'Please try again later');
            },
          });
        },
      },
    ]);
  };

  const {
    icon,
    type,
    amount,
    currency = 'NGN',
    createdAt,
    toAddress,
    txHash,
    fee,
    withdrawalMethod,
  } = transaction;

  const renderIcon = () => {
    let iconEl: React.ReactElement;

    if (icon?.type === 'swap') {
      iconEl = (
        <LargeSwapIcon
          SwapFrom={icon.SwapFrom}
          SwapTo={icon.SwapTo}
          fromBg={icon.swapFromBg}
          toBg={icon.swapToBg}
        />
      );
    } else if (icon?.type === 'token') {
      iconEl = <LargeTokenIcon Token={icon.Token} bgColor={icon.bgColor} />;
    } else if (icon?.type === 'icon' && icon.iconName) {
      iconEl = <LargeActionIcon name={icon.iconName} />;
    } else {
      const inferredAssetIcon = resolveTransactionAssetIcon(transaction);
      iconEl = inferredAssetIcon ? (
        <LargeTokenIcon
          Token={inferredAssetIcon.Token}
          bgColor={inferredAssetIcon.bgColor}
          withBorder={inferredAssetIcon.withBorder}
          isSymbol={inferredAssetIcon.isSymbol}
        />
      ) : (
        <LargeActionIcon name="activity" />
      );
    }

    const badge = withdrawalMethod
      ? (WITHDRAWAL_BADGE[withdrawalMethod] ?? { Icon: Tag01Icon, bg: '#848281' })
      : null;

    return (
      <View style={{ width: LARGE_ICON_SIZE, height: LARGE_ICON_SIZE }}>
        {iconEl}
        {badge && (
          <View
            className="absolute -bottom-0.5 -right-0.5 h-5 w-5 items-center justify-center rounded-full border-2 border-white"
            style={{ backgroundColor: badge.bg }}>
            <HugeiconsIcon icon={badge.icon} size={10} color="#fff" strokeWidth={2.5} />
          </View>
        )}
      </View>
    );
  };

  // Build extra detail rows for "See More"
  const extraRows: { label: string; value: string; copyable?: boolean }[] = [];
  if (meta.bankAccountNumber)
    extraRows.push({
      label: 'Account Number',
      value: String(meta.bankAccountNumber),
      copyable: true,
    });
  if (meta.bankId) {
    const bankName = (pajBanksData?.banks ?? []).find((b) => b.id === meta.bankId)?.name;
    extraRows.push({ label: 'Bank', value: resolvedBankName || String(meta.bankId) });
  }
  if (meta.rate)
    extraRows.push({ label: 'Exchange Rate', value: `₦${Number(meta.rate).toLocaleString()}` });
  if (meta.tokenAmount)
    extraRows.push({ label: 'USDC Amount', value: `$${Number(meta.tokenAmount).toFixed(2)}` });
  if (meta.fee) extraRows.push({ label: 'Fee', value: `$${Number(meta.fee).toFixed(2)}` });
  if (meta.chain) extraRows.push({ label: 'Network', value: String(meta.chain) });
  if (meta.depositType) extraRows.push({ label: 'Deposit Type', value: String(meta.depositType) });
  if (transaction.id) extraRows.push({ label: 'Reference', value: transaction.id, copyable: true });

  const hasExtra = extraRows.length > 0;

  return (
    <GorhomBottomSheet
      visible={visible}
      onClose={() => {
        setShowMore(false);
        onClose();
      }}>
      {/* Header */}
      <View className="items-center pb-4">
        {renderIcon()}
        <View className="mt-3 rounded-full bg-surface px-3 py-1">
          <Text className="font-caption text-[11px] uppercase tracking-wide text-text-secondary">
            {typeLabels[type]}
          </Text>
        </View>
        <MaskedBalance
          value={`${formatAbsAmount(amount)} ${currency}`}
          visible={isBalanceVisible}
          textClass="text-[24px]"
          colorClass="text-text-primary"
        />
        <Text className="mt-0.5 font-caption text-[11px] text-text-secondary">
          {formatDate(createdAt)}
        </Text>
      </View>

      {/* Primary details */}
      <View className="mt-2 border-t border-surface pt-2">
        {/* Recipient name — prominently displayed for fiat */}
        {meta.bankAccountName && (
          <DetailRow label="Recipient" value={String(meta.bankAccountName)} />
        )}

        {transaction.title && !meta.bankAccountName && (
          <DetailRow label="Description" value={transaction.title} />
        )}

        {(type === 'send' || type === 'receive') && toAddress && (
          <DetailRow label={type === 'send' ? 'To' : 'From'} value={toAddress} copyable />
        )}

        {type === 'deposit' && <DetailRow label="Method" value={transaction.subtitle || 'Card'} />}

        {type === 'withdraw' && !meta.bankAccountName && (
          <DetailRow
            label="To"
            value={String(meta.bankAccountNumber || transaction.subtitle || 'Bank Account')}
          />
        )}

        {type === 'swap' && (
          <DetailRow label="Via" value={transaction.subtitle || 'Rail Exchange'} />
        )}

        {/* Fiat details — amount in naira, bank, account */}
        {meta.fiatAmount && (
          <DetailRow label="Naira Amount" value={`₦${Number(meta.fiatAmount).toLocaleString()}`} />
        )}
        {meta.secondaryCurrency && meta.fiatAmount && meta.rate && (
          <DetailRow label="Rate" value={`₦${Number(meta.rate).toLocaleString()}/$1`} />
        )}
        {resolvedBankName && <DetailRow label="Bank" value={resolvedBankName} />}
        {!resolvedBankName && type === 'withdraw' && transaction.subtitle?.includes('•') && (
          <DetailRow label="Bank" value={transaction.subtitle.split('•')[0].trim()} />
        )}
        {meta.bankAccountNumber && !meta.bankAccountName && (
          <DetailRow label="Account" value={String(meta.bankAccountNumber)} copyable />
        )}
        {meta.bankAccountNumber && meta.bankAccountName && (
          <DetailRow label="Account" value={String(meta.bankAccountNumber)} copyable />
        )}

        <DetailRow
          label="Status"
          value={statusLabel(transaction.status)}
          isGreen={transaction.status === 'completed'}
          isDanger={transaction.status === 'failed'}
        />

        <DetailRow label="Date" value={formatDate(createdAt)} />

        {txHash && <DetailRow label="Transaction ID" value={txHash} copyable />}
        {fee && (
          <DetailRow label="Fees" value={fee} isGreen={fee.toLowerCase().includes('covered')} />
        )}
        {meta.chain && <DetailRow label="Network" value={String(meta.chain)} />}
        {meta.narration && <DetailRow label="Note" value={String(meta.narration)} />}
      </View>

      {/* See More expandable */}
      {hasExtra && !showMore && (
        <TouchableOpacity
          onPress={() => {
            triggerFeedback();
            setShowMore(true);
          }}
          className="mt-1 flex-row items-center justify-center gap-1 py-2">
          <Text className="font-subtitle text-[13px] text-primary">See More</Text>
          <HugeiconsIcon icon={ArrowDown01Icon} size={14} color="#1B84FF" />
        </TouchableOpacity>
      )}
      {hasExtra && showMore && (
        <View className="border-t border-surface pt-1">
          {extraRows.map((row) => (
            <DetailRow
              key={row.label}
              label={row.label}
              value={row.value}
              copyable={row.copyable}
            />
          ))}
          <TouchableOpacity
            onPress={() => {
              triggerFeedback();
              setShowMore(false);
            }}
            className="mt-1 flex-row items-center justify-center gap-1 py-2">
            <Text className="font-subtitle text-[13px] text-primary">See Less</Text>
            <HugeiconsIcon icon={ArrowUp01Icon} size={14} color="#1B84FF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Cancel */}
      {/* Share receipt button */}
      <TouchableOpacity
        onPress={() => {
          triggerFeedback();
          handleShareReceipt();
        }}
        className="mt-3 flex-row items-center justify-center gap-2 rounded-full border border-fog py-3">
        <HugeiconsIcon icon={Share01Icon} size={18} color="#848281" />
        <Text className="font-subtitle text-caption text-text-secondary">Share Receipt</Text>
      </TouchableOpacity>

      {/* Hidden receipt view for capture */}
      {showReceipt && (
        <View style={{ position: 'absolute', left: -9999 }}>
          <ViewShot ref={receiptRef} options={{ format: 'png', quality: 1 }}>
            <ReceiptImage transaction={transaction} bankName={resolvedBankName} />
          </ViewShot>
        </View>
      )}
    </GorhomBottomSheet>
  );
}

/* ── Styled receipt image component ── */
function ReceiptImage({ transaction, bankName }: { transaction: Transaction; bankName?: string }) {
  const {
    type,
    amount,
    currency = 'NGN',
    createdAt,
    txHash,
    status,
    title,
    subtitle,
    metadata,
  } = transaction;
  const meta = metadata ?? {};
  const isCredit = type === 'deposit' || type === 'receive';

  return (
    <View style={{ width: 380, backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden' }}>
      {/* Green/Red header band */}
      <View
        style={{
          backgroundColor: status === 'failed' ? '#fff1f2' : isCredit ? '#f0fdf4' : '#F0F4FF',
          paddingTop: 32,
          paddingBottom: 24,
          alignItems: 'center',
        }}>
        {/* Status icon */}
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor:
              status === 'failed' ? '#ff2b3a' : status === 'completed' ? '#00ca48' : '#F59E0B',
          }}>
          <HugeiconsIcon
            icon={
              status === 'failed' ? Cancel01Icon : status === 'completed' ? Tick02Icon : Clock01Icon
            }
            size={28}
            color="#FFF"
          />
        </View>
        <Text
          style={{
            fontFamily: 'CommitMono-600',
            fontVariant: ['tabular-nums'],
            fontSize: 28,
            color: '#343433',
            marginTop: 12,
          }}>
          {isCredit ? '+' : '−'}
          {formatAbsAmount(amount)} {currency}
        </Text>
        <Text
          style={{
            fontFamily: 'Geist-Medium',
            fontSize: 14,
            color: status === 'failed' ? '#ff2b3a' : '#00ca48',
            marginTop: 4,
          }}>
          {statusLabel(status)}
        </Text>
      </View>

      {/* Divider with notch effect */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 20 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: '#f7f2e8' }} />
      </View>

      {/* Details */}
      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
        <ReceiptRow label="Type" value={typeLabels[type]} />
        {!!title && <ReceiptRow label="Description" value={title} />}
        {!!meta.bankAccountName && (
          <ReceiptRow label="Recipient" value={String(meta.bankAccountName)} />
        )}
        {!!meta.bankAccountNumber && (
          <ReceiptRow label="Account" value={String(meta.bankAccountNumber)} />
        )}
        {!!(bankName || meta.bankId) && (
          <ReceiptRow label="Bank" value={bankName || String(meta.bankId)} />
        )}
        {!!meta.fiatAmount && (
          <ReceiptRow label="Naira Amount" value={`₦${Number(meta.fiatAmount).toLocaleString()}`} />
        )}
        {!!meta.rate && (
          <ReceiptRow label="Rate" value={`₦${Number(meta.rate).toLocaleString()}/$1`} />
        )}
        {!!meta.tokenAmount && (
          <ReceiptRow label="USDC" value={`$${Number(meta.tokenAmount).toFixed(2)}`} />
        )}
        {!!meta.fee && Number(meta.fee) > 0 && (
          <ReceiptRow label="Fee" value={`$${Number(meta.fee).toFixed(2)}`} />
        )}
        {!!meta.chain && <ReceiptRow label="Network" value={String(meta.chain)} />}
        <ReceiptRow label="Date" value={formatDateShort(createdAt)} />
        <ReceiptRow label="Status" value={statusLabel(status)} />
        {!!txHash && (
          <ReceiptRow
            label="TX ID"
            value={txHash.length > 20 ? `${txHash.slice(0, 8)}...${txHash.slice(-8)}` : txHash}
          />
        )}
        {!!subtitle && !meta.bankAccountName && <ReceiptRow label="Note" value={subtitle} />}
      </View>

      {/* Footer */}
      <View
        style={{
          alignItems: 'center',
          paddingVertical: 20,
          borderTopWidth: 1,
          borderTopColor: '#f7f2e8',
          marginHorizontal: 20,
        }}>
        <Text
          style={{
            fontFamily: 'Geist-Bold',
            fontSize: 15,
            color: '#343433',
            letterSpacing: 1,
          }}>
          RAIL MONEY
        </Text>
        <Text
          style={{
            fontFamily: 'Geist-Regular',
            fontSize: 11,
            color: '#848281',
            marginTop: 2,
          }}>
          rail.money • {formatDate(createdAt)}
        </Text>
      </View>
    </View>
  );
}

function buildTextReceipt(tx: Transaction): string {
  const meta = tx.metadata ?? {};
  return [
    'Rail Money — Transaction Receipt',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    `Type: ${typeLabels[tx.type]}`,
    `Amount: ${formatAbsAmount(tx.amount)} ${tx.currency ?? 'NGN'}`,
    tx.title ? `Description: ${tx.title}` : '',
    meta.bankAccountName ? `Recipient: ${meta.bankAccountName}` : '',
    meta.bankAccountNumber ? `Account: ${meta.bankAccountNumber}` : '',
    meta.fiatAmount ? `Naira Amount: ₦${Number(meta.fiatAmount).toLocaleString()}` : '',
    meta.rate ? `Rate: ₦${Number(meta.rate).toLocaleString()}/$1` : '',
    `Date: ${formatDate(tx.createdAt)}`,
    meta.chain ? `Network: ${meta.chain}` : '',
    tx.txHash ? `TX: ${tx.txHash}` : '',
    `Status: ${statusLabel(tx.status)}`,
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    'Sent via Rail Money',
  ]
    .filter(Boolean)
    .join('\n');
}
