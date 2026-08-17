import { useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { pushNotificationService } from '@/services/pushNotifications';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryClient';
import { logger } from '@/lib/logger';

export function usePushNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const pushEnabled = useUIStore((s) => s.pushNotificationsEnabled);
  const queryClient = useQueryClient();
  const isInitialized = useRef(false);

  const initializePush = useCallback(async () => {
    if (isInitialized.current) return;

    const token = await pushNotificationService.initialize(user?.id ?? null);
    if (token && isAuthenticated) {
      await pushNotificationService.registerTokenWithBackend(token);
      isInitialized.current = true;
    }

    pushNotificationService.setupListeners(queryClient);
  }, [isAuthenticated, user?.id, queryClient]);

  const teardown = useCallback(async () => {
    if (!isInitialized.current) return;
    pushNotificationService.removeUserAlias();
    await pushNotificationService.unregisterToken();
    pushNotificationService.removeListeners();
    isInitialized.current = false;
  }, []);

  // Initialize on mount when authenticated AND push enabled
  useEffect(() => {
    if (isAuthenticated && pushEnabled) {
      initializePush();
    }

    return () => {
      if (isAuthenticated === false) {
        teardown();
      }
    };
  }, [isAuthenticated, pushEnabled, initializePush, teardown]);

  // Teardown when user disables push while already initialized
  useEffect(() => {
    if (isAuthenticated && !pushEnabled && isInitialized.current) {
      logger.info('Push notifications disabled by user, tearing down', {
        component: 'usePushNotifications',
      });
      teardown();
    }
  }, [isAuthenticated, pushEnabled, teardown]);

  // Re-initialize when user re-enables push while authenticated
  useEffect(() => {
    if (isAuthenticated && pushEnabled && !isInitialized.current) {
      logger.info('Push notifications re-enabled by user, initializing', {
        component: 'usePushNotifications',
      });
      initializePush();
    }
  }, [isAuthenticated, pushEnabled, initializePush]);

  // Handle app state changes - refresh notifications when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isAuthenticated && pushEnabled) {
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
        pushNotificationService.clearBadge();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isAuthenticated, pushEnabled, queryClient]);

  return {
    getToken: () => pushNotificationService.getToken(),
    clearBadge: () => pushNotificationService.clearBadge(),
  };
}
