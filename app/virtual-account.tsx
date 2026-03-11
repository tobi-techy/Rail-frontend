import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import {
  ArrowLeft,
  Copy,
  CheckCircle,
  ArrowRightLeft,
  ArrowDownToLine,
  Sparkles,
  Building2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useKYCStatus } from '@/api/hooks';
import { useVirtualAccounts, useCreateVirtualAccount } from '@/api/hooks/useVirtualAccount';
import { virtualAccountService } from '@/api/services/virtualAccount.service';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { Button } from '@/components/ui';
import type { VirtualAccount } from '@/api/types/funding';

import { UsdIcon, EurIcon, GbpIcon, UsdcIcon } from '@/assets/svg';

type Currency = 'USD' | 'EUR' | 'GBP';

const CURRENCY_ICON: Record<Currency, React.ReactNode> = {
  USD: <UsdIcon width={48} height={48} />,
  EUR: <EurIcon width={48} height={48} />,
  GBP: <GbpIcon width={48} height={48} />,
};

const CURRENCY_TAB_ICON: Record<Currency, React.ReactNode> = {
  USD: <UsdIcon width={22} height={22} />,
  EUR: <EurIcon width={22} height={22} />,
  GBP: <GbpIcon width={22} height={22} />,
};

const FEATURES = [
  {
    icon: <ArrowRightLeft size={20} color="#fff" />,
    bg: '#22C55E',
    text: 'Deposit USD and automatically receive USDC in your Rail wallet',
  },
  {
    icon: <ArrowDownToLine size={20} color="#fff" />,
    bg: '#8B5CF6',
    text: 'Receive payments from anyone with a bank account at 0% conversion fee',
  },
  {
    icon: <Sparkles size={20} color="#fff" />,
    bg: '#3B82F6',
    text: 'Instant setup via Bridge — your money starts working immediately',
  },
];

