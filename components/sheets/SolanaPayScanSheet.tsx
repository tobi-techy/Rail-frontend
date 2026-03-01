import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, ScanLine, AlertCircle } from 'lucide-react-native';
import { BottomSheet } from './BottomSheet';
import { Button } from '../ui';
import { PhantomIcon, SolflareIcon } from '@/assets/svg';
import { useWalletAddresses } from '@/api/hooks/useWallet';
import { useHaptics } from '@/hooks/useHaptics';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { SOLANA_TESTNET_CHAIN } from '@/utils/chains';
import { parseSolanaPayUrl, type SolanaPayRequest } from '@/utils/solanaPayUrl';
import {
  DEFAULT_DEVNET_USDC_MINT,
  type SupportedFundingWallet,
} from '@/services/solanaFunding';

interface SolanaPayScanSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirmed: () => void;
}

type Step = 'scan' | 'pick-wallet' | 'sending';

const WALLET_INSTALL_URLS: Record<SupportedFundingWallet, string> = {
  phantom: 'https://play.google.com/store/apps/details?id=app.phantom',
  solflare: 'https://play.google.com/store/apps/details?id=com.solflare.mobile',
};

export function SolanaPayScanSheet({ visible, onClose, onConfirmed }: SolanaPayScanSheetProps) {
  const [step, setStep] = useState<Step>('scan');
  const [request, setRequest] = useState<SolanaPayRequest | null>(null);
  const [error, setError] = useState('');
  const [walletMissing, setWalletMissing] = useState<SupportedFundingWallet | null>(null);
  const scannedRef = useRef(false);

  const [permission, requestPermission] = useCameraPermissions();
  const { data: wallet } = useWalletAddresses(SOLANA_TESTNET_CHAIN);
  const { impact, notification } = useHaptics();
  const { showError } = useFeedbackPopup();

  const reset = useCallback(() => {
    setStep('scan');
    setRequest(null);
    setError('');
    setWalletMissing(null);
    scannedRef.current = false;
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleBarcode = useCallback(
    ({ data }: { data: string }) => {
      if (scannedRef.current || step !== 'scan') return;
      const parsed = parseSolanaPayUrl(data);
      if (!parsed) return;
      scannedRef.current = true;
      impact();
      setRequest(parsed);
      setStep('pick-wallet');
    },
    [step, impact]
  );

  const handleSend = useCallback(
    async (selectedWallet: SupportedFundingWallet) => {
      if (!request) return;
      const recipientOwnerAddress = wallet?.address?.trim();
      if (!recipientOwnerAddress) {
        showError('Unable to load your wallet address. Please try again.');
        return;
      }
      if (!request.amount || request.amount <= 0) {
        showError('This Solana Pay request does not include an amount.');
        return;
      }

      setStep('sending');
      setError('');
      setWalletMissing(null);

      try {
        const { startMobileWalletFunding } = await import('@/services/solanaFunding');
        await startMobileWalletFunding({
          wallet: selectedWallet,
          amountUsd: request.amount,
          recipientOwnerAddress: request.recipient,
        });
        notification();
        onConfirmed();
        handleClose();
      } catch (err: unknown) {
        const e = err as { category?: string; message?: string };
        if (e?.category === 'wallet_missing') {
          setWalletMissing(selectedWallet);
          setError(`${selectedWallet === 'phantom' ? 'Phantom' : 'Solflare'} is not installed.`);
        } else {
          setError(e?.message ?? 'Transaction failed. Please try again.');
        }
        setStep('pick-wallet');
      }
    },
    [request, wallet, showError, notification, onConfirmed, handleClose]
  );

  const permissionDenied =
    permission?.status === 'denied' ||
    (permission && !permission.granted && !permission.canAskAgain);

  const usdcMint = process.env.EXPO_PUBLIC_SOLANA_USDC_MINT ?? DEFAULT_DEVNET_USDC_MINT;
  const isUsdc = !request?.splToken || request.splToken === usdcMint;
  const tokenLabel = isUsdc ? 'USDC' : 'tokens';
  const shortRecipient = request
    ? `${request.recipient.slice(0, 6)}...${request.recipient.slice(-4)}`
    : '';

  // ── Scanner (full-screen modal) ──────────────────────────────────────────────
  if (step === 'scan') {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : 'overFullScreen'}
        onRequestClose={handleClose}>
        <View style={StyleSheet.absoluteFill} className="bg-black">
          {permission?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleBarcode}
            />
          ) : (
            <View className="flex-1 items-center justify-center px-8">
              <ScanLine size={48} color="#fff" />
              <Text className="mt-4 text-center font-subtitle text-xl text-white">
                {permissionDenied ? 'Camera access denied' : 'Camera permission needed'}
              </Text>
              <Text className="mt-2 text-center font-body text-sm text-gray-300">
                {permissionDenied
                  ? 'Enable camera access in Settings to scan Solana Pay QR codes.'
                  : 'Allow camera access to scan Solana Pay QR codes.'}
              </Text>
              <View className="mt-6 w-full">
                {permissionDenied ? (
                  <Pressable
                    onPress={() => Linking.openSettings()}
                    className="rounded-xl bg-white py-3">
                    <Text className="text-center font-subtitle text-base text-black">
                      Open Settings
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => void requestPermission()}
                    className="rounded-xl bg-white py-3">
                    <Text className="text-center font-subtitle text-base text-black">
                      Allow camera
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          <View className="absolute left-0 right-0 top-14 flex-row items-center justify-between px-6">
            <Pressable
              onPress={handleClose}
              className="size-11 items-center justify-center rounded-full bg-black/50"
              accessibilityRole="button"
              accessibilityLabel="Close scanner">
              <X size={20} color="#fff" />
            </Pressable>
          </View>

          {permission?.granted && (
            <View className="flex-1 items-center justify-center">
              <View className="size-64 rounded-2xl border-2 border-white/60" />
              <Text className="mt-4 font-body text-sm text-white/80">
                Point at a Solana Pay QR code
              </Text>
            </View>
          )}
        </View>
      </Modal>
    );
  }

  // ── Pick wallet / Confirm / Sending (bottom sheet) ───────────────────────────
  const isSending = step === 'sending';

  return (
    <BottomSheet visible={visible} onClose={handleClose} dismissible={!isSending}>
      <View className="mb-6">
        <Text className="font-subtitle text-xl text-text-primary">Confirm Payment</Text>
        {request?.message ? (
          <Text className="mt-1 font-body text-sm text-text-secondary">{request.message}</Text>
        ) : null}
      </View>

      {/* Amount */}
      <View className="mb-4 items-center rounded-2xl bg-gray-50 py-6">
        {request?.amount ? (
          <>
            <Text className="font-headline text-[40px] leading-none text-text-primary">
              {request.amount.toFixed(2)}
            </Text>
            <Text className="mt-1 font-body text-sm text-text-secondary">{tokenLabel}</Text>
          </>
        ) : (
          <View className="flex-row items-center gap-2">
            <AlertCircle size={18} color="#F59E0B" />
            <Text className="font-body text-sm text-amber-600">No amount specified</Text>
          </View>
        )}
      </View>

      {/* Recipient */}
      <View className="mb-6 flex-row items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
        <Text className="font-body text-sm text-text-secondary">To</Text>
        <Text className="font-mono text-sm text-text-primary">
          {request?.label ? `${request.label} · ` : ''}
          {shortRecipient}
        </Text>
      </View>

      {!!error && (
        <View className="mb-4 flex-row items-start gap-2 rounded-xl bg-red-50 px-4 py-3">
          <AlertCircle size={16} color="#EF4444" style={{ marginTop: 1 }} />
          <View className="flex-1">
            <Text className="font-body text-sm text-red-600">{error}</Text>
            {walletMissing && (
              <Pressable onPress={() => void Linking.openURL(WALLET_INSTALL_URLS[walletMissing])}>
                <Text className="mt-1 font-subtitle text-sm text-red-700 underline">
                  Install {walletMissing === 'phantom' ? 'Phantom' : 'Solflare'} →
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Wallet picker */}
      {isSending ? (
        <View className="items-center py-6">
          <ActivityIndicator color="#000" />
          <Text className="mt-3 font-body text-sm text-text-secondary">
            Waiting for wallet…
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          <Text className="mb-1 font-body text-sm text-text-secondary">Pay with</Text>
          <Pressable
            onPress={() => void handleSend('phantom')}
            disabled={!request?.amount}
            className="flex-row items-center gap-3 rounded-2xl border border-gray-200 px-4 py-4 active:opacity-70">
            <PhantomIcon width={32} height={32} />
            <Text className="font-subtitle text-base text-text-primary">Phantom</Text>
          </Pressable>
          <Pressable
            onPress={() => void handleSend('solflare')}
            disabled={!request?.amount}
            className="flex-row items-center gap-3 rounded-2xl border border-gray-200 px-4 py-4 active:opacity-70">
            <SolflareIcon width={32} height={32} />
            <Text className="font-subtitle text-base text-text-primary">Solflare</Text>
          </Pressable>
          <Button
            title="Scan again"
            onPress={() => { scannedRef.current = false; setStep('scan'); setError(''); setWalletMissing(null); }}
            variant="white"
            size="large"
            className="mt-1 w-full"
          />
        </View>
      )}
    </BottomSheet>
  );
}
