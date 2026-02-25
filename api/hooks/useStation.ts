/**
 * Station Hooks
 * React Query hook for home screen data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { stationService } from '../services/station.service';
import { queryKeys } from '../queryClient';
import type { StationResponse } from '../types';

const STATION_CACHE_KEY = '@rail:station-cache:v1';
let inMemoryStationCache: StationResponse | null = null;
let stationCacheHydrated = false;

const parseStationCache = (raw: string | null): StationResponse | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StationResponse;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.total_balance !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
};

/**
 * Get station (home screen) data: balances, trends, recent activity, alerts.
 *
 * Optimized for fast UX:
 * - 10s stale time (very aggressive for balance visibility)
 * - 40s auto-refetch (more frequent than before)
 * - Refetch on window focus (update when user opens app)
 * - Refetch on reconnect (update when connection restored)
 * - Shows cached balance immediately on load (no zero flash)
 */
export function useStation() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (stationCacheHydrated) return;
    stationCacheHydrated = true;

    let cancelled = false;
    (async () => {
      const cached = parseStationCache(await AsyncStorage.getItem(STATION_CACHE_KEY));
      if (cancelled || !cached) return;

      inMemoryStationCache = cached;
      if (!queryClient.getQueryData(queryKeys.station.home())) {
        queryClient.setQueryData(queryKeys.station.home(), cached);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  const query = useQuery({
    queryKey: queryKeys.station.home(),
    queryFn: () => stationService.getStation(),
    placeholderData: () =>
      (queryClient.getQueryData(queryKeys.station.home()) as StationResponse | undefined) ??
      inMemoryStationCache ??
      undefined,
    staleTime: 10 * 1000, // 10 seconds - aggressive cache for balance visibility
    refetchInterval: 40 * 1000, // Refetch every 40 seconds (more frequent)
    refetchOnMount: 'always',
    refetchOnWindowFocus: true, // Update when user brings app to foreground
    refetchOnReconnect: true, // Update when network connection restored
    retry: (failureCount, error: any) => {
      const code = error?.error?.code;
      if (code === 'HTTP_401' || code === 'HTTP_404') return false;
      return failureCount < 1;
    },
  });

  useEffect(() => {
    if (!query.data) return;
    inMemoryStationCache = query.data;
    void AsyncStorage.setItem(STATION_CACHE_KEY, JSON.stringify(query.data));
  }, [query.data]);

  return query;
}
