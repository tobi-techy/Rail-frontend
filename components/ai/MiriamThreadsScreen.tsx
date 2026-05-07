import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';
import {
  Add01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  Cancel01Icon,
  FlashIcon,
  InternetIcon,
  Invoice02Icon,
  Menu01Icon,
  MoreHorizontalIcon,
  Search01Icon,
  Settings01Icon,
  UserIcon,
  Wallet01Icon,
} from '@/lib/icons';
import { GorhomBottomSheet } from '@/components/sheets/GorhomBottomSheet';
import { PasscodeInput } from '@/components/molecules/PasscodeInput';
import {
  useAutomations,
  useFinancialObligations,
  useOperatingPlan,
  useStageOperatingPlanAction,
  useVerifyPasscode,
} from '@/api/hooks';
import { useAIChatStore } from '@/stores/aiChatStore';
import type { AIConversation, MoneyOperatingPlanAction } from '@/api/types/ai';
import { ThreadRow } from './ThreadRow';

const BG = '#F7F7F2';

interface Props {
  visible: boolean;
  topInset: number;
  bottomInset: number;
  conversations: AIConversation[];
  threadSearch: string;
  activeConversationId: string | null;
  onSearchChange: (value: string) => void;
  onBack: () => void;
  onNewThread: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onSendPrompt: (prompt: string) => void;
  onOpenAccount: () => void;
}

function money(value?: string | number | null, fallback = '$0.00') {
  if (value === undefined || value === null || value === '') return fallback;
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  return `$${num.toFixed(2)}`;
}

function label(value?: string) {
  return (value ?? '').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isTransferAutomation(action: MoneyOperatingPlanAction) {
  return (
    action.type === 'create_automation' &&
    ['transfer_to_stash', 'transfer_to_spend'].includes(String(action.params?.action_type ?? ''))
  );
}

function SetupRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: any;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center border-b border-black/[0.06] py-4"
      accessibilityRole="button"
      accessibilityLabel={title}>
      <View className="h-9 w-9 items-center justify-center rounded-full bg-stone-surface">
        <HugeiconsIcon icon={icon} size={18} color="#24383C" />
      </View>
      <View className="ml-3 flex-1">
        <Text className="font-body-medium text-[16px] text-[#24383C]">{title}</Text>
        <Text className="mt-0.5 font-body text-[13px] text-text-secondary" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#A7A7A7" />
    </Pressable>
  );
}

function Metric({ label: title, value }: { label: string; value: string }) {
  return (
    <View className="flex-1">
      <Text className="font-body text-[12px] text-text-secondary">{title}</Text>
      <Text className="mt-1 font-mono-semibold text-[19px] text-[#24383C]">{value}</Text>
    </View>
  );
}

