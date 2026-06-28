import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { launchScanner } from '@dariyd/react-native-document-scanner';
import { logger } from '@/lib/logger';

export interface AttachedImage {
  uri: string;
  base64: string;
}

export function useImagePickers() {
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null);

  const pickFromGallery = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert(
        'Permission needed',
        perm.canAskAgain
          ? 'Allow photo access to scan receipts.'
          : 'Photo access was permanently denied. Go to Settings > Privacy > Photos to enable it.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      setAttachedImage({ uri: result.assets[0].uri, base64: result.assets[0].base64 });
    }
  }, []);

  const pickFromCamera = useCallback(async () => {
    try {
      const result = await launchScanner({ quality: 0.7, includeBase64: true });
      if (result.error || result.didCancel) return;
      const image = result.images?.[0];
      if (image?.base64) setAttachedImage({ uri: image.uri, base64: image.base64 });
    } catch (err) {
      logger.warn('Document scanner failed', { error: err });
    }
  }, []);

  const clearImage = useCallback(() => setAttachedImage(null), []);

  return { attachedImage, setAttachedImage, pickFromGallery, pickFromCamera, clearImage };
}
