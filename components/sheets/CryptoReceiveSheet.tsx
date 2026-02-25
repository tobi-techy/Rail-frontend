import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import QRCodeStyled from 'react-native-qrcode-styled';
import { Copy, Check, RefreshCw } from 'lucide-react-native';
import { BottomSheet } from './BottomSheet';
import { Button } from '../ui';
import { useWalletAddresses } from '@/api/hooks/useWallet';
import { SOLANA_TESTNET_CHAIN } from '@/utils/chains';
import { useHaptics } from '@/hooks/useHaptics';

interface CryptoReceiveSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function CryptoReceiveSheet({ visible, onClose }: CryptoReceiveSheetProps) {
  const { data: wallet, isLoading, isError, refetch } = useWalletAddresses(SOLANA_TESTNET_CHAIN);
  const [copied, setCopied] = useState(false);
  const { notification } = useHaptics();

  // Reset copied state when sheet closes
  useEffect(() => {
    if (!visible) setCopied(false);
  }, [visible]);

  const address = wallet?.address ?? '';
  const isLive = wallet?.status === 'live';
  const isCreating = wallet?.status === 'creating';

  const handleCopy = useCallback(async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    notification();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [address, notification]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Loading state
  if (isLoading) {
    return (
      <BottomSheet visible={visible} onClose={handleClose}>
        <View className="mb-6">
          <Text className="font-subtitle text-xl text-text-primary">Receive USDC</Text>
        </View>
        <View className="items-center justify-center py-20">
          <ActivityIndicator size="small" color="#000" />
          <Text className="mt-3 font-body text-sm text-text-secondary">Loading wallet…</Text>
        </View>
      </BottomSheet>
    );
  }

  // Error state
  if (isError || (!isLoading && !address)) {
    return (
      <BottomSheet visible={visible} onClose={handleClose}>
        <View className="mb-6">
          <Text className="font-subtitle text-xl text-text-primary">Receive Crypto</Text>
        </View>
        <View className="items-center justify-center py-16">
          <Text className="mb-2 font-subtitle text-base text-text-primary">
            Unable to load wallet
          </Text>
          <Text className="mb-5 text-center font-body text-sm text-text-secondary">
            Please check your connection and try again.
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="flex-row items-center gap-2 rounded-full bg-gray-100 px-5 py-2.5"
            hitSlop={8}>
            <RefreshCw size={16} color="#374151" />
            <Text className="font-subtitle text-sm text-gray-700">Retry</Text>
          </Pressable>
        </View>
      </BottomSheet>
    );
  }

  // Wallet still provisioning
  if (isCreating) {
    return (
      <BottomSheet visible={visible} onClose={handleClose}>
        <View className="mb-6">
          <Text className="font-subtitle text-xl text-text-primary">Receive Crypto</Text>
        </View>
        <View className="items-center justify-center py-16">
          <ActivityIndicator size="small" color="#000" />
          <Text className="mt-3 font-subtitle text-base text-text-primary">
            Setting up your wallet
          </Text>
          <Text className="mt-1 text-center font-body text-sm text-text-secondary">
            This usually takes a few seconds.
          </Text>
        </View>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      {/* Header */}
      <View className="mb-6">
        <Text className="font-subtitle text-xl text-text-primary">Receive USDC</Text>
        <Text className="mt-1 font-body text-sm text-text-secondary">
          Scan QR code or copy wallet address
        </Text>
      </View>

      <View className="items-center">
        {/* QR Code */}
        <View className="mb-5 rounded-2xl bg-white p-5">
          <QRCodeStyled
            data={address}
            style={{ backgroundColor: 'white' }}
            padding={16}
            size={280}
            pieceBorderRadius={4}
            isPiecesGlued
            color="#000"
            errorCorrectionLevel="H"
          />
        </View>

        {/* Address */}
        <Text
          className="mb-3 px-4 text-center font-mono text-[15px] leading-5 text-text-primary"
          selectable>
          {address}
        </Text>

        {/* Warning */}
        <Text className="mb-5 text-center font-caption text-xs text-text-secondary">
          ⓘ Only send USDC on Solana to this address.{'\n'}NFTs are not supported.
        </Text>

        {/* Copy Button */}
        <Button
          title={copied ? 'Copied!' : 'Copy address'}
          onPress={handleCopy}
          leftIcon={copied ? <Check size={18} color="#16a34a" /> : <Copy size={18} color="#000" />}
          variant="white"
          size="large"
          className="w-full"
        />
      </View>
    </BottomSheet>
  );
}