export function MiriamThreadsScreen({
  visible,
  topInset,
  bottomInset,
  conversations,
  threadSearch,
  activeConversationId,
  onSearchChange,
  onBack,
  onNewThread,
  onSelectConversation,
  onDeleteConversation,
  onSendPrompt,
  onOpenAccount,
}: Props) {
  const [tab, setTab] = useState<'threads' | 'actions'>('threads');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [passcodeOpen, setPasscodeOpen] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [pendingPlanAction, setPendingPlanAction] = useState<MoneyOperatingPlanAction | null>(null);

  const planQuery = useOperatingPlan();
  const automationsQuery = useAutomations();
  const obligationsQuery = useFinancialObligations({ status: 'active' });
  const stageAction = useStageOperatingPlanAction();
  const verifyPasscode = useVerifyPasscode();

  const filteredConversations = useMemo(() => {
    if (!threadSearch.trim()) return conversations ?? [];
    const q = threadSearch.toLowerCase();
    return (conversations ?? []).filter((c) => (c.title ?? '').toLowerCase().includes(q));
  }, [conversations, threadSearch]);

  const operating = planQuery.data?.operating_plan;
  const nextActions = planQuery.data?.next_actions ?? [];
  const activeAutomations = automationsQuery.data?.data?.filter((item) => item.is_active) ?? [];
  const activeObligations = obligationsQuery.data?.data ?? [];

  const stagePlanAction = async (action: MoneyOperatingPlanAction) => {
    const res = await stageAction.mutateAsync({
      conversation_id: activeConversationId,
      type: action.type,
      params: action.params,
    });
    const pending = res.staged?.pending_action;
    if (pending) {
      useAIChatStore.setState({
        activeConversationId: res.conversation_id,
        pendingAction: pending,
      });
      onBack();
    }
  };

  const handleActionPress = async (action: MoneyOperatingPlanAction) => {
    if (action.type === 'review_risks') {
      onSendPrompt('Review the risks in my current Miriam operating plan.');
      onBack();
      return;
    }
    if (isTransferAutomation(action)) {
      setPendingPlanAction(action);
      setPasscode('');
      setPasscodeError('');
      setPasscodeOpen(true);
      return;
    }
    await stagePlanAction(action);
  };

  const handlePasscodeComplete = async (code: string) => {
    if (!pendingPlanAction || verifyPasscode.isPending || stageAction.isPending) return;
    setPasscode(code);
    setPasscodeError('');
    try {
      const verified = await verifyPasscode.mutateAsync({ passcode: code });
      if (!verified.verified) {
        setPasscodeError('Incorrect PIN');
        setPasscode('');
        return;
      }
      const action = {
        ...pendingPlanAction,
        params: {
          ...pendingPlanAction.params,
          action_config: {
            ...(pendingPlanAction.params.action_config ?? {}),
            acknowledged_future_transfer: true,
          },
        },
      };
      setPasscodeOpen(false);
      setPendingPlanAction(null);
      await stagePlanAction(action);
    } catch (error: any) {
      setPasscodeError(error?.message ?? 'PIN verification failed');
      setPasscode('');
    }
  };

  const promptAndClose = (prompt: string) => {
    setSettingsOpen(false);
    onBack();
    onSendPrompt(prompt);
  };

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(150)}
      className="absolute bottom-0 left-0 right-0 top-0 z-20"
      style={{ backgroundColor: BG }}>
      <View
        className="flex-row items-center justify-between px-5 pb-4"
        style={{ paddingTop: topInset + 8 }}>
        <Pressable
          onPress={() => setSettingsOpen(true)}
          className="h-12 w-12 items-center justify-center rounded-full bg-white"
          accessibilityRole="button"
          accessibilityLabel="Miriam settings">
          <HugeiconsIcon icon={Settings01Icon} size={23} color="#24383C" />
        </Pressable>
        <Text className="font-body-medium text-[26px] text-[#24383C]">Miriam</Text>
        <Pressable
          onPress={onBack}
          className="h-12 w-12 items-center justify-center rounded-full bg-white"
          accessibilityRole="button"
          accessibilityLabel="Back to chat">
          <HugeiconsIcon icon={ArrowRight01Icon} size={24} color="#24383C" />
        </Pressable>
      </View>

      <View className="mx-5 mb-5">
        <View className="flex-row items-center rounded-full bg-stone-surface px-4 py-3.5">
          <HugeiconsIcon icon={Search01Icon} size={19} color="#848281" />
          <TextInput
            value={threadSearch}
            onChangeText={onSearchChange}
            placeholder={tab === 'threads' ? 'Search threads' : 'Search actions'}
            placeholderTextColor="#848281"
            className="ml-3 flex-1 font-body text-[17px] text-[#24383C]"
          />
        </View>
      </View>

      {tab === 'threads' ? (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {filteredConversations.length === 0 ? (
            <View className="items-center px-6 pt-24">
              <Text className="font-body-medium text-[17px] text-[#24383C]">
                {threadSearch ? 'No matching threads' : 'No threads yet'}
              </Text>
              <Text className="mt-2 text-center font-body text-[14px] text-text-secondary">
                {threadSearch
                  ? 'Try another search.'
                  : 'Start with a money question and the thread lands here.'}
              </Text>
            </View>
          ) : (
            filteredConversations.map((conv) => (
              <ThreadRow
                key={conv.id}
                conv={conv}
                onPress={() => onSelectConversation(conv.id)}
                onDelete={() => onDeleteConversation(conv.id)}
              />
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {planQuery.isLoading ? (
            <View className="items-center pt-16">
              <ActivityIndicator color="#24383C" />
              <Text className="mt-3 font-body text-[14px] text-text-secondary">
                Loading operating plan
              </Text>
            </View>
          ) : !planQuery.data?.has_profile ? (
            <View className="rounded-[24px] bg-white p-5">
              <Text className="font-heading-semibold text-[20px] text-[#24383C]">
                Set up Miriam
              </Text>
              <Text className="mt-2 font-body text-[15px] leading-[22px] text-text-secondary">
                Miriam needs your money type, country, currencies, taxes, and obligations before she
                can operate the month properly.
              </Text>
              <Pressable
                onPress={() =>
                  promptAndClose(
                    'Help me set up my Miriam money profile for my country, income type, taxes, currencies, and obligations.'
                  )
                }
                className="mt-5 items-center rounded-full bg-[#121212] py-4"
                accessibilityRole="button"
                accessibilityLabel="Set up Miriam profile">
                <Text className="font-body-medium text-[16px] text-white">Start setup</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View className="rounded-[24px] bg-white p-5">
                <Text className="font-heading-semibold text-[20px] text-[#24383C]">
                  Operating plan
                </Text>
                <View className="mt-5 flex-row gap-4">
                  <Metric label="Safe today" value={money(operating?.safe_spend_today)} />
                  <Metric label="Rest of month" value={money(operating?.safe_spend_rest_month)} />
                </View>
                <View className="mt-5 flex-row gap-4">
                  <Metric label="Tax reserve" value={money(operating?.tax_reserve_target)} />
                  <Metric label="Stash target" value={money(operating?.stash_target)} />
                </View>
                <Text className="mt-4 font-body text-[13px] text-text-secondary">
                  {activeObligations.length} obligations · {activeAutomations.length} active
                  automations
                </Text>
              </View>

              <View className="mt-5">
                <Text className="mb-2 font-body-medium text-[15px] text-[#24383C]">
                  Next actions
                </Text>
                {nextActions.slice(0, 5).map((action) => (
                  <Pressable
                    key={`${action.type}-${action.title}`}
                    onPress={() => handleActionPress(action)}
                    disabled={stageAction.isPending || verifyPasscode.isPending}
                    className="mb-3 rounded-[20px] bg-white p-4"
                    accessibilityRole="button"
                    accessibilityLabel={action.title}>
                    <View className="flex-row items-start">
                      <View className="h-9 w-9 items-center justify-center rounded-full bg-stone-surface">
                        <HugeiconsIcon
                          icon={
                            action.type === 'create_automation'
                              ? FlashIcon
                              : action.type.includes('obligation')
                                ? Invoice02Icon
                                : Wallet01Icon
                          }
                          size={18}
                          color="#24383C"
                        />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="font-body-medium text-[15px] text-[#24383C]">
                          {action.title}
                        </Text>
                        <Text
                          className="mt-1 font-body text-[13px] leading-[19px] text-text-secondary"
                          numberOfLines={2}>
                          {action.description ?? 'Approval required before anything changes.'}
                        </Text>
                      </View>
                      <HugeiconsIcon icon={MoreHorizontalIcon} size={20} color="#A7A7A7" />
                    </View>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}

      <View
        pointerEvents="box-none"
        className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between px-6"
        style={{ paddingBottom: bottomInset + 18 }}>
        <View className="flex-row rounded-full bg-white p-1 shadow-sm">
          {(['threads', 'actions'] as const).map((item) => (
            <Pressable
              key={item}
              onPress={() => setTab(item)}
              className={`flex-row items-center rounded-full px-5 py-3 ${tab === item ? 'bg-stone-surface' : ''}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === item }}>
              <HugeiconsIcon
                icon={item === 'threads' ? Menu01Icon : FlashIcon}
                size={18}
                color="#24383C"
              />
              <Text className="ml-2 font-body-medium text-[14px] text-[#24383C]">
                {label(item)}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={onNewThread}
          className="h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm"
          accessibilityRole="button"
          accessibilityLabel="New thread">
          <HugeiconsIcon icon={Add01Icon} size={27} color="#121212" />
        </Pressable>
      </View>

      <GorhomBottomSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        snapPoints={['72%']}
        dismissible>
        <ScrollView className="px-5 pb-8 pt-2" showsVerticalScrollIndicator={false}>
          <View className="mb-6 flex-row items-center justify-between">
            <Pressable
              onPress={() => setSettingsOpen(false)}
              className="h-12 w-12 items-center justify-center rounded-full bg-stone-surface"
              accessibilityRole="button"
              accessibilityLabel="Close settings">
              <HugeiconsIcon icon={Cancel01Icon} size={23} color="#24383C" />
            </Pressable>
            <Text className="font-body-medium text-[24px] text-[#24383C]">Settings</Text>
            <View className="h-12 w-12" />
          </View>

          <Pressable
            onPress={onOpenAccount}
            className="mb-6 flex-row items-center"
            accessibilityRole="button">
            <View className="h-20 w-20 items-center justify-center rounded-full border border-black/[0.06] bg-white">
              <Text className="font-body-medium text-[34px] text-[#24383C]">M</Text>
            </View>
            <View className="ml-4">
              <Text className="font-body-medium text-[25px] text-[#24383C]">Miriam setup</Text>
              <Text className="mt-1 font-body text-[17px] text-[#3E8791]">Manage account</Text>
            </View>
          </Pressable>

          <View className="mb-6 rounded-[24px] bg-[#121212] p-5">
            <Text className="font-heading-semibold text-[29px] text-white">Rail Pro</Text>
            <Text className="mt-2 font-body text-[17px] leading-[24px] text-white/80">
              Turn Miriam into a monthly money operator with plans, reminders, and approval-gated
              actions.
            </Text>
            <Pressable
              onPress={() =>
                promptAndClose('Show me what Rail Pro Miriam can do with my operating plan.')
              }
              className="mt-8 items-center rounded-full bg-white py-4"
              accessibilityRole="button">
              <Text className="font-body-medium text-[17px] text-[#121212]">Get Pro</Text>
            </Pressable>
          </View>

          <SetupRow
            icon={UserIcon}
            title="Money profile"
            subtitle="Persona, country, tax country, and currencies"
            onPress={() =>
              promptAndClose('Help me update my Miriam financial profile. Ask only what you need.')
            }
          />
          <SetupRow
            icon={Invoice02Icon}
            title="Obligations"
            subtitle="Rent, family support, invoices, payroll, taxes"
            onPress={() => promptAndClose('Help me add my monthly financial obligations.')}
          />
          <SetupRow
            icon={FlashIcon}
            title="Automations"
            subtitle="Rules that run only after confirmation and passcode consent"
            onPress={() => {
              setSettingsOpen(false);
              setTab('actions');
            }}
          />
          <SetupRow
            icon={InternetIcon}
            title="Money across borders"
            subtitle="Currency exposure, country context, family support"
            onPress={() => promptAndClose('Build my money across borders report.')}
          />
          <SetupRow
            icon={Calendar03Icon}
            title="Tax readiness"
            subtitle="Reserve targets and accountant-friendly summaries"
            onPress={() =>
              promptAndClose('Help me prepare a tax readiness plan for my tax country.')
            }
          />
        </ScrollView>
      </GorhomBottomSheet>

      <GorhomBottomSheet
        visible={passcodeOpen}
        onClose={() => {
          setPasscodeOpen(false);
          setPendingPlanAction(null);
          setPasscode('');
        }}
        snapPoints={['78%']}
        dismissible={!verifyPasscode.isPending && !stageAction.isPending}>
        <PasscodeInput
          title="Authorize automation"
          subtitle="This verifies one transfer automation. Miriam will ask again after the reauthorization window."
          value={passcode}
          onValueChange={setPasscode}
          onComplete={handlePasscodeComplete}
          errorText={passcodeError}
          showToggle
          autoSubmit
          variant="light"
        />
        {(verifyPasscode.isPending || stageAction.isPending) && (
          <View className="absolute bottom-10 left-0 right-0 items-center">
            <ActivityIndicator color="#24383C" />
          </View>
        )}
      </GorhomBottomSheet>
    </Animated.View>
  );
}
