import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiService } from '../services/ai.service';
import { queryKeys } from '../queryClient';
import { useAuthStore } from '@/stores/authStore';
import type {
  CreateFinancialObligationRequest,
  StageOperatingPlanActionRequest,
} from '../types/ai';

export function useOperatingPlan() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.ai.operatingPlan(),
    queryFn: () => aiService.getOperatingPlan(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

export function useMoneyAcrossBordersReport() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.ai.moneyAcrossBorders(),
    queryFn: () => aiService.getMoneyAcrossBordersReport(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAutomations() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.ai.automations(),
    queryFn: () => aiService.listAutomations(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

export function useFinancialObligations(params?: { status?: string; type?: string }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.ai.obligations(params),
    queryFn: () => aiService.listFinancialObligations(params),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

export function useStageOperatingPlanAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (req: StageOperatingPlanActionRequest) => aiService.stageOperatingPlanAction(req),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ai.all });
    },
  });
}

export function useCreateFinancialObligation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (req: CreateFinancialObligationRequest) => aiService.createFinancialObligation(req),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ai.obligations() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.ai.operatingPlan() });
    },
  });
}
