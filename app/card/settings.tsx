import React, { useCallback, useMemo } from 'react';
import {
  StatusBar,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Snowflake,
  Sun,
  CreditCard,
  Shield,
  HelpCircle,
  ChevronRight,
} from 'lucide-react-native';
import { useCards, useFreezeCard, useUnfreezeCard } from '@/api/hooks/useCard';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';

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

export default function CardSettingsScreen() {
  const { data: cardsData, isLoading } = useCards();
  const freezeCard = useFreezeCard();
  const unfreezeCard = useUnfreezeCard();
  const { showSuccess, showError } = useFeedbackPopup();

  const activeCard = useMemo(
    () =>
      cardsData?.cards?.find((c) => c.status === 'active' || c.status === 'frozen') ??
      cardsData?.cards?.[0],
    [cardsData]
  );

  const isFrozen = activeCard?.status === 'frozen';

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

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View className="flex-row items-center border-b border-gray-100 px-5 pb-4 pt-2">
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} className="mr-4 p-1">
          <ArrowLeft size={24} color="#111" />
        </TouchableOpacity>
        <Text className="font-subtitle text-lg text-gray-900">Card Settings</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-4">
        {/* Card Info */}
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
          </View>
        )}

        {/* Settings Options */}
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
            onPress={() => {}}
          />

          <SettingsRow
            icon={<Shield size={20} color="#6B7280" />}
            title="Security"
            subtitle="PIN, limits, and notifications"
            onPress={() => {}}
          />

          <SettingsRow
            icon={<HelpCircle size={20} color="#6B7280" />}
            title="Help & Support"
            subtitle="Report issues or get help"
            onPress={() => {}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
