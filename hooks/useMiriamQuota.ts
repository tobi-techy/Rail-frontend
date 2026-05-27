import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSubscription } from '@/api/hooks/useGameplay';
import { logger } from '@/lib/logger';

export type MiriamFeature =
  | 'chat'
  | 'voice'
  | 'image_analysis'
  | 'pinned_insights'
  | 'automations'
  | 'impact_dashboard'
  | 'advanced_forecasts'
  | 'receipt_scanning'
  | 'tax_summary'
  | 'human_escalation';

interface QuotaState {
  dailyMessagesUsed: number;
  dailyMessagesLimit: number;
  voiceUsed: number;
  voiceLimit: number;
  pinnedInsightsUsed: number;
  pinnedInsightsLimit: number;
  automationsUsed: number;
  automationsLimit: number;
  quotaResetAt: string;
}

const FREE_TIER: Record<MiriamFeature, { enabled: boolean; limit?: number }> = {
  chat: { enabled: true, limit: 50 },
  voice: { enabled: true, limit: 30 },
  image_analysis: { enabled: true },
  pinned_insights: { enabled: true, limit: 10 },
  automations: { enabled: true, limit: 10 },
  impact_dashboard: { enabled: true },
  advanced_forecasts: { enabled: true },
  receipt_scanning: { enabled: true },
  tax_summary: { enabled: true },
  human_escalation: { enabled: true },
};

const PRO_TIER: Record<MiriamFeature, { enabled: boolean; limit?: number }> = {
  chat: { enabled: true },
  voice: { enabled: true, limit: 999 },
  image_analysis: { enabled: true },
  pinned_insights: { enabled: true, limit: 50 },
  automations: { enabled: true, limit: 50 },
  impact_dashboard: { enabled: true },
  advanced_forecasts: { enabled: true },
  receipt_scanning: { enabled: true },
  tax_summary: { enabled: true },
  human_escalation: { enabled: true },
};

const STORAGE_KEY = '@rail:miriam-quota:v1';

function defaultQuota(isPro: boolean): QuotaState {
  return {
    dailyMessagesUsed: 0,
    dailyMessagesLimit: isPro ? 999 : FREE_TIER.chat.limit ?? 999,
    voiceUsed: 0,
    voiceLimit: isPro ? 999 : FREE_TIER.voice.limit ?? 999,
    pinnedInsightsUsed: 0,
    pinnedInsightsLimit: isPro ? 50 : FREE_TIER.pinned_insights.limit ?? 999,
    automationsUsed: 0,
    automationsLimit: isPro ? 50 : FREE_TIER.automations.limit ?? 999,
    quotaResetAt: new Date().toISOString(),
  };
}

function isNewDay(resetDate: Date, now: Date): boolean {
  return (
    resetDate.getDate() !== now.getDate() ||
    resetDate.getMonth() !== now.getMonth() ||
    resetDate.getFullYear() !== now.getFullYear()
  );
}

export function useMiriamQuota() {
  const { data: subData } = useSubscription();
  const isPro = __DEV__ || (subData?.is_pro ?? false);
  const tier = isPro ? PRO_TIER : FREE_TIER;

  const [quota, setQuota] = useState<QuotaState>(defaultQuota(isPro));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) {
          setQuota(defaultQuota(isPro));
          return;
        }
        const parsed = JSON.parse(raw) as QuotaState;
        const resetDate = new Date(parsed.quotaResetAt);
        const now = new Date();
        if (isNewDay(resetDate, now)) {
          if (!cancelled) setQuota(defaultQuota(isPro));
        } else {
          if (!cancelled) setQuota(parsed);
        }
      } catch (e) {
        logger.warn('Failed to load Miriam quota', { error: e });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isPro]);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(quota));
      } catch (e) {
        logger.warn('Failed to save Miriam quota', { error: e });
      }
    })();
  }, [quota]);

  const canUseFeature = useCallback(
    (feature: MiriamFeature): boolean => {
      const config = tier[feature];
      if (!config.enabled) return false;
      const usage = getUsage(feature);
      if (config.limit !== undefined && usage.used >= config.limit) return false;
      return true;
    },
    [tier]
  );

  const getUsage = useCallback(
    (feature: MiriamFeature): { used: number; limit: number; percentage: number } => {
      switch (feature) {
        case 'chat':
        case 'image_analysis':
        case 'receipt_scanning':
          return {
            used: quota.dailyMessagesUsed,
            limit: quota.dailyMessagesLimit,
            percentage: quota.dailyMessagesLimit > 0 ? quota.dailyMessagesUsed / quota.dailyMessagesLimit : 0,
          };
        case 'voice':
          return {
            used: quota.voiceUsed,
            limit: quota.voiceLimit,
            percentage: quota.voiceLimit > 0 ? quota.voiceUsed / quota.voiceLimit : 0,
          };
        case 'pinned_insights':
          return {
            used: quota.pinnedInsightsUsed,
            limit: quota.pinnedInsightsLimit,
            percentage: quota.pinnedInsightsLimit > 0 ? quota.pinnedInsightsUsed / quota.pinnedInsightsLimit : 0,
          };
        case 'automations':
          return {
            used: quota.automationsUsed,
            limit: quota.automationsLimit,
            percentage: quota.automationsLimit > 0 ? quota.automationsUsed / quota.automationsLimit : 0,
          };
        default:
          return { used: 0, limit: 999, percentage: 0 };
      }
    },
    [quota]
  );

  const isNearLimit = useCallback(
    (feature: MiriamFeature): boolean => {
      const usage = getUsage(feature);
      return usage.percentage >= 0.8 && usage.percentage < 1;
    },
    [getUsage]
  );

  const incrementUsage = useCallback((feature: MiriamFeature) => {
    setQuota((s) => {
      switch (feature) {
        case 'chat':
          return { ...s, dailyMessagesUsed: s.dailyMessagesUsed + 1 };
        case 'voice':
          return { ...s, voiceUsed: s.voiceUsed + 1 };
        case 'image_analysis':
        case 'receipt_scanning':
          return { ...s, dailyMessagesUsed: s.dailyMessagesUsed + 1 };
        case 'pinned_insights':
          return { ...s, pinnedInsightsUsed: s.pinnedInsightsUsed + 1 };
        case 'automations':
          return { ...s, automationsUsed: s.automationsUsed + 1 };
        default:
          return s;
      }
    });
  }, []);

  const canUse = useCallback(
    (feature: MiriamFeature): boolean => {
      return canUseFeature(feature);
    },
    [canUseFeature]
  );

  return {
    isPro,
    canUseFeature,
    getUsage,
    isNearLimit,
    incrementUsage,
    quota,
    canUse,
  };
}
