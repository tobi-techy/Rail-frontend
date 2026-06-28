import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { GorhomBottomSheet } from '@/components/sheets/GorhomBottomSheet';
import { DateSeparator, isDifferentDay } from '@/components/ai/DateSeparator';
import { ThumbsUpIcon, ThumbsDownIcon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import aiService from '@/api/services/ai.service';
import type { MiriamDecisionReceipt } from '@/api/types/ai';

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function humanizeAction(actionType: string): string {
  const map: Record<string, string> = {
    transfer_to_stash: 'Moved to Stash',
    stash_top_up: 'Topped up Stash',
    bill_reservation: 'Reserved for bill',
    goal_contribution: 'Added to goal',
    transfer_from_stash: 'Pulled from Stash',
  };
  return map[actionType] ?? actionType.replace(/_/g, ' ');
}

const STATUS_COLORS: Record<string, string> = {
  executed: '#00ca48',
  skipped: '#848281',
  failed: '#ff2b3a',
  suggested: '#ff3e00',
};

interface ReceiptRowProps {
  item: MiriamDecisionReceipt;
  onFeedback: (id: string, signal: 'positive' | 'negative') => void;
  feedbackSent: Record<string, string>;
  isLast: boolean;
}

function ReceiptRow({ item, onFeedback, feedbackSent, isLast }: ReceiptRowProps) {
  const statusColor = STATUS_COLORS[item.status] ?? '#848281';
  const sent = feedbackSent[item.id];
  const amount = parseFloat(item.amount);

  return (
    <View
      className="py-4"
      style={isLast ? undefined : { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' }}>
      <View className="flex-row items-start gap-3">
        {/* Status dot — replaces icon circle */}
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: statusColor,
            marginTop: 6,
          }}
        />

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-baseline justify-between">
            <Text className="mr-2 flex-1 font-subtitle text-[14px] text-charcoal-primary">
              {humanizeAction(item.action_type)}
            </Text>
            {amount > 0 && (
              <Text
                className="font-button text-[14px]"
                style={{ color: statusColor, fontVariant: ['tabular-nums'] }}>
                ${amount.toFixed(2)}
              </Text>
            )}
          </View>

          <Text
            className="mt-0.5 font-body text-[12px] leading-[17px] text-graphite"
            numberOfLines={2}>
            {item.reason}
          </Text>

          <View className="mt-2.5 flex-row items-center justify-between">
            <Text className="font-body text-[11px] text-ash">{timeAgo(item.created_at)}</Text>

            {item.status === 'executed' && (
              <View className="flex-row gap-4">
                <Pressable
                  onPress={() => !sent && onFeedback(item.id, 'positive')}
                  hitSlop={12}
                  className="active:scale-[0.85]"
                  accessibilityLabel="Good move">
                  <HugeiconsIcon
                    icon={ThumbsUpIcon}
                    size={15}
                    color={sent === 'positive' ? '#00ca48' : '#d0cdc9'}
                  />
                </Pressable>
                <Pressable
                  onPress={() => !sent && onFeedback(item.id, 'negative')}
                  hitSlop={12}
                  className="active:scale-[0.85]"
                  accessibilityLabel="Undo this">
                  <HugeiconsIcon
                    icon={ThumbsDownIcon}
                    size={15}
                    color={sent === 'negative' ? '#ff2b3a' : '#d0cdc9'}
                  />
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onOpenMandates?: () => void;
}

export function MiriamActivitySheet({ visible, onClose, onOpenMandates }: Props) {
  const [receipts, setReceipts] = useState<MiriamDecisionReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState<Record<string, string>>({});

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await aiService.getMiriamReceipts(50);
      setReceipts((res as any)?.data ?? []);
    } catch {
      //
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const handleFeedback = useCallback(async (id: string, signal: 'positive' | 'negative') => {
    setFeedbackSent((prev) => ({ ...prev, [id]: signal }));
    try {
      await aiService.recordMiriamFeedback(id, signal);
    } catch {
      setFeedbackSent((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }, []);

  type ListItem = MiriamDecisionReceipt | { _separator: string };

  const listData: ListItem[] = React.useMemo(() => {
    const items: ListItem[] = [];
    receipts.forEach((r, i) => {
      if (i === 0 || isDifferentDay(receipts[i - 1]?.created_at, r.created_at)) {
        items.push({ _separator: r.created_at });
      }
      items.push(r);
    });
    return items;
  }, [receipts]);

  return (
    <GorhomBottomSheet visible={visible} onClose={onClose} snapPoints={['80%']}>
      <View className="mb-5 flex-row items-baseline justify-between">
        <Text className="font-subtitle text-[18px] text-charcoal-primary">Miriam&apos;s moves</Text>
        <Text className="font-body text-[13px] text-ash" style={{ fontVariant: ['tabular-nums'] }}>
          {receipts.length} action{receipts.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {loading ? (
        <View className="items-center py-10">
          <ActivityIndicator color="#ff3e00" />
        </View>
      ) : receipts.length === 0 ? (
        <View className="items-center py-12">
          <Text className="font-subtitle text-[15px] text-charcoal-primary">No moves yet</Text>
          <Text className="mt-2 text-center font-body text-[14px] text-graphite">
            Set up autopilot and Miriam will{'\n'}quietly move money when it&apos;s safe.
          </Text>
          {onOpenMandates && (
            <Pressable
              className="mt-6 rounded-full bg-charcoal-primary px-6 py-3.5 active:scale-[0.96]"
              onPress={onOpenMandates}>
              <Text className="font-button text-[14px] text-white">Set up autopilot</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item, i) =>
            '_separator' in item ? `sep-${i}` : (item as MiriamDecisionReceipt).id
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load(true);
              }}
              tintColor="#ff3e00"
            />
          }
          renderItem={({ item, index }) => {
            if ('_separator' in item) {
              return <DateSeparator iso={item._separator} />;
            }
            const r = item as MiriamDecisionReceipt;
            const isLast = index === listData.length - 1;
            return (
              <ReceiptRow
                item={r}
                onFeedback={handleFeedback}
                feedbackSent={feedbackSent}
                isLast={isLast}
              />
            );
          }}
        />
      )}
    </GorhomBottomSheet>
  );
}
