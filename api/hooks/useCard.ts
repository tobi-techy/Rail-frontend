import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryClient';
import { cardService } from '../services/card.service';
import { useAuthStore } from '../../stores/authStore';
import type { CardDetails, CreateCardRequest } from '../types/card';

export function useCards() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.card.list(),
    queryFn: () => cardService.getCards(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

export function useCard(id: string | undefined) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.card.detail(id!),
    queryFn: () => cardService.getCard(id!),
    enabled: isAuthenticated && !!id,
    staleTime: 60 * 1000,
  });
}

export function useCardTransactions(params?: { limit?: number; offset?: number }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.card.transactions(params),
    queryFn: () => cardService.getTransactions(params),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
}

export function useCreateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateCardRequest) => cardService.createCard(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.card.all });
    },
  });
}

export function useFreezeCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cardService.freezeCard(id),
    onSuccess: (_data, id) => {
      qc.setQueryData<{ cards: CardDetails[]; total: number }>(queryKeys.card.list(), (old) => {
        if (!old) return old;
        return {
          ...old,
          cards: old.cards.map((c) => (c.id === id ? { ...c, status: 'frozen' as const } : c)),
        };
      });
    },
  });
}

export function useUnfreezeCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cardService.unfreezeCard(id),
    onSuccess: (_data, id) => {
      qc.setQueryData<{ cards: CardDetails[]; total: number }>(queryKeys.card.list(), (old) => {
        if (!old) return old;
        return {
          ...old,
          cards: old.cards.map((c) => (c.id === id ? { ...c, status: 'active' as const } : c)),
        };
      });
    },
  });
}
