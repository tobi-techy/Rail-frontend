import React, { useCallback, useRef } from 'react';
import { View, Text, Pressable, Modal, Platform, StyleSheet, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Cancel01Icon, ScanIcon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';

interface Props {
  visible: boolean;
  onClose: () => void;
  onScanned: (data: string) => void;
}

export function QRScanSheet({ visible, onClose, onScanned }: Props) {
  const haptics = useHaptics();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);

  const handleBarcode = useCallback(
    ({ data }: { data: string }) => {
      if (scannedRef.current) return;
      scannedRef.current = true;
      onScanned(data);
      setTimeout(() => {
        scannedRef.current = false;
      }, 1500);
    },
    [onScanned]
  );

  const permissionDenied =
    permission?.status === 'denied' ||
    (permission && !permission.granted && !permission.canAskAgain);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : 'overFullScreen'}
      onRequestClose={onClose}>
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
            <HugeiconsIcon icon={ScanIcon} size={48} color="#fff" />
            <Text className="mt-4 text-center font-subtitle text-xl text-white">
              {permissionDenied ? 'Camera access denied' : 'Camera permission needed'}
            </Text>
            <Text className="mt-2 text-center font-body text-sm text-[#9C9C9C]">
              {permissionDenied
                ? 'Enable camera access in Settings to scan QR codes.'
                : 'Allow camera access to scan wallet QR codes.'}
            </Text>
            <Pressable
              onPress={() => {
                playUISound('buttonClick');
                haptics.selection();
                permissionDenied ? Linking.openSettings() : requestPermission();
              }}
              className="mt-6 rounded-xl bg-white/10 px-6 py-3">
              <Text className="text-center font-subtitle text-base text-white">
                {permissionDenied ? 'Open Settings' : 'Allow Camera'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Close button */}
        <Pressable
          onPress={() => {
            playUISound('buttonClick');
            haptics.selection();
            onClose();
          }}
          style={{ top: insets.top + 12 }}
          className="absolute right-5 size-11 items-center justify-center rounded-full bg-black/50"
          accessibilityRole="button"
          accessibilityLabel="Close scanner">
          <HugeiconsIcon icon={Cancel01Icon} size={20} color="#FFFFFF" />
        </Pressable>

        {/* Viewfinder overlay */}
        {permission?.granted && (
          <View className="absolute inset-0 items-center justify-center">
            <View className="size-64 rounded-3xl border-2 border-white/40" />
            <Text className="mt-6 font-body text-[14px] text-white/70">
              Point at a wallet QR code
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}