function CurrencyTab({
  currency,
  selected,
  onPress,
}: {
  currency: Currency;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: selected ? '#fff' : 'transparent',
      }}>
      {CURRENCY_TAB_ICON[currency]}
      <Text className={`font-subtitle text-[15px] ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
        {currency}
      </Text>
    </Pressable>
  );
}

function FeatureRow({
  icon,
  bg,
  text,
  index,
}: {
  icon: React.ReactNode;
  bg: string;
  text: string;
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify()}
      className="flex-row items-start gap-4 border-b border-gray-100 py-4 last:border-b-0">
      <View
        className="h-10 w-10 items-center justify-center rounded-2xl"
        style={{ backgroundColor: bg }}>
        {icon}
      </View>
      <Text className="flex-1 font-body text-[14px] leading-[21px] text-gray-500">{text}</Text>
    </Animated.View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const { showInfo } = useFeedbackPopup();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handleCopy = useCallback(async () => {
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    await Clipboard.setStringAsync(value);
    showInfo('Copied', `${label} copied to clipboard`);
  }, [value, label, showInfo, scale]);

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={handleCopy}
        activeOpacity={0.7}
        className="flex-row items-center justify-between border-b border-gray-100 py-4">
        <View className="flex-1">
          <Text className="mb-0.5 font-body text-[12px] text-gray-400">{label}</Text>
          <Text className="font-subtitle text-[15px] text-gray-900">{value}</Text>
        </View>
        <Copy size={16} color="#9CA3AF" />
      </TouchableOpacity>
    </Animated.View>
  );
}

function AccountCard({ account }: { account: VirtualAccount }) {
  const isPending = account.status === 'pending';
  const currencyIcon = CURRENCY_ICON[account.currency as Currency];

  return (
    <Animated.View
      entering={FadeInDown.springify()}
      className="mb-4 rounded-3xl bg-gray-50 px-5 py-2">
      <View className="flex-row items-center border-b border-gray-100 py-4">
        <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
          {currencyIcon ?? <Building2 size={22} color="#9CA3AF" />}
        </View>
        <View className="flex-1">
          <Text className="font-subtitle text-[16px] text-gray-900">
            {account.currency} Account
          </Text>
          <Text className="font-body text-[13px] text-gray-400">
            {isPending ? 'Setting up…' : 'Ready for deposits'}
          </Text>
        </View>
        <View className={`rounded-full px-3 py-1 ${isPending ? 'bg-amber-100' : 'bg-green-100'}`}>
          <Text
            className={`font-body text-[12px] ${isPending ? 'text-amber-700' : 'text-green-700'}`}>
            {isPending ? 'Pending' : 'Active'}
          </Text>
        </View>
      </View>

      <DetailRow label="Bank Name" value={account.bank_name || 'Lead Bank'} />
      <DetailRow
        label="Account Holder"
        value={account.beneficiary_name || 'Rail Technologies Inc.'}
      />
      <DetailRow label="Account Number" value={account.account_number || '—'} />
      {account.routing_number ? (
        <DetailRow label="Routing Number" value={account.routing_number} />
      ) : null}
      <DetailRow label="Account Type" value="Checking" />
    </Animated.View>
  );
}

// ─── Intro screen (no accounts yet) ────────────────────────────────────────
function IntroScreen({ onCreateAccount }: { onCreateAccount: (currency: Currency) => void }) {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [awaitingTos, setAwaitingTos] = useState(false);
  const { mutate: create, isPending, error, reset } = useCreateVirtualAccount();

  const isTosError = (err: unknown) => {
    const e = err as any;
    return (
      e?.code === 'has_not_accepted_tos' ||
      String(e?.message ?? '').includes('has_not_accepted_tos')
    );
  };

  const handleCreate = () => {
    create(currency, {
      onSuccess: () => onCreateAccount(currency),
      onError: async (err) => {
        if (isTosError(err)) {
          try {
            const res = await virtualAccountService.getTOSLink();
            const url = res?.tos_link;
            if (!url) throw new Error('No ToS link returned');
            setAwaitingTos(true);
            await WebBrowser.openAuthSessionAsync(url);
            setAwaitingTos(false);
            reset();
            create(currency, { onSuccess: () => onCreateAccount(currency) });
          } catch (tosErr) {
            console.warn('[ToS] Failed to open ToS link:', tosErr);
            setAwaitingTos(false);
          }
        }
      },
    });
  };

  return (
    <View className="flex-1">
      {/* Currency toggle */}
      <Animated.View
        entering={FadeIn.duration(300)}
        className="mx-auto mt-6 w-52 flex-row rounded-full bg-gray-100 p-1">
        {(['USD', 'EUR'] as Currency[]).map((c) => (
          <CurrencyTab
            key={c}
            currency={c}
            selected={currency === c}
            onPress={() => setCurrency(c)}
          />
        ))}
      </Animated.View>

      {/* Hero illustration */}
      <Animated.View entering={FadeIn.delay(100).duration(400)} className="my-8 items-center">
        <View className="h-36 w-36 items-center justify-center rounded-full bg-gray-100">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-gray-200">
            <View
              style={{
                position: 'relative',
                width: 80,
                height: 80,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {CURRENCY_ICON[currency]}
              <View style={{ position: 'absolute', bottom: -4, right: -4 }}>
                <UsdcIcon width={32} height={32} />
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Title */}
      <Animated.View entering={FadeInDown.delay(150).springify()} className="mb-6 items-center">
        <Text className="text-center font-subtitle text-[26px] leading-[32px] text-gray-900">
          Create your{'\n'}Virtual {currency} Bank Account
        </Text>
      </Animated.View>

      {/* Features */}
      <View className="mb-4">
        {FEATURES.map((f, i) => (
          <FeatureRow key={i} index={i} icon={f.icon} bg={f.bg} text={f.text} />
        ))}
      </View>

      {/* Disclaimer */}
      <Text className="mb-6 text-center font-body text-[12px] text-gray-400">
        {currency === 'USD'
          ? 'Excluded US states: NY and AK.'
          : 'Available in supported EU countries.'}
      </Text>

      {/* Error */}
      {error && !isTosError(error) ? (
        <Animated.View
          entering={FadeIn}
          className="mb-4 flex-row items-center gap-3 rounded-2xl bg-red-50 px-4 py-3">
          <AlertCircle size={18} color="#EF4444" />
          <Text className="flex-1 font-body text-[13px] text-red-600">
            {(error as any)?.message ?? 'Something went wrong. Please try again.'}
          </Text>
        </Animated.View>
      ) : awaitingTos ? (
        <Animated.View
          entering={FadeIn}
          className="mb-4 flex-row items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3">
          <AlertCircle size={18} color="#F59E0B" />
          <Text className="flex-1 font-body text-[13px] text-amber-700">
            Please accept the Terms of Service in your browser, then return to the app.
          </Text>
        </Animated.View>
      ) : null}

      <Button
        title={isPending || awaitingTos ? 'Setting up…' : 'Create account'}
        onPress={handleCreate}
        disabled={isPending || awaitingTos}
        variant="black"
      />
    </View>
  );
}

// ─── Accounts list screen ───────────────────────────────────────────────────
function AccountsScreen({
  accounts,
  isRefetching,
  refetch,
  onAddMore,
}: {
  accounts: VirtualAccount[];
  isRefetching: boolean;
  refetch: () => void;
  onAddMore: () => void;
}) {
  return (
    <ScrollView
      className="flex-1 px-5"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#000" />
      }>
      <Animated.View entering={FadeInDown.springify()} className="mb-6 items-center pt-4">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <CheckCircle size={32} color="#22C55E" />
        </View>
        <Text className="mb-1 font-subtitle text-xl text-gray-900">Account Ready</Text>
        <Text className="text-center font-body text-[14px] text-gray-500">
          Transfer funds to start your 70/30 split
        </Text>
      </Animated.View>

      {accounts.map((account) => (
        <AccountCard key={account.id} account={account} />
      ))}

      {/* Add another currency */}
      <TouchableOpacity
        onPress={onAddMore}
        className="mb-4 flex-row items-center justify-between rounded-3xl border border-dashed border-gray-200 px-5 py-4">
        <Text className="font-body text-[14px] text-gray-400">Add another currency account</Text>
        <ChevronRight size={18} color="#9CA3AF" />
      </TouchableOpacity>

      <View className="mb-4 flex-row rounded-2xl bg-blue-50 px-4 py-3">
        <Building2 size={18} color="#3B82F6" />
        <Text className="ml-3 flex-1 font-body text-[13px] leading-[19px] text-blue-700">
          Deposits typically arrive within 1–3 business days. Wire transfers may arrive same day.
        </Text>
      </View>
      <View className="h-8" />
    </ScrollView>
  );
}

// ─── Root ───────────────────────────────────────────────────────────────────
export default function VirtualAccountScreen() {
  const [showIntro, setShowIntro] = useState(false);
  const { data: kycStatus, isLoading: isKycLoading } = useKYCStatus();
  const isApproved = kycStatus?.status === 'approved';

  const {
    data: accountsData,
    refetch,
    isRefetching,
    isLoading: isAccountsLoading,
  } = useVirtualAccounts(isApproved);

  const accounts = accountsData?.virtual_accounts ?? [];
  const hasAccounts = accounts.length > 0;

  // Show intro if no accounts yet, or user explicitly wants to add more
  const showingIntro = !hasAccounts || showIntro;

  if (isKycLoading || isAccountsLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-5 pb-2 pt-2">
        <TouchableOpacity
          onPress={() => (showIntro && hasAccounts ? setShowIntro(false) : router.back())}
          hitSlop={12}
          className="mr-4 p-1">
          <ArrowLeft size={24} color="#111" />
        </TouchableOpacity>
        <Text className="font-subtitle text-lg text-gray-900">
          {showingIntro ? 'Bank Account' : 'Bank Accounts'}
        </Text>
      </View>

      {showingIntro ? (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          <IntroScreen
            onCreateAccount={() => {
              setShowIntro(false);
              refetch();
            }}
          />
          <View className="h-8" />
        </ScrollView>
      ) : (
        <AccountsScreen
          accounts={accounts}
          isRefetching={isRefetching}
          refetch={refetch}
          onAddMore={() => setShowIntro(true)}
        />
      )}
    </SafeAreaView>
  );
}
