/**
 * Gameplay Hooks
 * React Query hooks for streaks, XP, challenges, achievements, subscription
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gameplayService } from '../services/gameplay.service';
import { queryKeys } from '../queryClient';

/** Combined gameplay profile — used on home screen card */
export function useGameplayProfile() {
  return useQuery({
    queryKey: queryKeys.gameplay.profile(),
    queryFn: () => gameplayService.getProfile(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useStreaks() {
  return useQuery({
    queryKey: queryKeys.gameplay.streaks(),
    queryFn: () => gameplayService.getStreaks(),
    staleTime: 30 * 1000,
  });
}

export function useActivityHeatmap() {
  return useQuery({
    queryKey: [...queryKeys.gameplay.all, 'heatmap'],
    queryFn: () => gameplayService.getActivityHeatmap(),
    staleTime: 60 * 1000,
  });
}

export function useChallenges() {
  return useQuery({
    queryKey: queryKeys.gameplay.challenges(),
    queryFn: () => gameplayService.getChallenges(),
    staleTime: 30 * 1000,
  });
}

export function useAchievements() {
  return useQuery({
    queryKey: queryKeys.gameplay.achievements(),
    queryFn: () => gameplayService.getAchievements(),
    staleTime: 60 * 1000,
  });
}

export function useXPHistory(limit = 20, offset = 0) {
  return useQuery({
    queryKey: [...queryKeys.gameplay.xpHistory(), limit, offset],
    queryFn: () => gameplayService.getXPHistory(limit, offset),
    staleTime: 30 * 1000,
  });
}

export function useSubscription() {
  return useQuery({
    queryKey: queryKeys.gameplay.subscription(),
    queryFn: () => gameplayService.getSubscription(),
    staleTime: 60 * 1000,
  });
}

export function useSubscribeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (plan: 'pro_monthly' | 'pro_yearly' = 'pro_monthly') =>
      gameplayService.subscribe(plan),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.gameplay.subscription() });
      qc.invalidateQueries({ queryKey: queryKeys.gameplay.profile() });
      qc.invalidateQueries({ queryKey: queryKeys.station.home() });
    },
  });
}

export function useCancelSubscriptionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => gameplayService.cancelSubscription(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.gameplay.subscription() });
    },
  });
}
