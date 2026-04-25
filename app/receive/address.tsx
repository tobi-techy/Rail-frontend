import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, Pressable, ActivityIndicator, StatusBar, Share, useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import QRCodeStyled from 'react-native-qrcode-styled';
import { ChainLogo } from '@/components/ChainLogo';
import { useWalletAddresses, useGetDepositAddress } from '@/api/hooks/useWallet';
import { getChainConfig, isSolanaChain } from '@/utils/chains';
import { useHaptics } from '@/hooks/useHaptics';
import type { WalletChain } from '@/api/types';
import {
  ArrowLeft01Icon, Copy01Icon, CheckmarkCircle01Icon,
  Share01Icon, RefreshIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

export default function ReceiveAddressScreen() {
  const { chain: chainParam } = useLocalSearchParams<{ chain: string }>();
  const chain = (chainParam ?? 'SOL') as WalletChain;
  const chainConfig = getChainConfig(chain);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { notification } = useHaptics();

  const { data: wallet, isLoading, isError, error, refetch } = useWalletAddresses(chain);
  const provisionWallet = useGetDepositAddress();
  const [copied, setCopied] = useState(false);
  const [provisioning, setProvisioning] = useState(false);

  useEffect(() => {
    const status = (error as any)?.status;
    if (isError && (status === 404 || status === undefined) && !provisioning) {
      setProvisioning(true);
      provisionWallet.mutate(
        { tokenId: 'usdc', network: chain },
        {
          onSuccess: () => { refetch(); setProvisioning(false); },
          onError: () => setProvisioning(false),
        }
      );
    }
  }, [isError, error, chain]);

  const address = wallet?.address ?? '';

  const isSolana = isSolanaChain(chain);
  const usdcMint = process.env.EXPO_PUBLIC_SOLANA_USDC_MINT ?? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
  const qrValue = isSolana && address
    ? `solana:${address}?spl-token=${usdcMint}&label=Rail`
    : address || 'loading';

  const qrSize = width - 48; // edge-to-edge with 24px margin each side

  const handleCopy = useCallback(async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    notification();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [address, notification]);

  const handleShare = useCallback(async () => {
    if (!address) return;
    await Share.share({ message: address });
  }, [address]);

  const isReady = !isLoading && !provisioning && !!address;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
        <Pressable
          className="size-11 items-center justify-center rounded-full bg-surface"
          onPress={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#111827" />
        </Pressable>
        <View className="flex-row items-center gap-2">
          <View
            className="size-7 items-center justify-center rounded-full"
            style={{ backgroundColor: chainConfig.color + '18' }}>
            <ChainLogo chain={chain} size={18} />
          </View>
          <Text className="font-subtitle text-[17px] text-text-primary">
            {chainConfig.label}
          </Text>
        </View>
        <Pressable
          className="size-11 items-center justify-center rounded-full bg-surface"
          onPress={() => refetch()}>
          <HugeiconsIcon icon={RefreshIcon} size={18} color="#9CA3AF" />
        </Pressable>
      </View>

      {/* QR — takes up top half, edge-to-edge feel */}
      <View className="flex-1 items-center justify-center px-6">
        {isReady ? (
          <View>
            <View className="items-center justify-center">
              <QRCodeStyled
                data={qrValue}
                style={{ backgroundColor: 'white' }}
                padding={16}
                size={qrSize}
                pieceBorderRadius={3}
                isPiecesGlued
                color="#000000"
                errorCorrectionLevel="H"
                innerEyeStyle={{ borderRadius: 6 }}
                outerEyeStyle={{ borderRadius: 10 }}
              />
              {/* Chain logo centered over QR */}
              <View
                className="absolute items-center justify-center rounded-full bg-white"
                style={{ width: 64, height: 64, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
                <ChainLogo chain={chain} size={36} />
              </View>
            </View>
            {/* Warning */}
            <Text className="mt-5 text-center font-body text-[13px] text-text-secondary">
              Only send{' '}
              <Text className="font-subtitle text-text-primary">{chainConfig.label}</Text>
              {' '}USDC to this address.
            </Text>
          </View>
        ) : (
          <View className="items-center gap-3">
            <ActivityIndicator size="large" color="#111827" />
            <Text className="font-body text-[14px] text-text-secondary">
              {provisioning ? 'Setting up your wallet…' : 'Loading address…'}
            </Text>
          </View>
        )}

        {isError && !provisioning && !address && (
          <View className="items-center gap-3">
            <Text className="font-subtitle text-[16px] text-text-primary">Unable to load wallet</Text>
            <Text className="text-center font-body text-[13px] text-text-secondary">
              Check your connection and try again.
            </Text>
            <Pressable
              onPress={() => refetch()}
              className="flex-row items-center gap-2 rounded-full bg-surface px-5 py-2.5">
              <HugeiconsIcon icon={RefreshIcon} size={16} color="#374151" />
              <Text className="font-subtitle text-[14px] text-text-primary">Retry</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Bottom section */}
      <View
        className="border-t border-gray-100 px-5 pt-5"
        style={{ paddingBottom: Math.max(insets.bottom, 24) }}>

        {/* Token + network */}
        <View className="mb-3 flex-row items-center gap-2">
          <Text className="font-subtitle text-[22px] text-text-primary">USDC</Text>
          <View className="rounded-lg bg-surface px-2.5 py-1">
            <Text className="font-body text-[13px] text-text-secondary">{chainConfig.label}</Text>
          </View>
        </View>

        {/* Address + copy */}
        <Pressable
          onPress={handleCopy}
          className="mb-5 flex-row items-start justify-between gap-3">
          <Text
            className="flex-1 font-body text-[14px] leading-5 text-text-secondary"
            selectable>
            {address || '—'}
          </Text>
          <HugeiconsIcon
            icon={copied ? CheckmarkCircle01Icon : Copy01Icon}
            size={20}
            color={copied ? '#10B981' : '#9CA3AF'}
          />
        </Pressable>

        {/* Action buttons */}
        <View className="flex-row gap-3">
          <Pressable
            onPress={handleCopy}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-surface py-4">
            <HugeiconsIcon
              icon={copied ? CheckmarkCircle01Icon : Copy01Icon}
              size={18}
              color={copied ? '#10B981' : '#111827'}
            />
            <Text className="font-subtitle text-[15px] text-text-primary">
              {copied ? 'Copied!' : 'Copy address'}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleShare}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-[#070914] py-4">
            <HugeiconsIcon icon={Share01Icon} size={18} color="white" />
            <Text className="font-subtitle text-[15px] text-white">Share QR</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
