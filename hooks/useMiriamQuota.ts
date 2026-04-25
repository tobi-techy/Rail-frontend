import { useState, useEffect, useCallback } from 'react';
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
  pinnedInsightsUsed: number;
  pinnedInsightsLimit: number;
  automationsUsed: number;
  automationsLimit: number;
  quotaResetAt: string;
}

const FREE_TIER: Record<MiriamFeature, { enabled: boolean; limit?: number }> = {
  chat: { enabled: true, limit: 10 },
  voice: { enabled: false },
  image_analysis: { enabled: false },
  pinned_insights: { enabled: true, limit: 1 },
  automations: { enabled: false },
  impact_dashboard: { enabled: false },
  advanced_forecasts: { enabled: false },
  receipt_scanning: { enabled: false },
  tax_summary: { enabled: false },
  human_escalation: { enabled: false },
};

const PRO_TIER: Record<MiriamFeature, { enabled: boolean; limit?: number }> = {
  chat: { enabled: true },
  voice: { enabled: true },
  image_analysis: { enabled: true },
  pinned_insights: { enabled: true, limit: 50 },
  automations: { enabled: true, limit: 10 },
  impact_dashboard: { enabled: true },
  advanced_forecasts: { enabled: true },
  receipt_scanning: { enabled: true },
  tax_summary: { enabled: true },
  human_escalation: { enabled: true },
};

const STORAGE_KEY = '@rail:miriam-quota:v1';

export function useMiriamQuota() {
  const { data: subData } = useSubscription();
  const isPro = __DEV__ || (subData?.is_pro ?? false);
  const tier = isPro ? PRO_TIER : FREE_TIER;

  const [quota, setQuota] = useState<QuotaState>({
    dailyMessagesUsed: 0,
    dailyMessagesLimit: tier.chat.limit ?? 999,
    pinnedInsightsUsed: 0,
    pinnedInsightsLimit: tier.pinned_insights.limit ?? 999,
    automationsUsed: 0,
    automationsLimit: tier.automations.limit ?? 999,
    quotaResetAt: new Date().toISOString(),
  });

  // Load quota from storage on mount
  useEffect(() => {
    try {
      const raw = localStorage?.getItem?.(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as QuotaState;
        const resetDate = new Date(parsed.quotaResetAt);
        const now = new Date();
        // Reset if it's a new day
        if (
          resetDate.getDate() !== now.getDate() ||
          resetDate.getMonth() !== now.getMonth() ||
          resetDate.getFullYear() !== now.getFullYear()
        ) {
          setQuota((s) => ({
            ...s,
            dailyMessagesUsed: 0,
            pinnedInsightsUsed: 0,
            automationsUsed: 0,
            quotaResetAt: now.toISOString(),
          }));
        } else {
          setQuota(parsed);
        }
      }
    } catch (e) {
      logger.warn('Failed to load Miriam quota', { error: e });
    }
  }, []);

  // Persist quota when it changes
  useEffect(() => {
    try {
      localStorage?.setItem?.(STORAGE_KEY, JSON.stringify(quota));
    } catch (e) {
      logger.warn('Failed to save Miriam quota', { error: e });
    }
  }, [quota]);

  const canUseFeature = useCallback(
    (feature: MiriamFeature): boolean => {
      const config = tier[feature];
      if (!config.enabled) return false;
      return true;
    },
    [tier]
  );

  const getUsage = useCallback(
    (feature: MiriamFeature): { used: number; limit: number; percentage: number } => {
      switch (feature) {
        case 'chat':
          return {
            used: quota.dailyMessagesUsed,
            limit: quota.dailyMessagesLimit,
            percentage: quota.dailyMessagesUsed / quota.dailyMessagesLimit,
          };
        case 'pinned_insights':
          return {
            used: quota.pinnedInsightsUsed,
            limit: quota.pinnedInsightsLimit,
            percentage: quota.pinnedInsightsUsed / quota.pinnedInsightsLimit,
          };
        case 'automations':
          return {
            used: quota.automationsUsed,
            limit: quota.automationsLimit,
            percentage: quota.automationsUsed / quota.automationsLimit,
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
        case 'pinned_insights':
          return { ...s, pinnedInsightsUsed: s.pinnedInsightsUsed + 1 };
        case 'automations':
          return { ...s, automationsUsed: s.automationsUsed + 1 };
        default:
          return s;
      }
    });
  }, []);

  return {
    isPro,
    canUseFeature,
    getUsage,
    isNearLimit,
    incrementUsage,
    quota,
  };
}
