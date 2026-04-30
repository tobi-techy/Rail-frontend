import { useQuery } from '@tanstack/react-query';
import { activityService } from '../services/activity.service';
import { useAuthStore } from '../../stores/authStore';

export function useActivityFeed(limit = 20, offset = 0) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['activity', 'feed', { limit, offset }],
    queryFn: () => activityService.getActivityFeed(limit, offset),
    enabled: isAuthenticated,
    staleTime: 15_000,
    refetchOnMount: 'always' as const,
    refetchInterval: 30_000,
  });
}
