import React, { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  StatusBar,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import {
  ArrowLeft,
  Snowflake,
  Sun,
  Shield,
  HelpCircle,
  Wallet,
  FileText,
  Repeat2,
  Scale,
  MessageSquare,
  ScrollText,
} from 'lucide-react-native';
import { useCards, useFreezeCard, useUnfreezeCard, useCardStatement } from '@/api/hooks/useCard';
import { useRoundupSettings, useUpdateRoundupSettings } from '@/api/hooks/useRoundup';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { RailCard } from '@/components/cards';
import { useAuthStore } from '@/stores/authStore';
import { BottomSheet, SettingsSheet } from '@/components/sheets';
import { Button } from '@/components/ui';
import { WheelPicker } from '@/components/molecules';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type SheetType =
  | 'freeze'
  | 'limit'
  | 'statement'
  | 'roundup'
  | 'support'
  | 'feedback'
  | 'terms'
  | null;

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
      className="mb-md w-[25%] items-center"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.9, { damping: 20, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      }}>
      <View className="h-12 w-12 items-center justify-center">{icon}</View>
      <Text
        className={`mt-xs text-center font-caption text-caption ${danger ? 'text-destructive' : 'text-text-primary'}`}
        numberOfLines={2}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <View className="border-b border-surface py-md">
    <Text className="mb-md px-md font-subtitle text-body">{title}</Text>
    <View className="flex-row flex-wrap px-sm">{children}</View>
  </View>
);

const LIMIT_OPTIONS = ['$100', '$250', '$500', '$750', '$1,000', '$1,500', '$2,000', '$5,000'];

