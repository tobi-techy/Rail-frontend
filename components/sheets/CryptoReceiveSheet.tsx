import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import QRCodeStyled from 'react-native-qrcode-styled';
import { BottomSheet } from './BottomSheet';
import { Button } from '../ui';
import { useDepositAddress } from '@/api/hooks/useWallet';
import { getChainConfig } from '@/utils/chains';
import { useHaptics } from '@/hooks/useHaptics';
import { SolanaIcon, MaticIcon, AvalancheIcon, UsdcIcon } from '@/assets/svg';
import type { WalletChain } from '@/api/types';
import { CheckmarkCircle01Icon, Copy01Icon, RefreshIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

const CHAIN_ICONS: Record<string, React.ComponentType<any>> = {
  SOL: SolanaIcon,
  'SOL-DEVNET': SolanaIcon,
  'MATIC-AMOY': MaticIcon,
  'AVAX-FUJI': AvalancheIcon,
};

interface CryptoReceiveSheetProps {
  visible: boolean;
  onClose: () => void;
  chain?: WalletChain;
}

export function CryptoReceiveSheet({ visible, onClose, chain = 'SOL' }: CryptoReceiveSheetProps) {
  const chainConfig = getChainConfig(chain);
  const { data: wallet, isLoading, isError, error, refetch } = useDepositAddress(chain);
  const [copied, setCopied] = useState(false);
  const { notification, selection } = useHaptics();

  useEffect(() => {
    if (!visible) setCopied(false);
  }, [visible]);

  const address = wallet?.address ?? '';

  const usdcMint =
    process.env.EXPO_PUBLIC_SOLANA_USDC_MINT ?? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
  const qrValue =
    (chain === 'SOL' || chain === 'SOL-DEVNET') && address
      ? `solana:${address}?spl-token=${usdcMint}&label=Rail`
      : address;

  const handleCopy = useCallback(async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    notification();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [address, notification]);

  const ChainIcon = CHAIN_ICONS[chain];

  const header = (
    <View className="mb-5 flex-row items-center gap-3">
      {/* Chain icon + USDC badge */}
      <View className="relative size-12">
        <View
          className="size-12 items-center justify-center rounded-full"
          style={{ backgroundColor: chainConfig.color + '18' }}>
          {ChainIcon && <ChainIcon width={28} height={28} />}
        </View>
        <View className="absolute -bottom-1 -right-1 size-5 items-center justify-center rounded-full bg-white shadow-sm">
          <UsdcIcon width={14} height={14} />
        </View>
      </View>
      <View>
        <Text className="font-subtitle text-[20px] text-text-primary">Receive USDC</Text>
        <Text className="font-body text-[13px] text-text-secondary">on {chainConfig.label}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <BottomSheet visible={visible} onClose={onClose}>
        {header}
        <View className="items-center justify-center py-16">
          <ActivityIndicator size="small" color="#000" />
          <Text className="mt-3 font-body text-sm text-text-secondary">Loading wallet…</Text>
        </View>
      </BottomSheet>
    );
  }

  if (isError || (!isLoading && !address)) {
    const errCode = (error as any)?.data?.code;
    const errMsg =
      errCode === 'kyc_required'
        ? 'Complete identity verification before receiving crypto.'
        : errCode === 'has_not_accepted_tos'
          ? 'Accept the Terms of Service to receive crypto.'
          : 'Please check your connection and try again.';
    return (
      <BottomSheet visible={visible} onClose={onClose}>
        {header}
        <View className="items-center justify-center py-12">
          <Text className="mb-2 font-subtitle text-base text-text-primary">
            Unable to load wallet
          </Text>
          <Text className="mb-5 text-center font-body text-sm text-text-secondary">{errMsg}</Text>
          {!errCode && (
            <Pressable
              onPress={() => {
                selection();
                refetch();
              }}
              className="flex-row items-center gap-2 rounded-full bg-gray-100 px-5 py-2.5"
              hitSlop={8}>
              <HugeiconsIcon icon={RefreshIcon} size={16} color="#374151" />
              <Text className="font-subtitle text-sm text-gray-700">Retry</Text>
            </Pressable>
          )}
        </View>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {header}

      <View className="items-center">
        {/* QR Code */}
        <View
          className="mb-5 rounded-2xl p-4"
          style={{
            backgroundColor: chainConfig.color + '08',
            borderWidth: 1,
            borderColor: chainConfig.color + '20',
          }}>
          <QRCodeStyled
            data={qrValue}
            style={{ backgroundColor: 'white' }}
            padding={12}
            size={240}
            pieceBorderRadius={4}
            isPiecesGlued
            color={chainConfig.color}
            errorCorrectionLevel="H"
          />
        </View>

        {/* Address */}
        <Text
          className="mb-3 px-4 text-center font-mono text-[13px] leading-5 text-text-primary"
          selectable
          numberOfLines={2}>
          {address}
        </Text>

        {/* Warning */}
        <Text className="mb-5 text-center font-caption text-xs text-text-secondary">
          ⓘ {chainConfig.warning}
          {'\n'}NFTs and other tokens are not supported.
        </Text>

        <Button
          title={copied ? 'Copied!' : 'Copy address'}
          onPress={handleCopy}
          leftIcon={
            copied ? (
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} color="#16a34a" />
            ) : (
              <HugeiconsIcon icon={Copy01Icon} size={18} color="#000" />
            )
          }
          variant="white"
          size="large"
          className="w-full"
        />
      </View>
    </BottomSheet>
  );
}
