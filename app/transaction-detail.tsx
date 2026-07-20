import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, StatusBar, Alert, Share, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInUp, useReducedMotion } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import * as Haptics from '@/utils/platformHaptics';
import { PressableScale } from '@/components/ui/PressableScale';
import { Transaction, TransactionType, SvgComponent } from '@/components/molecules/TransactionItem';
import { MaskedBalance } from '@/components/molecules/MaskedBalance';
import { BankLogo } from '@/components/molecules/BankLogo';
import { resolveTransactionAssetIcon } from '@/utils/transactionIcon';
import { formatAbsAmount } from '@/utils/transactionFormat';
import { safeError } from '@/utils/logSanitizer';
import { useUIStore, useTransactionDetailStore } from '@/stores';
import { useCancelWithdrawal } from '@/api/hooks/useFunding';
import { usePajBanks } from '@/api/hooks/usePaj';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
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
  Cancel01Icon,
  Clock01Icon,
  Tick02Icon,
  ArrowLeft01Icon,
  IconComponent as HugeiconsIcon,
} from '@/lib/icons';

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

const LARGE_ICON_SIZE = 56;

const WITHDRAWAL_BADGE: Record<string, { icon: any; bg: string }> = {
  fiat: { icon: CreditCardIcon, bg: '#0090ff' },
  card: { icon: CreditCardIcon, bg: '#0090ff' },
  crypto: { icon: Wallet01Icon, bg: '#9f4fff' },
  p2p: { icon: Mail01Icon, bg: '#00ca48' },
};

/* ── Reusable detail row ───────────────────────────────────────────────── */
function Row({
  label,
  value,
  copyable,
  tone = 'default',
  leading,
  last,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  tone?: 'default' | 'success' | 'danger';
  leading?: React.ReactNode;
  last?: boolean;
}) {
  const onCopy = useCallback(async () => {
    await Clipboard.setStringAsync(value);
    void Haptics.selectionAsync();
  }, [value]);

  const valueColor =
    tone === 'success'
      ? 'text-success'
      : tone === 'danger'
        ? 'text-destructive'
        : 'text-text-primary';

  const body = (
    <View
      className={`flex-row items-center justify-between px-4 py-3.5 ${last ? '' : 'border-b border-stone-surface'}`}>
      <Text
        className="font-body text-[14px] text-text-muted"
        maxFontSizeMultiplier={1.4}
        style={{ flexShrink: 0 }}>
        {label}
      </Text>
      <View className="ml-4 flex-1 flex-row items-center justify-end gap-2">
        {leading}
        <Text
          className={`font-subtitle text-[14px] ${valueColor}`}
          numberOfLines={1}
          maxFontSizeMultiplier={1.4}
          style={{ maxWidth: '82%', textAlign: 'right' }}>
          {copyable ? truncateAddress(value) : value}
        </Text>
        {copyable && <HugeiconsIcon icon={Copy01Icon} size={15} color="#848281" />}
      </View>
    </View>
  );

  if (copyable) {
    return (
      <PressableScale
        onPress={onCopy}
        enableHaptics={false}
        accessibilityRole="button"
        accessibilityLabel={`Copy ${label}`}>
        {body}
      </PressableScale>
    );
  }
  return body;
}

/* ── Grouped card section ──────────────────────────────────────────────── */
function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View className="mt-6">
      {title ? (
        <Text
          className="mb-2 ml-1 font-body text-[12px] uppercase tracking-wider text-text-muted"
          maxFontSizeMultiplier={1.4}>
          {title}
        </Text>
      ) : null}
      <View className="overflow-hidden rounded-3xl border border-stone-surface bg-parchment-card">
        {children}
      </View>
    </View>
  );
}