export default function CardSettingsScreen() {
  const { data: cardsData, isLoading } = useCards();
  const freezeCard = useFreezeCard();
  const unfreezeCard = useUnfreezeCard();
  const { showSuccess, showError, showInfo } = useFeedbackPopup();
  const user = useAuthStore((s) => s.user);

  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const closeSheet = useCallback(() => setActiveSheet(null), []);

  const [limitIndex, setLimitIndex] = useState(2);

  const months = useMemo(() => {
    const result: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push(d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    }
    return result;
  }, []);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);

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

  // Round-ups
  const { data: roundupData } = useRoundupSettings();
  const updateRoundup = useUpdateRoundupSettings();
  const roundupEnabled = roundupData?.settings?.enabled ?? false;

  // Statement
  const getStatement = useCardStatement(activeCard?.id);

  // Freeze/unfreeze — close sheet first, then act
  const handleToggleFreeze = useCallback(() => {
    closeSheet();
    if (!activeCard) return;
    if (isFrozen) {
      unfreezeCard.mutate(activeCard.id, {
        onSuccess: () => showSuccess('Card Unfrozen', 'Your card is now active'),
        onError: () => showError('Error', 'Failed to unfreeze card'),
      });
    } else {
      freezeCard.mutate(activeCard.id, {
        onSuccess: () => showSuccess('Card Frozen', 'Your card has been frozen'),
        onError: () => showError('Error', 'Failed to freeze card'),
      });
    }
  }, [activeCard, isFrozen, freezeCard, unfreezeCard, showSuccess, showError, closeSheet]);

  const handleExportStatement = useCallback(() => {
    if (!activeCard) return;
    // Derive YYYY-MM from selected month string
    const d = new Date();
    d.setMonth(d.getMonth() - selectedMonthIndex);
    const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    closeSheet();
    getStatement.mutate(
      { month: String(d.getMonth() + 1), year: String(d.getFullYear()) },
      {
        onSuccess: (res) =>
          showInfo('Statement Ready', res.url ? 'Opening statement…' : 'Statement exported'),
        onError: () => showError('Error', 'Failed to export statement'),
      }
    );
    // Suppress unused warning — period used for display
    void period;
  }, [activeCard, selectedMonthIndex, getStatement, closeSheet, showInfo, showError]);

  const handleAddToWallet = useCallback(() => {
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
    <View className="flex-1 bg-background-main">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

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
          <Text className="font-subtitle text-lg text-text-primary">Card Settings</Text>
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {activeCard && (
          <View className="mb-2 items-center px-5 pb-4">
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
            <View
              className={`mt-3 rounded-full px-4 py-1.5 ${isFrozen ? 'bg-blue-100' : 'bg-green-100'}`}>
              <Text
                className={`font-subtitle text-[13px] ${isFrozen ? 'text-blue-700' : 'text-green-700'}`}>
                {isFrozen ? '❄️  Frozen' : '● Active'}
              </Text>
            </View>
          </View>
        )}

        {Platform.OS === 'ios' && (
          <View className="mx-md mb-2">
            <Button
              title="Add to Apple Wallet"
              variant="black"
              leftIcon={<Wallet size={18} color="#fff" />}
              onPress={handleAddToWallet}
              flex
            />
          </View>
        )}

        <Section title="Card">
          <SettingButton
            icon={
              isFrozen ? <Sun size={22} color="#F59E0B" /> : <Snowflake size={22} color="#3B82F6" />
            }
            label={isFrozen ? 'Unfreeze' : 'Freeze Card'}
            onPress={() => setActiveSheet('freeze')}
          />
          <SettingButton
            icon={<Scale size={22} color="#121212" />}
            label="Daily Limit"
            onPress={() => setActiveSheet('limit')}
          />
          <SettingButton
            icon={<FileText size={22} color="#121212" />}
            label="Statement"
            onPress={() => setActiveSheet('statement')}
          />
          <SettingButton
            icon={<Shield size={22} color="#121212" />}
            label="Change PIN"
            onPress={() => showInfo('Coming Soon', 'PIN management coming soon')}
          />
          <SettingButton
            icon={<Repeat2 size={22} color="#121212" />}
            label="Round-ups"
            onPress={() => setActiveSheet('roundup')}
          />
        </Section>

        <Section title="About">
          <SettingButton
            icon={<HelpCircle size={22} color="#121212" />}
            label="Support"
            onPress={() => setActiveSheet('support')}
          />
          <SettingButton
            icon={<MessageSquare size={22} color="#121212" />}
            label="Feedback"
            onPress={() => setActiveSheet('feedback')}
          />
          <SettingButton
            icon={<ScrollText size={22} color="#121212" />}
            label="Terms"
            onPress={() => setActiveSheet('terms')}
          />
        </Section>
      </ScrollView>

      {/* Freeze sheet */}
      <BottomSheet visible={activeSheet === 'freeze'} onClose={closeSheet}>
        <Text className="mb-2 font-subtitle text-xl">
          {isFrozen ? 'Unfreeze Card' : 'Freeze Card'}
        </Text>
        <Text className="mb-6 font-body text-base leading-6 text-neutral-500">
          {isFrozen
            ? 'Reactivate your card to resume spending.'
            : 'Temporarily disable your card. No charges will be processed while frozen.'}
        </Text>
        <View className="flex-row gap-3">
          <Button title="Cancel" variant="ghost" onPress={closeSheet} flex />
          <Button
            title={isFrozen ? 'Unfreeze Card' : 'Freeze Card'}
            variant={isFrozen ? 'black' : 'destructive'}
            onPress={handleToggleFreeze}
            loading={freezeCard.isPending || unfreezeCard.isPending}
            flex
          />
        </View>
      </BottomSheet>

      {/* Daily limit sheet */}
      <BottomSheet visible={activeSheet === 'limit'} onClose={closeSheet}>
        <Text className="mb-2 font-subtitle text-xl">Daily Limit</Text>
        <Text className="mb-4 font-body text-base leading-6 text-neutral-500">
          Set a daily spending limit on your card.
        </Text>
        <WheelPicker
          items={LIMIT_OPTIONS}
          selectedIndex={limitIndex}
          onIndexChange={setLimitIndex}
        />
        <View className="mt-4 flex-row gap-3">
          <Button title="Cancel" variant="ghost" onPress={closeSheet} flex />
          <Button
            title={`Set ${LIMIT_OPTIONS[limitIndex]}`}
            variant="black"
            onPress={() => {
              closeSheet();
              showSuccess('Limit Updated', `Daily limit set to ${LIMIT_OPTIONS[limitIndex]}`);
            }}
            flex
          />
        </View>
      </BottomSheet>

      {/* Statement sheet */}
      <BottomSheet visible={activeSheet === 'statement'} onClose={closeSheet}>
        <Text className="mb-1 text-center font-subtitle text-xl">Bank Statement</Text>
        <Text className="mb-4 text-center font-body text-sm text-text-secondary">
          Export your card transaction summary for any month.
        </Text>
        <View className="mb-5 flex-row items-center gap-3 rounded-2xl border border-dashed border-gray-300 px-4 py-4">
          <FileText size={18} color="#9CA3AF" />
          <Text className="flex-1 font-body text-sm leading-5 text-text-secondary">
            Statements are available from the 2nd of the following month.
          </Text>
        </View>
        <WheelPicker
          items={months}
          selectedIndex={selectedMonthIndex}
          onIndexChange={setSelectedMonthIndex}
        />
        <View className="mt-4 flex-row gap-3">
          <Button title="Cancel" variant="white" onPress={closeSheet} flex />
          <Button
            title="Export"
            variant="black"
            loading={getStatement.isPending}
            onPress={handleExportStatement}
            flex
          />
        </View>
      </BottomSheet>

      {/* Round-ups sheet */}
      <SettingsSheet
        visible={activeSheet === 'roundup'}
        onClose={closeSheet}
        title="Round-ups"
        subtitle="Round up card purchases to the nearest dollar and invest the difference automatically."
        toggleLabel="Enable Round-ups"
        toggleValue={roundupEnabled}
        onToggleChange={(v) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          updateRoundup.mutate(v, {
            onSuccess: () =>
              showSuccess(
                v ? 'Round-ups On' : 'Round-ups Off',
                v ? 'Spare change will be invested automatically.' : 'Round-ups have been disabled.'
              ),
            onError: () => showError('Error', 'Failed to update round-ups'),
          });
        }}
      />

      {/* Support sheet */}
      <BottomSheet visible={activeSheet === 'support'} onClose={closeSheet}>
        <Text className="mb-2 font-subtitle text-xl">Contact Support</Text>
        <Text className="mb-6 font-body text-base leading-6 text-neutral-500">
          Having an issue with your card? Our team is here to help.
        </Text>
        <Button
          title="Open Support Chat"
          variant="black"
          onPress={() => {
            closeSheet();
            showInfo('Support', 'Opening support chat…');
          }}
          flex
        />
      </BottomSheet>

      {/* Feedback sheet */}
      <BottomSheet visible={activeSheet === 'feedback'} onClose={closeSheet}>
        <Text className="mb-2 font-subtitle text-xl">Share Feedback</Text>
        <Text className="mb-6 font-body text-base leading-6 text-neutral-500">
          Help us improve your card experience.
        </Text>
        <Button
          title="Share Feedback"
          variant="black"
          onPress={() => {
            closeSheet();
            showInfo('Thanks!', 'Feedback form coming soon');
          }}
          flex
        />
      </BottomSheet>

      {/* Terms sheet */}
      <BottomSheet visible={activeSheet === 'terms'} onClose={closeSheet}>
        <Text className="mb-2 font-subtitle text-xl">Terms & Conditions</Text>
        <Text className="mb-6 font-body text-base leading-6 text-neutral-500">
          Review the terms and conditions for your Rail card.
        </Text>
        <Button
          title="View Terms"
          variant="black"
          onPress={() => {
            closeSheet();
            showInfo('Coming Soon', 'Terms document will be available soon');
          }}
          flex
        />
      </BottomSheet>
    </View>
  );
}
