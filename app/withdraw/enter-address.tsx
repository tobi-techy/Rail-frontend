import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, StatusBar, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft01Icon,
  ScanIcon,
  Cancel01Icon,
  Copy01Icon,
  IconComponent as HugeiconsIcon,
} from '@/lib/icons';
import { DiceBearAvatar } from '@/components/atoms/DiceBearAvatar';
import { useHaptics } from '@/hooks/useHaptics';
import { Button } from '@/components/ui';
import { getDestinationError } from '@/components/withdraw/method-screen/utils';
import { QRScanSheet } from '@/components/sheets/QRScanSheet';
import { NewAddressWarningSheet } from '@/components/sheets/NewAddressWarningSheet';
import { useAddWhitelistAddress } from '@/api/hooks/useSecurity';

const RECENT_KEY = 'rail:crypto_recent_addresses';

interface RecentAddress {
  address: string;
  chain: string;
  lastUsed: number;
}

async function loadRecent(chain: string): Promise<RecentAddress[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    const all: RecentAddress[] = raw ? JSON.parse(raw) : [];
    return all.filter((r) => r.chain === chain).slice(0, 10);
  } catch {
    return [];
  }
}

async function saveRecent(address: string, chain: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    const all: RecentAddress[] = raw ? JSON.parse(raw) : [];
    const filtered = all.filter((r) => r.address !== address);
    filtered.unshift({ address, chain, lastUsed: Date.now() });
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(filtered.slice(0, 30)));
  } catch {}
}

