import { useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { pushNotificationService } from '@/services/pushNotifications';
import { useAuthStore } from '@/stores/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryClient';

export function usePushNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  const isInitialized = useRef(false);

  const initializePush = useCallback(async () => {
    if (isInitialized.current) return;

    const token = await pushNotificationService.initialize();
    if (token && isAuthenticated) {
      await pushNotificationService.registerTokenWithBackend(token);
      isInitialized.current = true;
    }

    pushNotificationService.setupListeners();
  }, [isAuthenticated]);

  const cleanup = useCallback(async () => {
    if (isAuthenticated === false && isInitialized.current) {
      await pushNotificationService.unregisterToken();
      isInitialized.current = false;
    }
    pushNotificationService.removeListeners();
  }, [isAuthenticated]);

  // Initialize on mount when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      initializePush();
    }

    return () => {
      cleanup();
    };
  }, [isAuthenticated, initializePush, cleanup]);

  // Handle app state changes - refresh notifications when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isAuthenticated) {
        // Refresh notification count when app becomes active
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
        pushNotificationService.clearBadge();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isAuthenticated, queryClient]);

  return {
    getToken: () => pushNotificationService.getToken(),
    clearBadge: () => pushNotificationService.clearBadge(),
  };
}
