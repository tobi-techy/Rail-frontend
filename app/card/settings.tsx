import React, { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  StatusBar,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import {
  ArrowLeft,
  Snowflake,
  Sun,
  CreditCard,
  Shield,
  HelpCircle,
  ChevronRight,
  X,
  Wallet,
} from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import * as Crypto from 'expo-crypto';
import {
  useCards,
  useFreezeCard,
  useUnfreezeCard,
  useCardEphemeralKey,
  useCardPINUrl,
} from '@/api/hooks/useCard';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { RailCard } from '@/components/cards';
import { useAuthStore } from '@/stores/authStore';

const PCI_HOST = 'https://cards-pci.bridge.xyz';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SettingButton({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      style={animStyle}
      className="mb-5 w-[25%] items-center"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.88, { damping: 20, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      }}>
      <View
        className={`h-12 w-12 items-center justify-center rounded-full ${danger ? 'bg-red-50' : 'bg-gray-100'}`}>
        {icon}
      </View>
      <Text
        className={`mt-2 text-center font-body text-[12px] ${danger ? 'text-red-500' : 'text-gray-500'}`}
        numberOfLines={2}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const Section = ({
  title,
  children,
  index = 0,
}: {
  title: string;
  children: ReactNode;
  index?: number;
}) => (
  <Animated.View entering={FadeInDown.delay(index * 80).springify()} className="mb-2">
    <Text className="mb-3 px-1 font-subtitle text-[13px] uppercase tracking-widest text-gray-400">
      {title}
    </Text>
    <View className="flex-row flex-wrap">{children}</View>
  </Animated.View>
);

function WebViewModal({
  url,
  title,
  visible,
  onClose,
}: {
  url: string;
  title: string;
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: insets.top > 0 ? 0 : 12,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#F3F4F6',
          }}>
          <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: '#111827' }}>
            {title}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <X size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <WebView source={{ uri: url }} style={{ flex: 1 }} />
      </SafeAreaView>
    </Modal>
  );
}

