import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import {
  Add01Icon,
  Award01Icon,
  Target02Icon,
  Beach02Icon,
  Home01Icon,
  Car01Icon,
  DiamondIcon,
  MortarboardIcon,
  Shield01Icon,
  Gif01Icon,
  IconComponent as HugeiconsIcon,
  Money01Icon,
  AirplaneTakeOff01Icon,
} from '@/lib/icons';
import { GorhomBottomSheet } from '@/components/sheets/GorhomBottomSheet';
import { aiService } from '@/api/services/ai.service';
import { useHaptics } from '@/hooks/useHaptics';
import { useFeedbackPopupStore } from '@/stores/feedbackPopupStore';
import { useQuery } from '@tanstack/react-query';
import type { SharedGoal, GoalMember, GoalContribution } from '@/api/types/ai';

interface Props {
  goal: SharedGoal | null;
  visible: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const GOAL_ICONS: Record<string, any> = {
  'target-02': Target02Icon,
  'beach-02': Beach02Icon,
  'home-01': Home01Icon,
  'car-01': Car01Icon,
  diamond: DiamondIcon,
  mortarboard: MortarboardIcon,
  'shield-01': Shield01Icon,
  'gift-01': Gif01Icon,
  'money-01': Money01Icon,
  'airplane-take-off-01': AirplaneTakeOff01Icon,
};

function LeaderboardRow({ member, rank }: { member: GoalMember; rank: number }) {
  return (
    <View className="flex-row items-center border-b border-black/[0.04] py-3">
      <Text className="w-8 font-body-medium text-[14px] text-text-secondary">{rank + 1}.</Text>
      <Text className="flex-1 font-body-medium text-[14px] text-text-primary">
        @{member.rail_tag || 'member'}
      </Text>
      <Text className="font-mono-semibold text-[14px] text-text-primary">
        $
        {Number(parseFloat(member.total_contributed)).toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
      </Text>
    </View>
  );
}

function ContributionRow({ item }: { item: GoalContribution }) {
  const timeAgo = getTimeAgo(item.created_at);
  return (
    <View className="flex-row items-center py-2.5">
      <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-[#D1FAE5]">
        <HugeiconsIcon icon={Add01Icon} size={14} color="#065F46" />
      </View>
      <View className="flex-1">
        <Text className="font-body text-[13px] text-text-primary">
          <Text className="font-body-medium">@{item.rail_tag || 'you'}</Text> contributed
        </Text>
        <Text className="font-body text-[11px] text-text-tertiary">{timeAgo}</Text>
      </View>
      <Text className="font-mono-semibold text-[14px] text-[#00c454]">
        +$
        {Number(parseFloat(item.amount)).toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
      </Text>
    </View>
  );
}

export function GoalDetailSheet({ goal, visible, onClose, onRefresh }: Props) {
  const { impact, notification } = useHaptics();
  const showPopup = useFeedbackPopupStore((s) => s.showPopup);
  const [showContribute, setShowContribute] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: leaderboard } = useQuery({
    queryKey: ['goal-leaderboard', goal?.id],
    queryFn: () => aiService.getGoalLeaderboard(goal!.id).then((r) => r.data),
    enabled: !!goal?.id,
  });

  const { data: contributions } = useQuery({
    queryKey: ['goal-contributions', goal?.id],
    queryFn: () => aiService.getGoalContributions(goal!.id).then((r) => r.data),
    enabled: !!goal?.id,
  });

  const handleContribute = useCallback(async () => {
    if (!goal || !amount.trim()) return;
    setLoading(true);
    try {
      await aiService.contributeToGoal(goal.id, { amount });
      notification('success');
      showPopup({
        type: 'success',
        title: 'Contributed!',
        message: `$${amount} added to ${goal.name}`,
      });
      setAmount('');
      setShowContribute(false);
      onRefresh();
    } catch {
      notification('error');
    } finally {
      setLoading(false);
    }
  }, [amount, goal, notification, onRefresh, showPopup]);

  if (!goal) return null;

  const progress =
    parseFloat(goal.target_amount) > 0
      ? (parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100
      : 0;

  return (
    <GorhomBottomSheet visible={visible} onClose={onClose} snapPoints={['85%']} dismissible>
      <View className="flex-1 px-5 pb-8 pt-2">
        {/* Header */}
        <View className="mb-5 items-center">
          <View className="mb-2 h-16 w-16 items-center justify-center rounded-full bg-[#f7f2e8]">
            <HugeiconsIcon
              icon={GOAL_ICONS[goal.icon_name] || Target02Icon}
              size={28}
              color="#000"
            />
          </View>
          <Text className="font-heading-bold text-xl text-text-primary">{goal.name}</Text>
          <Text className="mt-1 font-body text-sm text-text-secondary">
            {goal.member_count ?? 1} member{(goal.member_count ?? 1) !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Progress */}
        <View className="mb-5 rounded-3xl bg-[#f7f2e8] p-5">
          <View className="mb-2 flex-row justify-between">
            <Text className="font-mono-semibold text-2xl text-text-primary">
              $
              {Number(parseFloat(goal.current_amount)).toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </Text>
            <Text className="self-end font-body text-sm text-text-secondary">
              of $
              {Number(parseFloat(goal.target_amount)).toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </Text>
          </View>
          <View className="h-3 overflow-hidden rounded-full bg-warm-canvas">
            <View
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </View>
          <Text className="mt-2 font-body text-[12px] text-text-tertiary">
            {Math.round(progress)}% complete
            {goal.deadline
              ? ` · Due ${new Date(goal.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
              : ''}
          </Text>
        </View>

        {/* Contribute button */}
        {!showContribute ? (
          <Pressable
            onPress={() => {
              impact();
              setShowContribute(true);
            }}
            className="mb-5 items-center rounded-full bg-black py-4"
            accessibilityRole="button"
            accessibilityLabel="Contribute to goal">
            <Text className="font-heading-bold text-[15px] text-white">Contribute</Text>
          </Pressable>
        ) : (
          <View className="mb-5 rounded-3xl bg-[#f7f2e8] p-5">
            <Text className="mb-3 font-body text-[12px] text-text-secondary">
              Amount to contribute
            </Text>
            <View className="mb-4 flex-row items-center">
              <Text className="mr-1 font-mono-semibold text-3xl text-text-primary">$</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#848281"
                className="flex-1 font-mono-semibold text-3xl text-text-primary"
                autoFocus
              />
            </View>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => {
                  setShowContribute(false);
                  setAmount('');
                }}
                className="flex-1 items-center rounded-full border border-black/[0.08] py-3.5"
                accessibilityRole="button">
                <Text className="font-body-medium text-[14px] text-text-secondary">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleContribute}
                disabled={loading || !amount.trim()}
                className="flex-1 items-center rounded-full bg-black py-3.5"
                style={{ opacity: loading || !amount.trim() ? 0.5 : 1 }}
                accessibilityRole="button">
                <Text className="font-heading-bold text-[14px] text-white">
                  {loading ? '...' : 'Add'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Leaderboard */}
        {leaderboard && leaderboard.length > 0 && (
          <View className="mb-5">
            <View className="mb-2 flex-row items-center">
              <HugeiconsIcon icon={Award01Icon} size={16} color="#000" />
              <Text className="ml-2 font-heading-bold text-[14px] text-text-primary">
                Leaderboard
              </Text>
            </View>
            {leaderboard.map((m, i) => (
              <LeaderboardRow key={m.id} member={m} rank={i} />
            ))}
          </View>
        )}

        {/* Recent activity */}
        {contributions && contributions.length > 0 && (
          <View>
            <Text className="mb-2 font-heading-bold text-[14px] text-text-primary">Activity</Text>
            {contributions.slice(0, 10).map((c) => (
              <ContributionRow key={c.id} item={c} />
            ))}
          </View>
        )}
      </View>
    </GorhomBottomSheet>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