async function removeRecent(address: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    const all: RecentAddress[] = raw ? JSON.parse(raw) : [];
    await AsyncStorage.setItem(
      RECENT_KEY,
      JSON.stringify(all.filter((r) => r.address !== address))
    );
  } catch {}
}

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function EnterAddressScreen() {
  const { impact, selection } = useHaptics();
  const inputRef = useRef<TextInput>(null);
  const params = useLocalSearchParams<{
    chain?: string;
    chainLabel?: string;
    currency?: string;
  }>();
  const chain = params.chain ?? 'SOL';
  const chainLabel = params.chainLabel ?? 'Solana';
  const currency = params.currency ?? 'USDC';

  const [address, setAddress] = useState('');
  const [recent, setRecent] = useState<RecentAddress[]>([]);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    loadRecent(chain).then(setRecent);
  }, [chain]);

  const error =
    address.length > 0
      ? getDestinationError({
          destinationInput: address,
          isCryptoDestinationMethod: true,
          isFiatMethod: false,
          isAssetTradeMethod: false,
          isMobileWalletFundingFlow: false,
          destinationChain: chain,
          fiatCurrency: 'USD',
        })
      : null;

  const canContinue = address.length > 0 && !error;
  const [showWarning, setShowWarning] = useState(false);
  const addWhitelist = useAddWhitelistAddress();

  const isNewAddress = canContinue && !recent.some((r) => r.address === address);

  const proceedToAmount = useCallback(async () => {
    impact();
    setShowWarning(false);
    await saveRecent(address, chain);
    router.push({
      pathname: '/withdraw/crypto-send' as never,
      params: {
        destinationInput: address,
        destinationChain: chain,
        currency,
      },
    });
  }, [address, chain, currency, impact]);

  const handleContinue = useCallback(async () => {
    if (!canContinue) return;

    // Show warning for new addresses
    if (isNewAddress && !showWarning) {
      setShowWarning(true);
      return;
    }

    await proceedToAmount();
  }, [canContinue, isNewAddress, showWarning, proceedToAmount]);

  const handleWhitelistAndContinue = useCallback(() => {
    addWhitelist.mutate(
      { chain, address, label: truncateAddress(address) },
      { onSuccess: () => proceedToAmount(), onError: () => proceedToAmount() }
    );
  }, [addWhitelist, chain, address, proceedToAmount]);

  const handlePaste = useCallback(async () => {
    const text = await Clipboard.getStringAsync();
    if (text?.trim()) {
      selection();
      setAddress(text.trim());
    }
  }, [selection]);

  const handleSelectRecent = useCallback(
    (addr: string) => {
      selection();
      setAddress(addr);
    },
    [selection]
  );

  const handleRemoveRecent = useCallback(
    (addr: string) => {
      selection();
      removeRecent(addr);
      setRecent((prev) => prev.filter((r) => r.address !== addr));
    },
    [selection]
  );

  const handleQRScanned = useCallback((data: string) => {
    // Strip common URI prefixes (solana:, ethereum:)
    const cleaned = data.replace(/^(solana|ethereum|bitcoin):/, '').split('?')[0];
    setAddress(cleaned);
    setShowScanner(false);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
          <Pressable
            className="size-11 items-center justify-center"
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#1C1C1E" />
          </Pressable>
          <Pressable
            className="size-11 items-center justify-center"
            onPress={() => setShowScanner(true)}
            accessibilityRole="button"
            accessibilityLabel="Scan QR code">
            <HugeiconsIcon icon={ScanIcon} size={22} color="#1C1C1E" />
          </Pressable>
        </View>

        {/* Title */}
        <Animated.View entering={FadeIn.duration(200)} className="px-5 pt-4">
          <Text className="font-subtitle text-[30px] text-text-primary">Receiving address</Text>
        </Animated.View>

        {/* Main content — FlatList as single scrollable surface */}
        <FlatList
          data={recent}
          keyExtractor={(item) => item.address}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
          ListHeaderComponent={
            <View className="px-5 pt-6">
              {/* Address input */}
              <TextInput
                ref={inputRef}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter wallet address or domain name"
                placeholderTextColor="#9C9C9C"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                multiline
                className="font-body text-[16px] leading-[24px] text-text-primary"
                style={{ minHeight: 48 }}
              />

              {/* Error */}
              {error && address.length > 5 && (
                <Animated.View entering={FadeIn.duration(150)} className="mt-2">
                  <Text className="font-body text-[13px] text-[#E53935]">{error}</Text>
                </Animated.View>
              )}

              {/* Paste button */}
              <Animated.View entering={FadeIn.delay(100).duration(200)} className="mt-6 self-end">
                <Pressable
                  onPress={handlePaste}
                  className="flex-row items-center gap-2 rounded-full border border-black/[0.08] bg-surface px-4 py-2.5"
                  accessibilityRole="button"
                  accessibilityLabel="Paste address from clipboard">
                  <HugeiconsIcon icon={Copy01Icon} size={16} color="#343433" />
                  <Text className="font-body-medium text-[14px] text-text-primary">Paste</Text>
                </Pressable>
              </Animated.View>

              {/* Divider */}
              <View className="mt-8 h-px bg-black/[0.06]" />

              {/* Recent tab */}
              <View className="mb-4 mt-5 flex-row items-center">
                <View className="rounded-full bg-[#1C1C1E] px-4 py-2">
                  <Text className="font-body-medium text-[13px] text-white">Recent</Text>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <Text className="px-5 py-8 text-center font-body text-[14px] text-text-secondary">
              No recent addresses on {chainLabel}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleSelectRecent(item.address)}
              className="mx-5 flex-row items-center py-3.5 active:bg-black/[0.03]"
              accessibilityRole="button">
              <View className="size-10 overflow-hidden rounded-xl">
                <DiceBearAvatar seed={item.address} size={40} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-subtitle text-[15px] text-text-primary">
                  {truncateAddress(item.address)}
                </Text>
                <Text
                  className="mt-0.5 font-body text-[12px] text-text-secondary"
                  numberOfLines={1}>
                  {item.address}
                </Text>
              </View>
              <Pressable
                onPress={() => handleRemoveRecent(item.address)}
                hitSlop={12}
                className="ml-2 p-1"
                accessibilityRole="button"
                accessibilityLabel="Remove address">
                <HugeiconsIcon icon={Cancel01Icon} size={16} color="#9C9C9C" />
              </Pressable>
            </Pressable>
          )}
        />

        {/* Continue button */}
        {canContinue && (
          <Animated.View entering={FadeIn.duration(200)} className="px-5 pb-4">
            <Button title="Continue" variant="black" onPress={handleContinue} size="large" />
          </Animated.View>
        )}
      </KeyboardAvoidingView>

      {/* QR Scanner */}
      {showScanner && (
        <QRScanSheet
          visible={showScanner}
          onClose={() => setShowScanner(false)}
          onScanned={handleQRScanned}
        />
      )}

      {/* New address warning */}
      <NewAddressWarningSheet
        visible={showWarning}
        address={address}
        chain={chainLabel}
        isLoading={addWhitelist.isPending}
        onConfirm={handleWhitelistAndContinue}
        onCancel={() => setShowWarning(false)}
      />
    </SafeAreaView>
  );
}