/* ── Header hero icon (token / swap / action) ──────────────────────────── */
function HeroIcon({ transaction }: { transaction: Transaction }) {
  const { icon, withdrawalMethod } = transaction;

  let iconEl: React.ReactElement;
  if (icon?.type === 'swap') {
    iconEl = (
      <View style={{ width: LARGE_ICON_SIZE, height: LARGE_ICON_SIZE }}>
        <View
          className="absolute left-0 top-0 h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: icon.swapFromBg || '#000' }}>
          {icon.SwapFrom && <icon.SwapFrom width={22} height={22} />}
        </View>
        <View
          className="absolute bottom-0 right-0 h-10 w-10 items-center justify-center rounded-full border-2 border-warm-canvas"
          style={{ backgroundColor: icon.swapToBg || '#0090ff' }}>
          {icon.SwapTo && <icon.SwapTo width={22} height={22} />}
        </View>
      </View>
    );
  } else if (icon?.type === 'icon' && icon.iconName) {
    const map: Record<string, any> = {
      'arrow-up-right': ArrowUpRight01Icon,
      'arrow-down-left': ArrowDownLeft01Icon,
      repeat: RepeatIcon,
      plus: PlusSignIcon,
      minus: MinusSignIcon,
    };
    iconEl = (
      <View
        className="items-center justify-center rounded-full border-2 border-stone-surface bg-warm-canvas"
        style={{ width: LARGE_ICON_SIZE, height: LARGE_ICON_SIZE }}>
        <HugeiconsIcon icon={map[icon.iconName] ?? ArrowUpRight01Icon} size={24} color="#474645" />
      </View>
    );
  } else {
    const token =
      icon?.type === 'token'
        ? { Token: icon.Token, bgColor: icon.bgColor, isSymbol: false, withBorder: false }
        : resolveTransactionAssetIcon(transaction);
    iconEl = <TokenBubble token={token} />;
  }

  const badge = withdrawalMethod
    ? (WITHDRAWAL_BADGE[withdrawalMethod] ?? { icon: Tag01Icon, bg: '#848281' })
    : null;

  return (
    <View style={{ width: LARGE_ICON_SIZE, height: LARGE_ICON_SIZE }}>
      {iconEl}
      {badge && (
        <View
          className="absolute -bottom-0.5 -right-0.5 h-6 w-6 items-center justify-center rounded-full border-2 border-warm-canvas"
          style={{ backgroundColor: badge.bg }}>
          <HugeiconsIcon icon={badge.icon} size={11} color="#fff" strokeWidth={2.5} />
        </View>
      )}
    </View>
  );
}

function TokenBubble({
  token,
}: {
  token?: {
    Token?: SvgComponent;
    bgColor?: string;
    isSymbol?: boolean;
    withBorder?: boolean;
  } | null;
}) {
  return (
    <View
      style={{
        width: LARGE_ICON_SIZE,
        height: LARGE_ICON_SIZE,
        borderRadius: LARGE_ICON_SIZE / 2,
        borderWidth: token?.withBorder && token?.isSymbol ? 1 : 0,
        borderColor: '#f2f0ed',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: token?.bgColor || '#0090ff',
      }}>
      {token?.Token ? (
        <token.Token
          width={token.isSymbol ? 30 : LARGE_ICON_SIZE + 8}
          height={token.isSymbol ? 30 : LARGE_ICON_SIZE + 8}
        />
      ) : (
        <HugeiconsIcon icon={DollarCircleIcon} size={26} color="#FFFFFF" />
      )}
    </View>
  );
}

