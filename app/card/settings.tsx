import React, { useCallback, useMemo, useState } from 'react';
import {
  StatusBar,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Snowflake,
  Sun,
  CreditCard,
  Shield,
  HelpCircle,
  ChevronRight,
  X,
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

const PCI_HOST = 'https://cards-pci.bridge.xyz';

function SettingsRow({
  icon,
  title,
  subtitle,
  onPress,
  danger,
  loading,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
  loading?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
      className="flex-row items-center border-b border-gray-100 py-4">
      <View
        className={`mr-3 h-10 w-10 items-center justify-center rounded-full ${danger ? 'bg-red-50' : 'bg-gray-100'}`}>
        {icon}
      </View>
      <View className="flex-1">
        <Text className={`font-subtitle text-base ${danger ? 'text-red-600' : 'text-gray-900'}`}>
          {title}
        </Text>
        {subtitle && <Text className="mt-0.5 font-body text-sm text-gray-400">{subtitle}</Text>}
      </View>
      {loading ? (
        <ActivityIndicator size="small" color="#9CA3AF" />
      ) : (
        <ChevronRight size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );
}

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
  const { showSuccess, showError } = useFeedbackPopup();

  const [webViewUrl, setWebViewUrl] = useState<string | null>(null);
  const [webViewTitle, setWebViewTitle] = useState('');

  const activeCard = useMemo(
    () =>
      cardsData?.cards?.find((c) => c.status === 'active' || c.status === 'frozen') ??
      cardsData?.cards?.[0],
    [cardsData]
  );

  const isFrozen = activeCard?.status === 'frozen';

  const ephemeralKey = useCardEphemeralKey(activeCard?.id);
  const pinUrl = useCardPINUrl(activeCard?.id);

  const handleToggleFreeze = useCallback(async () => {
    if (!activeCard) return;
    if (isFrozen) {
      try {
        await unfreezeCard.mutateAsync(activeCard.id);
        showSuccess('Card Unfrozen', 'Your card is now active');
      } catch {
        showError('Error', 'Failed to unfreeze card');
      }
    } else {
      Alert.alert('Freeze Card', 'Are you sure you want to freeze your card?', [
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

      <View className="flex-row items-center border-b border-gray-100 px-5 pb-4 pt-2">
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} className="mr-4 p-1">
          <ArrowLeft size={24} color="#111" />
        </TouchableOpacity>
        <Text className="font-subtitle text-lg text-gray-900">Card Settings</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-4">
        {activeCard && (
          <View className="mb-6 rounded-2xl bg-gray-50 p-4">
            <View className="flex-row items-center">
              <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-black">
                <Text className="text-[8px] font-bold tracking-wider text-white">VISA</Text>
              </View>
              <View className="flex-1">
                <Text className="font-subtitle text-base text-gray-900">
                  •••• {activeCard.last_4}
                </Text>
                <Text className="font-body text-sm text-gray-400">Expires {activeCard.expiry}</Text>
              </View>
              <View
                className={`rounded-full px-3 py-1 ${isFrozen ? 'bg-blue-100' : 'bg-green-100'}`}>
                <Text
                  className={`font-body text-xs ${isFrozen ? 'text-blue-700' : 'text-green-700'}`}>
                  {isFrozen ? 'Frozen' : 'Active'}
                </Text>
              </View>
            </View>
            {activeCard.balances && (
              <View className="mt-3 flex-row gap-4 border-t border-gray-200 pt-3">
                <View className="flex-1">
                  <Text className="font-body text-xs text-gray-400">Available</Text>
                  <Text className="font-subtitle text-sm text-gray-900">
                    {activeCard.balances.available.amount} {activeCard.balances.available.currency}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="font-body text-xs text-gray-400">On hold</Text>
                  <Text className="font-subtitle text-sm text-gray-900">
                    {activeCard.balances.hold.amount} {activeCard.balances.hold.currency}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        <View>
          <SettingsRow
            icon={
              isFrozen ? <Sun size={20} color="#F59E0B" /> : <Snowflake size={20} color="#3B82F6" />
            }
            title={isFrozen ? 'Unfreeze Card' : 'Freeze Card'}
            subtitle={isFrozen ? 'Reactivate your card' : 'Temporarily disable your card'}
            onPress={handleToggleFreeze}
            loading={freezeCard.isPending || unfreezeCard.isPending}
          />

          <SettingsRow
            icon={<CreditCard size={20} color="#6B7280" />}
            title="Card Details"
            subtitle="View card number and CVV"
            onPress={handleCardDetails}
            loading={ephemeralKey.isPending}
          />

          <SettingsRow
            icon={<Shield size={20} color="#6B7280" />}
            title="Security"
            subtitle="PIN, limits, and notifications"
            onPress={handleSecurity}
            loading={pinUrl.isPending}
          />

          <SettingsRow
            icon={<HelpCircle size={20} color="#6B7280" />}
            title="Help & Support"
            subtitle="Report issues or get help"
            onPress={() => {}}
          />
        </View>
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
