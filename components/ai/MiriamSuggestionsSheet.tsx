import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { GorhomBottomSheet } from '@/components/sheets/GorhomBottomSheet';
import { Button } from '@/components/ui';
import aiService from '@/api/services/ai.service';
import type { MiriamMandateSuggestion } from '@/api/types/ai';
import { useButtonFeedback } from '@/hooks/useButtonFeedback';

function formatParam(value: string, prefix: string, suffix: string): string {
  const n = parseFloat(value);
  if (isNaN(n) || n === 0) return '';
  return `${prefix}$${n.toFixed(0)}${suffix}`;
}

interface SuggestionCardProps {
  suggestion: MiriamMandateSuggestion;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  actioning: string | null;
}

function SuggestionCard({ suggestion: s, onAccept, onDismiss, actioning }: SuggestionCardProps) {
  const busy = actioning === s.id;
  const triggerFeedback = useButtonFeedback();

  const params = [
    formatParam(s.suggested_max_amount, 'up to ', '/move'),
    formatParam(s.suggested_max_day, '', '/day cap'),
    formatParam(s.suggested_min_balance, '', ' floor'),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View
      className="mb-3 rounded-3xl bg-white p-5"
      style={{ borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
      <Text className="font-subtitle text-[16px] text-charcoal-primary">{s.name}</Text>

      <Text className="mt-3 font-body text-[14px] leading-[22px] text-graphite">{s.reasoning}</Text>

      {params.length > 0 && <Text className="mt-2 font-body text-[12px] text-ash">{params}</Text>}

      <View className="mt-5 flex-row gap-3">
        <Pressable
          onPress={() => {
            if (!busy) {
              triggerFeedback();
              onDismiss(s.id);
            }
          }}
          className="flex-1 items-center justify-center rounded-full py-3.5 active:scale-[0.96]"
          style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
          <Text className="font-button text-[14px] text-graphite">Not now</Text>
        </Pressable>
        <View className="flex-1">
          <Button
            title={busy ? 'Enabling…' : 'Enable'}
            onPress={() => !busy && onAccept(s.id)}
            disabled={busy}
          />
        </View>
      </View>
    </View>
  );
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onMandateCreated?: () => void;
}

export function MiriamSuggestionsSheet({ visible, onClose, onMandateCreated }: Props) {
  const [suggestions, setSuggestions] = useState<MiriamMandateSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await aiService.getMiriamSuggestions();
      setSuggestions((res as any)?.data ?? []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const handleAccept = useCallback(
    async (id: string) => {
      setActioning(id);
      try {
        await aiService.acceptMiriamSuggestion(id);
        setDismissed((prev) => new Set([...prev, id]));
        onMandateCreated?.();
      } catch {
        //
      } finally {
        setActioning(null);
      }
    },
    [onMandateCreated]
  );

  const handleDismiss = useCallback(async (id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
    try {
      await aiService.dismissMiriamSuggestion(id);
    } catch {
      //
    }
  }, []);

  const visibleSuggestions = suggestions.filter((s) => !dismissed.has(s.id));

  return (
    <GorhomBottomSheet visible={visible} onClose={onClose} snapPoints={['70%']}>
      <View className="mb-5">
        <Text className="font-subtitle text-[18px] text-charcoal-primary">
          Miriam&apos;s suggestions
        </Text>
        <Text className="mt-1 font-body text-[14px] text-graphite">
          Based on your spending patterns
        </Text>
      </View>

      {loading ? (
        <View className="items-center py-10">
          <ActivityIndicator color="#ff3e00" />
        </View>
      ) : visibleSuggestions.length === 0 ? (
        <View className="items-center py-10">
          <Text className="font-subtitle text-[15px] text-charcoal-primary">All caught up</Text>
          <Text className="mt-2 text-center font-body text-[14px] text-graphite">
            Miriam will suggest autopilot rules{'\n'}as she learns your patterns.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {visibleSuggestions.map((s) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              onAccept={handleAccept}
              onDismiss={handleDismiss}
              actioning={actioning}
            />
          ))}
        </ScrollView>
      )}
    </GorhomBottomSheet>
  );
}