export default function TransactionDetailScreen() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { isBalanceVisible } = useUIStore();
  const cancelWithdrawal = useCancelWithdrawal();
  const { showSuccess, showError } = useFeedbackPopup();
  const { data: pajBanksData } = usePajBanks();

  const transaction = useTransactionDetailStore((s) => s.transaction);

  const [showMore, setShowMore] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const receiptRef = useRef<ViewShot>(null);

  // Subtle entrance haptic
  useEffect(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const close = useCallback(() => {
    useTransactionDetailStore.getState().clear();
    router.back();
  }, []);

  const handleShareReceipt = useCallback(async () => {
    if (!transaction) return;
    void Haptics.selectionAsync();
    setShowReceipt(true);
    await new Promise((r) => setTimeout(r, 100));
    try {
      const uri = await receiptRef.current?.capture?.();
      if (!uri) {
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

  if (!transaction) return <SafeAreaView className="flex-1 bg-warm-canvas" />;

  const meta = transaction.metadata ?? {};
  const { type, amount, currency = 'NGN', createdAt, toAddress, txHash, fee } = transaction;
  const isCancellable = transaction.type === 'withdraw' && transaction.status === 'pending';

  // meta.bankName may be a display name (RampHub) or a PAJ bank id (legacy).
  const pajBankById = (id: string) => (pajBanksData?.banks ?? []).find((b) => b.id === id)?.name;
  const resolvedBankName = meta.bankName
    ? (pajBankById(String(meta.bankName)) ?? String(meta.bankName))
    : meta.bankId
      ? (pajBankById(String(meta.bankId)) ?? String(meta.bankId))
      : undefined;

  const handleCancel = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Cancel Withdrawal', 'Are you sure you want to cancel this withdrawal?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: () => {
          setCancelling(true);
          cancelWithdrawal.mutate(transaction.id, {
            onSuccess: () => {
              showSuccess('Withdrawal cancelled');
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              close();
            },
            onError: (error) => {
              setCancelling(false);
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              safeError('Cancel withdrawal failed', error);
              showError('Cancellation failed', (error as any)?.message || 'Please try again later');
            },
          });
        },
      },
    ]);
  };

  // Primary rows
  const primaryRows: React.ReactNode[] = [];
  const push = (node: React.ReactNode) => primaryRows.push(node);

  if (meta.bankAccountName)
    push(<Row key="recipient" label="Recipient" value={String(meta.bankAccountName)} />);
  if (transaction.title && !meta.bankAccountName)
    push(<Row key="desc" label="Description" value={transaction.title} />);
  if ((type === 'send' || type === 'receive') && toAddress)
    push(<Row key="addr" label={type === 'send' ? 'To' : 'From'} value={toAddress} copyable />);
  if (type === 'deposit')
    push(<Row key="method" label="Method" value={transaction.subtitle || 'Card'} />);
  if (type === 'withdraw' && !meta.bankAccountName)
    push(
      <Row
        key="to"
        label="To"
        value={String(meta.bankAccountNumber || transaction.subtitle || 'Bank Account')}
      />
    );
  if (type === 'swap')
    push(<Row key="via" label="Via" value={transaction.subtitle || 'Rail Exchange'} />);
  if (meta.fiatAmount)
    push(
      <Row
        key="naira"
        label="Naira Amount"
        value={`₦${Number(meta.fiatAmount).toLocaleString()}`}
      />
    );
  if (meta.secondaryCurrency && meta.fiatAmount && meta.rate)
    push(<Row key="rate2" label="Rate" value={`₦${Number(meta.rate).toLocaleString()}/$1`} />);
  if (resolvedBankName)
    push(
      <Row
        key="bank"
        label="Bank"
        value={resolvedBankName}
        leading={<BankLogo bankName={resolvedBankName} size={22} />}
      />
    );
  else if (type === 'withdraw' && transaction.subtitle?.includes('•'))
    push(<Row key="bank2" label="Bank" value={transaction.subtitle.split('•')[0].trim()} />);
  if (meta.bankAccountNumber)
    push(<Row key="acct" label="Account" value={String(meta.bankAccountNumber)} copyable />);
  push(
    <Row
      key="status"
      label="Status"
      value={statusLabel(transaction.status)}
      tone={
        transaction.status === 'completed'
          ? 'success'
          : transaction.status === 'failed'
            ? 'danger'
            : 'default'
      }
    />
  );
  push(<Row key="date" label="Date" value={formatDate(createdAt)} />);
  if (txHash) push(<Row key="txhash" label="Transaction ID" value={txHash} copyable />);
  if (fee)
    push(
      <Row
        key="fee"
        label="Fees"
        value={fee}
        tone={fee.toLowerCase().includes('covered') ? 'success' : 'default'}
      />
    );
  if (meta.chain) push(<Row key="chain" label="Network" value={String(meta.chain)} />);
  if (meta.narration) push(<Row key="note" label="Note" value={String(meta.narration)} />);

  // "More" rows
  const extraRows: { label: string; value: string; copyable?: boolean }[] = [];
  if (meta.bankAccountNumber)
    extraRows.push({
      label: 'Account Number',
      value: String(meta.bankAccountNumber),
      copyable: true,
    });
  if (meta.rate)
    extraRows.push({ label: 'Exchange Rate', value: `₦${Number(meta.rate).toLocaleString()}` });
  if (meta.tokenAmount)
    extraRows.push({ label: 'USDC Amount', value: `$${Number(meta.tokenAmount).toFixed(2)}` });
  if (meta.fee) extraRows.push({ label: 'Fee', value: `$${Number(meta.fee).toFixed(2)}` });
  if (meta.chain) extraRows.push({ label: 'Network', value: String(meta.chain) });
  if (meta.depositType) extraRows.push({ label: 'Deposit Type', value: String(meta.depositType) });
  if (transaction.id) extraRows.push({ label: 'Reference', value: transaction.id, copyable: true });
  const hasExtra = extraRows.length > 0;

  const isCredit = type === 'deposit' || type === 'receive';
  const amountTone =
    transaction.status === 'failed'
      ? 'text-destructive'
      : isCredit
        ? 'text-success'
        : 'text-text-primary';

  const Entrance = reduceMotion ? View : Animated.View;
  const entranceProps = (delay: number) =>
    reduceMotion ? {} : { entering: FadeInUp.delay(delay).duration(300) };

  return (
    <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-2 pt-1">
        <PressableScale
          onPress={close}
          className="size-11 items-center justify-center rounded-full bg-surface"
          accessibilityRole="button"
          accessibilityLabel="Close">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#343433" />
        </PressableScale>
        <Text className="font-subtitle text-[17px] text-text-primary" maxFontSizeMultiplier={1.3}>
          Details
        </Text>
        <PressableScale
          onPress={handleShareReceipt}
          className="size-11 items-center justify-center rounded-full bg-surface"
          accessibilityRole="button"
          accessibilityLabel="Share receipt">
          <HugeiconsIcon icon={Share01Icon} size={19} color="#343433" />
        </PressableScale>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}>
        {/* Hero */}
        <Entrance {...entranceProps(0)} className="items-center pb-2 pt-4">
          <HeroIcon transaction={transaction} />
          <View className="mt-3 rounded-full bg-surface px-3 py-1">
            <Text
              className="font-caption text-[11px] uppercase tracking-wide text-text-muted"
              maxFontSizeMultiplier={1.3}>
              {typeLabels[type]}
            </Text>
          </View>
          <View className="mt-3">
            <MaskedBalance
              value={`${isCredit ? '+' : '−'}${formatAbsAmount(amount)} ${currency}`}
              visible={isBalanceVisible}
              textClass="text-[34px]"
              colorClass={amountTone}
            />
          </View>
          <Text className="mt-1 font-body text-[13px] text-text-muted" maxFontSizeMultiplier={1.4}>
            {formatDate(createdAt)}
          </Text>
        </Entrance>

        {/* Details */}
        <Entrance {...entranceProps(60)}>
          <Section title="Details">{primaryRows}</Section>
        </Entrance>

        {/* More */}
        {hasExtra && (
          <Entrance {...entranceProps(100)}>
            {showMore ? (
              <Section title="More">
                {extraRows.map((r, i) => (
                  <Row
                    key={r.label}
                    label={r.label}
                    value={r.value}
                    copyable={r.copyable}
                    last={i === extraRows.length - 1}
                  />
                ))}
              </Section>
            ) : (
              <PressableScale
                onPress={() => setShowMore(true)}
                accessibilityRole="button"
                accessibilityLabel="Show more details"
                className="mt-4 flex-row items-center justify-center gap-1 py-2">
                <Text
                  className="font-subtitle text-[14px] text-sky-blue"
                  maxFontSizeMultiplier={1.4}>
                  Show more
                </Text>
              </PressableScale>
            )}
          </Entrance>
        )}

        {/* Cancel withdrawal */}
        {isCancellable && (
          <Entrance {...entranceProps(140)}>
            <PressableScale
              onPress={handleCancel}
              disabled={cancelling}
              accessibilityRole="button"
              accessibilityLabel="Cancel withdrawal"
              className="mt-6 min-h-[52px] flex-row items-center justify-center gap-2 rounded-full border border-destructive/40 py-3.5">
              {cancelling ? (
                <ActivityIndicator size="small" color="#ff2b3a" />
              ) : (
                <>
                  <HugeiconsIcon icon={Cancel01Icon} size={17} color="#ff2b3a" />
                  <Text
                    className="font-subtitle text-[15px] text-destructive"
                    maxFontSizeMultiplier={1.3}>
                    Cancel withdrawal
                  </Text>
                </>
              )}
            </PressableScale>
          </Entrance>
        )}
      </ScrollView>

      {/* Hidden receipt for capture */}
      {showReceipt && (
        <View style={{ position: 'absolute', left: -9999 }}>
          <ViewShot ref={receiptRef} options={{ format: 'png', quality: 1 }}>
            <ReceiptImage transaction={transaction} bankName={resolvedBankName} />
          </ViewShot>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ── Shared receipt image (ViewShot capture target) ────────────────────── */
function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f2f0ed',
      }}>
      <Text
        style={{ fontFamily: 'Satoshi-Regular', fontSize: 13, color: '#848281' }}
        maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
      <Text
        style={{
          fontFamily: 'Satoshi-Medium',
          fontSize: 13,
          color: '#343433',
          maxWidth: '55%',
          textAlign: 'right',
        }}
        maxFontSizeMultiplier={1.3}>
        {value}
      </Text>
    </View>
  );
}

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
      <View
        style={{
          backgroundColor: status === 'failed' ? '#fff1f2' : isCredit ? '#f0fdf4' : '#F0F4FF',
          paddingTop: 32,
          paddingBottom: 24,
          alignItems: 'center',
        }}>
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
          }}
          maxFontSizeMultiplier={1.3}>
          {isCredit ? '+' : '−'}
          {formatAbsAmount(amount)} {currency}
        </Text>
        <Text
          style={{
            fontFamily: 'Satoshi-Medium',
            fontSize: 14,
            color: status === 'failed' ? '#ff2b3a' : '#00ca48',
            marginTop: 4,
          }}
          maxFontSizeMultiplier={1.3}>
          {statusLabel(status)}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 20 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: '#f2f0ed' }} />
      </View>

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

      <View
        style={{
          alignItems: 'center',
          paddingVertical: 20,
          borderTopWidth: 1,
          borderTopColor: '#f2f0ed',
          marginHorizontal: 20,
        }}>
        <Text
          style={{ fontFamily: 'Satoshi-Bold', fontSize: 15, color: '#343433', letterSpacing: 1 }}
          maxFontSizeMultiplier={1.3}>
          RAIL MONEY
        </Text>
        <Text
          style={{ fontFamily: 'Satoshi-Regular', fontSize: 11, color: '#848281', marginTop: 2 }}
          maxFontSizeMultiplier={1.3}>
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