export default function CardSettingsScreen() {
  const { data: cardsData, isLoading } = useCards();
  const freezeCard = useFreezeCard();
  const unfreezeCard = useUnfreezeCard();
  const { showSuccess, showError, showInfo } = useFeedbackPopup();
  const user = useAuthStore((s) => s.user);

  const [webViewUrl, setWebViewUrl] = useState<string | null>(null);
  const [webViewTitle, setWebViewTitle] = useState('');

  const activeCard = useMemo(
    () =>
      cardsData?.cards?.find((c) => c.status === 'active' || c.status === 'frozen') ??
      cardsData?.cards?.[0],
    [cardsData]
  );

  const isFrozen = activeCard?.status === 'frozen';

  const holderName = useMemo(() => {
    const full = [user?.firstName, user?.lastName].filter(Boolean).join(' ').toUpperCase();
    return full || 'CARDHOLDER';
  }, [user]);

  const ephemeralKey = useCardEphemeralKey(activeCard?.id);
  const pinUrl = useCardPINUrl(activeCard?.id);

  const handleToggleFreeze = useCallback(async () => {
    if (!activeCard) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isFrozen) {
      try {
        await unfreezeCard.mutateAsync(activeCard.id);
        showSuccess('Card Unfrozen', 'Your card is now active');
      } catch {
        showError('Error', 'Failed to unfreeze card');
      }
    } else {
      Alert.alert('Freeze Card', 'Temporarily disable your card?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Freeze',
          style: 'destructive',
          onPress: async () => {
            try {
              await freezeCard.mutateAsync(activeCard.id);
              showSuccess('Card Frozen', 'Your card has been frozen');
            } catch {
              showError('Error', 'Failed to freeze card');
            }
          },
        },
      ]);
    }
  }, [activeCard, isFrozen, freezeCard, unfreezeCard, showSuccess, showError]);

  const handleCardDetails = useCallback(async () => {
    if (!activeCard) return;
    try {
      const nonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${activeCard.id}-${Date.now()}`
      );
      const result = await ephemeralKey.mutateAsync(nonce);
      const url = `${PCI_HOST}/card-details?ephemeral_key=${result.ephemeral_key}&nonce=${nonce}`;
      setWebViewTitle('Card Details');
      setWebViewUrl(url);
    } catch {
      showError('Error', 'Unable to load card details');
    }
  }, [activeCard, ephemeralKey, showError]);

  const handleSecurity = useCallback(async () => {
    if (!activeCard) return;
    try {
      const result = await pinUrl.mutateAsync();
      setWebViewTitle('Security');
      setWebViewUrl(result.url);
    } catch {
      showError('Error', 'Unable to load security settings');
    }
  }, [activeCard, pinUrl, showError]);

  const handleAddToWallet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS !== 'ios') {
      showInfo('Not Available', 'Apple Wallet is only available on iOS');
      return;
    }
    showInfo('Coming Soon', 'Apple Wallet integration will be available soon');
  }, [showInfo]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center px-5 pb-3 pt-1">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            hitSlop={12}
            className="mr-4 p-1">
            <ArrowLeft size={24} color="#111" />
          </TouchableOpacity>
          <Text className="font-subtitle text-lg text-gray-900">Card Settings</Text>
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Card preview */}
        {activeCard && (
          <Animated.View entering={FadeInDown.springify()} className="mb-6 items-center">
            <View
              style={{
                shadowColor: '#000',
                shadowOpacity: Platform.OS === 'ios' ? 0.15 : 0,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 10 },
                elevation: 8,
                opacity: isFrozen ? 0.6 : 1,
              }}>
              <RailCard
                brand="VISA"
                holderName={holderName}
                last4={activeCard.last_4 ?? '••••'}
                exp={activeCard.expiry ?? '••/••'}
                currency="USD"
                accentColor={isFrozen ? '#6B7280' : '#FF6A00'}
                patternIntensity={0.35}
              />
            </View>

            {/* Status pill */}
            <View
              className={`mt-3 rounded-full px-4 py-1.5 ${isFrozen ? 'bg-blue-100' : 'bg-green-100'}`}>
              <Text
                className={`font-subtitle text-[13px] ${isFrozen ? 'text-blue-700' : 'text-green-700'}`}>
                {isFrozen ? '❄️  Frozen' : '● Active'}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Add to Apple Wallet */}
        {Platform.OS === 'ios' && (
          <Animated.View entering={FadeInDown.delay(60).springify()} className="mb-6">
            <TouchableOpacity
              onPress={handleAddToWallet}
              activeOpacity={0.8}
              className="flex-row items-center justify-center gap-3 rounded-2xl bg-black py-4">
              <Wallet size={20} color="#fff" />
              <Text className="font-subtitle text-[15px] text-white">Add to Apple Wallet</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Card section */}
        <Section title="Card" index={1}>
          <SettingButton
            icon={
              isFrozen ? <Sun size={22} color="#F59E0B" /> : <Snowflake size={22} color="#3B82F6" />
            }
            label={isFrozen ? 'Unfreeze' : 'Freeze'}
            onPress={handleToggleFreeze}
          />
          <SettingButton
            icon={
              ephemeralKey.isPending ? (
                <ActivityIndicator size="small" color="#6B7280" />
              ) : (
                <CreditCard size={22} color="#111" />
              )
            }
            label="Details"
            onPress={handleCardDetails}
          />
          <SettingButton
            icon={
              pinUrl.isPending ? (
                <ActivityIndicator size="small" color="#6B7280" />
              ) : (
                <Shield size={22} color="#111" />
              )
            }
            label="Security"
            onPress={handleSecurity}
          />
          <SettingButton
            icon={<HelpCircle size={22} color="#111" />}
            label="Support"
            onPress={() => {}}
          />
        </Section>

        <View className="h-10" />
      </ScrollView>

      {webViewUrl && (
        <WebViewModal
          url={webViewUrl}
          title={webViewTitle}
          visible={!!webViewUrl}
          onClose={() => setWebViewUrl(null)}
        />
      )}
    </View>
  );
}
