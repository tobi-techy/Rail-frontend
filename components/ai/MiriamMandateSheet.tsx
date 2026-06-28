import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, Switch } from 'react-native';
import { GorhomBottomSheet } from '@/components/sheets/GorhomBottomSheet';
import aiService from '@/api/services/ai.service';
import type { MiriamMandate } from '@/api/types/ai';

function timeAgo(iso: string | undefined): string {
  if (!iso) return 'never';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function humanizeAction(actionType: string): string {
  const map: Record<string, string> = {
    transfer_to_stash: 'Auto-Stash',
    stash_top_up: 'Stash top-up',
    bill_reservation: 'Bill reserve',
    goal_contribution: 'Goal contribution',
    transfer_from_stash: 'Auto-pull',
  };
  return map[actionType] ?? actionType.replace(/_/g, ' ');
}

interface MandateRowProps {
  mandate: MiriamMandate;
  onToggle: (id: string, status: 'active' | 'paused') => void;
  toggling: string | null;
  isLast: boolean;
}

function MandateRow({ mandate: m, onToggle, toggling, isLast }: MandateRowProps) {
  const isActive = m.status === 'active';
  const busy = toggling === m.id;

  const paramParts = [
    parseFloat(m.max_amount_per_action) > 0 &&
      `$${parseFloat(m.max_amount_per_action).toFixed(0)}/move`,
    parseFloat(m.max_amount_per_day) > 0 && `$${parseFloat(m.max_amount_per_day).toFixed(0)}/day`,
    m.cooldown_minutes > 0 &&
      (m.cooldown_minutes >= 1440
        ? `${Math.round(m.cooldown_minutes / 1440)}d cooldown`
        : `${m.cooldown_minutes}m cooldown`),
  ].filter(Boolean);

  return (
    <View
      className="py-4"
      style={isLast ? undefined : { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' }}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <Text className="font-subtitle text-[15px] text-charcoal-primary">{m.name}</Text>
          <Text className="mt-0.5 font-body text-[12px] text-graphite">
            {humanizeAction(m.action_type)}
          </Text>
          {paramParts.length > 0 && (
            <Text className="mt-1 font-body text-[11px] text-ash">{paramParts.join(' · ')}</Text>
          )}
        </View>
        {busy ? (
          <ActivityIndicator size="small" color="#ff3e00" />
        ) : (
          <Switch
            value={isActive}
            onValueChange={(v) => onToggle(m.id, v ? 'active' : 'paused')}
            trackColor={{ false: '#e0ddd8', true: '#ff3e00' }}
            thumbColor="white"
          />
        )}
      </View>
      <Text className="mt-2 font-body text-[11px] text-ash">
        Last moved {timeAgo(m.last_executed_at)}
      </Text>
    </View>
  );
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function MiriamMandateSheet({ visible, onClose }: Props) {
  const [mandates, setMandates] = useState<MiriamMandate[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await aiService.getMiriamMandates();
      setMandates((res as any)?.data ?? []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const handleToggle = useCallback(async (id: string, status: 'active' | 'paused') => {
    setToggling(id);
    try {
      await aiService.updateMiriamMandateStatus(id, status);
      setMandates((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    } catch {
      //
    } finally {
      setToggling(null);
    }
  }, []);

  const active = mandates.filter((m) => m.status === 'active').length;

  return (
    <GorhomBottomSheet visible={visible} onClose={onClose} snapPoints={['70%']}>
      <View className="mb-5 flex-row items-baseline justify-between">
        <Text className="font-subtitle text-[18px] text-charcoal-primary">Autopilot rules</Text>
        {mandates.length > 0 && (
          <Text
            className="font-body text-[13px] text-ash"
            style={{ fontVariant: ['tabular-nums'] }}>
            {active} active
          </Text>
        )}
      </View>

      {loading ? (
        <View className="items-center py-10">
          <ActivityIndicator color="#ff3e00" />
        </View>
      ) : mandates.length === 0 ? (
        <View className="items-center py-10">
          <Text className="font-subtitle text-[15px] text-charcoal-primary">
            No autopilot rules yet
          </Text>
          <Text className="mt-2 text-center font-body text-[14px] text-graphite">
            Accept a suggestion from Miriam{'\n'}to set your first rule.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {mandates.map((m, i) => (
            <MandateRow
              key={m.id}
              mandate={m}
              onToggle={handleToggle}
              toggling={toggling}
              isLast={i === mandates.length - 1}
            />
          ))}
        </ScrollView>
      )}
    </GorhomBottomSheet>
  );
}
