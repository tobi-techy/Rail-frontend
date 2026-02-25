/**
 * Camera Overlay Component
 * Captures ID document photos via camera or gallery with auto-compression fallback.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, type CameraType, useCameraPermissions } from 'expo-camera';
import { Camera, RefreshCw, X, Zap, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, { SlideInUp } from 'react-native-reanimated';

type CaptureSide = 'front' | 'back';
export type KycDocumentType = 'drivers_license' | 'id_card' | 'residence_permit' | 'passport';

interface CapturedDocument {
  dataUri: string;
  capturedAt: number;
}

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const QUALITY_STEPS = [0.7, 0.4, 0.2];

function estimateBase64Bytes(b64: string): number {
  return Math.floor((b64.length * 3) / 4);
}

interface CameraOverlayProps {
  visible: boolean;
  side: CaptureSide;
  onClose: () => void;
  onComplete: (document: CapturedDocument) => void;
}

export function CameraOverlay({ visible, side, onClose, onComplete }: CameraOverlayProps) {
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState('');

  useEffect(() => {
    if (visible && !cameraPermission?.granted && cameraPermission?.canAskAgain) {
      void requestCameraPermission();
    }
  }, [visible, cameraPermission?.granted, cameraPermission?.canAskAgain, requestCameraPermission]);

  const resetState = useCallback(() => {
    setCapturedUri(null);
    setCapturedBase64(null);
    setCaptureError('');
    setIsCapturing(false);
  }, []);

  // #6: Try progressively lower quality for gallery picks
  const onPickImage = useCallback(async () => {
    try {
      for (const quality of QUALITY_STEPS) {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality,
          base64: true,
        });

        if (result.canceled || !result.assets?.length) return;

        const photo = result.assets[0];
        if (!photo.base64) {
          setCaptureError('Could not read image data.');
          return;
        }

        if (estimateBase64Bytes(photo.base64) <= MAX_DOCUMENT_BYTES) {
          setCapturedUri(photo.uri);
          setCapturedBase64(photo.base64);
          return;
        }

        // Only retry if this wasn't the lowest quality
        if (quality === QUALITY_STEPS[QUALITY_STEPS.length - 1]) {
          setCaptureError(
            'Image is too large even after compression. Please pick a smaller image.'
          );
          return;
        }
        // Otherwise loop continues with lower quality — but gallery picker re-opens.
        // Since we can't re-compress without expo-image-manipulator, just fail gracefully.
        setCaptureError('Image exceeds 10MB. Please pick a smaller or lower-resolution image.');
        return;
      }
    } catch (e) {
      console.error('[CameraOverlay] Gallery error:', e);
      setCaptureError('Could not access gallery. Please try again.');
    }
  }, []);

  // #6: Auto-retry capture at lower quality if too large
  const onTakePhoto = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;

    setCaptureError('');
    setIsCapturing(true);

    try {
      for (const quality of QUALITY_STEPS) {
        const photo = await cameraRef.current.takePictureAsync({
          quality,
          base64: true,
          skipProcessing: quality === QUALITY_STEPS[0], // only skip on first attempt
        });

        if (!photo?.base64 || !photo?.uri) {
          setCaptureError('Could not capture image. Please try again.');
          return;
        }

        if (estimateBase64Bytes(photo.base64) <= MAX_DOCUMENT_BYTES) {
          setCapturedUri(photo.uri);
          setCapturedBase64(photo.base64);
          return;
        }
      }

      setCaptureError(
        'Image is still too large after compression. Try moving further from the document.'
      );
    } catch (error) {
      console.error('[CameraOverlay] Capture error:', error);
      setCaptureError('Could not access camera. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  const onUsePhoto = useCallback(() => {
    if (!capturedBase64) return;
    onComplete({
      dataUri: `data:image/jpeg;base64,${capturedBase64}`,
      capturedAt: Date.now(),
    });
    resetState();
  }, [capturedBase64, onComplete, resetState]);

  const permissionDenied =
    cameraPermission?.status === 'denied' ||
    (cameraPermission && !cameraPermission.granted && !cameraPermission.canAskAgain);
  const title = side === 'front' ? 'Front of ID' : 'Back of ID';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : 'overFullScreen'}
      onRequestClose={onClose}
      onDismiss={onClose}>
      <View className="flex-1 bg-black">
        {!capturedUri ? (
          <>
            {cameraPermission?.granted ? (
              <CameraView
                ref={(ref) => {
                  cameraRef.current = ref;
                }}
                style={StyleSheet.absoluteFillObject}
                facing={cameraFacing}
                flash={flashEnabled ? 'on' : 'off'}
              />
            ) : (
              <View className="flex-1 items-center justify-center px-6">
                <Camera size={42} color="#FFFFFF" />
                <Text className="mt-4 text-center font-subtitle text-[22px] text-white">
                  {permissionDenied ? 'Camera access denied' : 'Camera permission needed'}
                </Text>
                <Text className="mt-2 text-center font-body text-[14px] leading-6 text-gray-300">
                  {permissionDenied
                    ? 'Camera permission was denied. Please enable it in Settings to continue.'
                    : 'Allow camera access so you can capture your document securely in-app.'}
                </Text>
                <View className="mt-6 w-full gap-y-3">
                  {/* #9: iOS Settings link when permission permanently denied */}
                  {permissionDenied ? (
                    <Pressable
                      onPress={() => Linking.openSettings()}
                      className="rounded-xl bg-white py-3"
                      android_ripple={{ color: '#00000020' }}>
                      <Text className="text-center font-subtitle text-[16px] text-black">
                        Open Settings
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => void requestCameraPermission()}
                      className="rounded-xl bg-white py-3"
                      android_ripple={{ color: '#00000020' }}>
                      <Text className="text-center font-subtitle text-[16px] text-black">
                        Allow camera
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}

            <View className="absolute left-0 right-0 top-14 flex-row items-center justify-between px-6">
              <Pressable
                onPress={onClose}
                className="size-11 items-center justify-center rounded-full bg-black/50"
                accessibilityRole="button"
                accessibilityLabel="Close camera">
                <X size={20} color="#FFFFFF" />
              </Pressable>
              <Pressable
                onPress={() => setFlashEnabled((v) => !v)}
                className="size-11 items-center justify-center rounded-full bg-black/50"
                accessibilityRole="button"
                accessibilityLabel="Toggle flash">
                <Zap size={20} color={flashEnabled ? '#F59E0B' : '#FFFFFF'} />
              </Pressable>
            </View>

            {cameraPermission?.granted && (
              <Animated.View
                entering={SlideInUp.delay(300).duration(400)}
                className="absolute bottom-0 left-0 right-0 rounded-t-[32px] bg-white px-6 pb-12 pt-4">
                <View className="mb-6 flex-row justify-center">
                  <View className="h-1 w-10 rounded-full bg-slate-200" />
                </View>
                <Text className="text-center font-subtitle text-[24px] text-gray-900">{title}</Text>
                <Text className="mt-3 text-center font-body text-[15px] leading-6 text-gray-500">
                  Take a photo of the {side === 'front' ? 'front' : 'back'} side of your ID.
                  {'\n\n'}
                  All the information should be readable, without any reflections or blur.
                </Text>

                {!!captureError && (
                  <Text className="mt-3 text-center font-body text-[13px] text-red-600">
                    {captureError}
                  </Text>
                )}

                <View className="mt-6 flex-row items-center justify-center">
                  <Pressable
                    onPress={onTakePhoto}
                    disabled={isCapturing || !cameraPermission?.granted}
                    className="size-20 items-center justify-center rounded-full border-[3px] border-gray-900 bg-white"
                    accessibilityRole="button"
                    accessibilityLabel="Capture document image">
                    {isCapturing ? (
                      <ActivityIndicator color="#111827" />
                    ) : (
                      <View className="size-[68px] rounded-full bg-gray-200" />
                    )}
                  </Pressable>
                </View>

                <View className="mt-6 flex-row items-center justify-between px-8">
                  <Pressable
                    onPress={() => setCameraFacing((c) => (c === 'back' ? 'front' : 'back'))}
                    accessibilityRole="button"
                    accessibilityLabel="Switch camera">
                    <Text className="font-body text-[14px] text-gray-600">Switch camera</Text>
                  </Pressable>
                  <Pressable
                    onPress={onPickImage}
                    accessibilityRole="button"
                    accessibilityLabel="Upload from gallery"
                    className="p-2">
                    <ImageIcon size={24} color="#4B5563" />
                  </Pressable>
                </View>
              </Animated.View>
            )}
          </>
        ) : (
          <View className="flex-1 bg-white pb-8 pt-14">
            <View className="mb-6 flex-row items-center justify-between px-6">
              <Pressable
                onPress={() => {
                  setCapturedUri(null);
                  setCapturedBase64(null);
                }}
                className="p-1"
                accessibilityRole="button"
                accessibilityLabel="Retake photo">
                <RefreshCw size={24} color="#000" />
              </Pressable>
              <Pressable
                onPress={onClose}
                className="p-1"
                accessibilityRole="button"
                accessibilityLabel="Close camera">
                <X size={24} color="#000" />
              </Pressable>
            </View>

            <View className="flex-1 items-center justify-center px-6">
              <View className="h-full w-full overflow-hidden rounded-2xl bg-black">
                <Image
                  source={{ uri: capturedUri }}
                  className="h-full w-full"
                  resizeMode="contain"
                />
              </View>
            </View>

            <Animated.View entering={SlideInUp.duration(400)} className="mt-8 px-6 pb-2">
              <Text className="text-center font-subtitle text-[22px] text-gray-900">ID card</Text>
              <Text className="mt-2 text-center font-body text-[15px] leading-6 text-gray-500">
                Make sure that all the information on the document is visible and easy to read
              </Text>
              <View className="mt-8 gap-y-3">
                <Pressable
                  onPress={onUsePhoto}
                  className="rounded-2xl bg-primary py-4"
                  android_ripple={{ color: '#ffffff20' }}>
                  <Text className="text-center font-subtitle text-[17px] text-white">
                    Document is readable
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setCapturedUri(null);
                    setCapturedBase64(null);
                  }}
                  className="rounded-2xl bg-slate-100 py-4"
                  android_ripple={{ color: '#00000020' }}>
                  <Text className="text-center font-subtitle text-[17px] text-gray-900">
                    Retake photo
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        )}
      </View>
    </Modal>
  );
}
