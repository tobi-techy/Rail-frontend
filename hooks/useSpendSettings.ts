import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { useAuthStore } from '@/stores/authStore';

const DEFAULT_BASE_ALLOCATION = 70;
const MIN_BASE_ALLOCATION = 1;
const MAX_BASE_ALLOCATION = 99;

export const clampAlloc = (v: number) =>
  Number.isFinite(v)
    ? Math.min(MAX_BASE_ALLOCATION, Math.max(MIN_BASE_ALLOCATION, Math.round(v)))
    : DEFAULT_BASE_ALLOCATION;

interface RoundupSettings {
  enabled: boolean;
  multiplier: string;
  threshold: string;
  auto_invest_enabled: boolean;
}

export function useSpendSettings() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const qc = useQueryClient();

  const { data: settings } = useQuery<RoundupSettings>({
    queryKey: ['roundups', 'settings'],
    queryFn: () => apiClient.get<RoundupSettings>('/v1/roundups/settings'),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: (patch: Partial<{ enabled: boolean; auto_invest_enabled: boolean }>) =>
      apiClient.put<RoundupSettings>('/v1/roundups/settings', patch),
    onSuccess: (data) => {
      qc.setQueryData(['roundups', 'settings'], data);
    },
  });

  // Local UI state — kept in sync with server on load
  const [baseAllocation, setBaseAllocation] = useState(DEFAULT_BASE_ALLOCATION);
  const [spendingLimit, setSpendingLimit] = useState(500);

  const roundupsEnabled = settings?.enabled ?? true;
  const autoInvestEnabled = settings?.auto_invest_enabled ?? false;

  const setRoundupsEnabled = useCallback(
    (v: boolean) => updateMutation.mutate({ enabled: v }),
    [updateMutation]
  );

  const setAutoInvestEnabled = useCallback(
    (v: boolean) => updateMutation.mutate({ auto_invest_enabled: v }),
    [updateMutation]
  );

  return {
    baseAllocation,
    setBaseAllocation,
    autoInvestEnabled,
    setAutoInvestEnabled,
    roundupsEnabled,
    setRoundupsEnabled,
    spendingLimit,
    setSpendingLimit,
    MIN_BASE_ALLOCATION,
    MAX_BASE_ALLOCATION,
  };
}
