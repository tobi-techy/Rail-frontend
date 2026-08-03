import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import {
  OneSignal,
  NotificationClickEvent,
  NotificationWillDisplayEvent,
} from 'react-native-onesignal';
import apiClient from '@/api/client';
import { queryKeys } from '@/api/queryClient';
import { logger } from '@/lib/logger';
import { useWithdrawalEventStore } from '@/stores/withdrawalEventStore';

export type PushNotificationData = {
  type?: string;
  screen?: string;
  id?: string;
  [key: string]: unknown;
};

const ONESIGNAL_EXTERNAL_ID_ALIAS = 'external_id';

class PushNotificationService {
  private expoPushToken: string | null = null;
  private foregroundListener: ((event: NotificationWillDisplayEvent) => void) | null = null;
  private clickListener: ((event: NotificationClickEvent) => void) | null = null;

  async initialize(userId: string | null): Promise<string | null> {
    if (!Device.isDevice) {
      logger.debug('Push notifications require a physical device', {
        component: 'PushNotifications',
      });
      return null;
    }

    // OneSignal transport. Guarded so a missing app id (dashboard not set up
    // yet) falls back to the legacy Expo permission flow below.
    const onesignalAppId = Constants.expoConfig?.extra?.onesignalAppId;
    if (onesignalAppId) {
      try {
        OneSignal.initialize(onesignalAppId);

        const granted = await OneSignal.Notifications.requestPermission(true);
        if (!granted) {
          logger.debug('Push notification permission denied', { component: 'PushNotifications' });
          return null;
        }

        // OneSignal routes pushes via include_external_user_ids: [RAIL user UUID],
        // so the external_id alias must match the user id.
        if (userId) {
          OneSignal.User.addAlias(ONESIGNAL_EXTERNAL_ID_ALIAS, userId);
        }
      } catch (error) {
        logger.error('Failed to initialize OneSignal', {
          component: 'PushNotifications',
          error: error instanceof Error ? error.message : error,
        });
      }
    } else {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logger.debug('Push notification permission denied', { component: 'PushNotifications' });
        return null;
      }
    }

    // Get the Expo push token — the backend delivers via OneSignal
    // (PUSH_PROVIDER=onesignal) but the Expo token is kept in flight during the
    // dual-registration rollback window (PUSH_PROVIDER=expo fallback).
    try {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      const tokenResponse = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
      this.expoPushToken = tokenResponse.data;

      logger.debug('Got Expo push token', {
        component: 'PushNotifications',
        tokenPrefix:
          typeof tokenResponse.data === 'string'
            ? tokenResponse.data.substring(0, 24) + '...'
            : 'unknown',
      });

      // Android-specific channel setup
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      return this.expoPushToken;
    } catch (error) {
      logger.error('Failed to get push token', {
        component: 'PushNotifications',
        error: error instanceof Error ? error.message : error,
      });
      return null;
    }
  }

  private async setupAndroidChannels() {
    await Notifications.setNotificationChannelAsync('deposits', {
      name: 'Deposits',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
    });

    await Notifications.setNotificationChannelAsync('withdrawals', {
      name: 'Withdrawals',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F59E0B',
    });

    await Notifications.setNotificationChannelAsync('security', {
      name: 'Security Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#EF4444',
    });

    await Notifications.setNotificationChannelAsync('general', {
      name: 'General',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  async registerTokenWithBackend(token: string): Promise<void> {
    try {
      await apiClient.post('/v1/devices/token', {
        token,
        platform: Platform.OS,
        app_version: Constants.expoConfig?.version,
        device_model: Device.modelName,
        os_version: Device.osVersion,
      });
      logger.debug('Push token registered with backend', { component: 'PushNotifications' });
    } catch (error) {
      logger.warn('Failed to register push token', {
        component: 'PushNotifications',
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  async unregisterToken(): Promise<void> {
    if (!this.expoPushToken) return;

    try {
      await apiClient.delete('/v1/devices/token', {
        data: { token: this.expoPushToken },
      });
      this.expoPushToken = null;
    } catch (error) {
      logger.error('Failed to unregister push token', {
        component: 'PushNotifications',
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  setupListeners(queryClient?: import('@tanstack/react-query').QueryClient) {
    // Handle notifications received while app is foregrounded
    const foregroundListener = (event: NotificationWillDisplayEvent) => {
      const data = (event.notification.additionalData ?? {}) as PushNotificationData;
      event.preventDefault();
      if (queryClient) {
        this.invalidateForType(data.type, queryClient, data);
      }
      event.notification.display();
    };

    // Handle notification taps
    const clickListener = (event: NotificationClickEvent) => {
      this.handleNotificationTap((event.notification.additionalData ?? {}) as PushNotificationData);
    };

    OneSignal.Notifications.addEventListener('foregroundWillDisplay', foregroundListener);
    OneSignal.Notifications.addEventListener('click', clickListener);

    this.foregroundListener = foregroundListener;
    this.clickListener = clickListener;
  }

  private invalidateForType(
    type: string | undefined,
    qc: import('@tanstack/react-query').QueryClient,
    data?: PushNotificationData
  ) {
    switch (type) {
      case 'deposit_confirmed':
      case 'allocation_complete':
      case 'allocation_failed':
        qc.invalidateQueries({ queryKey: queryKeys.station.all });
        qc.invalidateQueries({ queryKey: queryKeys.wallet.all });
        qc.invalidateQueries({ queryKey: queryKeys.funding.all });
        qc.invalidateQueries({ queryKey: queryKeys.allocation.all });
        qc.invalidateQueries({ queryKey: queryKeys.gameplay.all });
        // Snap the RampHub WaitingStep to "completed" immediately instead of
        // waiting for the next 8-second poll.
        qc.invalidateQueries({ queryKey: ['ramp'] });
        break;
      case 'investment_complete':
        qc.invalidateQueries({ queryKey: queryKeys.investment.all });
        qc.invalidateQueries({ queryKey: queryKeys.station.all });
        break;
      case 'withdrawal_completed':
      case 'withdrawal_failed':
      case 'offramp_success':
      case 'offramp_failure':
        qc.invalidateQueries({ queryKey: queryKeys.station.all });
        qc.invalidateQueries({ queryKey: queryKeys.wallet.all });
        qc.invalidateQueries({ queryKey: queryKeys.funding.all });
        // Dispatch to the withdrawal event store so any in-app pending screen
        // can flip to success/failed without the user having to poll.
        if (
          data &&
          (type === 'withdrawal_completed' || type === 'withdrawal_failed') &&
          typeof data.withdrawal_id === 'string' &&
          data.withdrawal_id
        ) {
          useWithdrawalEventStore.getState().dispatch({
            withdrawalId: data.withdrawal_id as string,
            status: type === 'withdrawal_completed' ? 'completed' : 'failed',
          });
        }
        break;
      case 'kyc_approved':
      case 'kyc_rejected':
        qc.invalidateQueries({ queryKey: queryKeys.user.all });
        break;
      case 'card_transaction':
        qc.invalidateQueries({ queryKey: queryKeys.station.all });
        qc.invalidateQueries({ queryKey: queryKeys.wallet.all });
        break;
      case 'p2p_claimed':
      case 'p2p_received':
        qc.invalidateQueries({ queryKey: queryKeys.station.all });
        qc.invalidateQueries({ queryKey: queryKeys.wallet.all });
        break;
      case 'spending_warning':
      case 'spending_critical':
      case 'spending_depleted':
      case 'transaction_declined':
        qc.invalidateQueries({ queryKey: queryKeys.station.all });
        break;
      case 'level_up':
      case 'challenge_complete':
      case 'achievement_unlocked':
      case 'streak_warning':
      case 'financial_insight':
        qc.invalidateQueries({ queryKey: queryKeys.gameplay.all });
        qc.invalidateQueries({ queryKey: queryKeys.station.all });
        break;
      case 'spending_alert':
      case 'budget_pace_alert':
      case 'cash_runway_alert':
      case 'idle_money':
      case 'savings_milestone':
      case 'weekly_digest':
      case 'month_recap':
      case 'morning_greeting':
        qc.invalidateQueries({ queryKey: queryKeys.station.all });
        qc.invalidateQueries({ queryKey: queryKeys.wallet.all });
        break;
      case 'automation':
        qc.invalidateQueries({ queryKey: queryKeys.station.all });
        qc.invalidateQueries({ queryKey: queryKeys.wallet.all });
        break;
      case 'subscription_expired':
      case 'subscription_past_due':
        qc.invalidateQueries({ queryKey: queryKeys.gameplay.all });
        break;
    }
    // Always refresh notification bell
    qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
  }

  private handleNotificationTap(data: PushNotificationData) {
    const { type, screen } = data;

    switch (type) {
      case 'deposit_confirmed':
      case 'deposit':
        router.push('/(tabs)');
        break;
      case 'allocation_complete':
        router.push('/(tabs)');
        break;
      case 'allocation_failed':
        router.push('/notifications');
        break;
      case 'investment_complete':
      case 'milestone':
        router.push('/investment-stash');
        break;
      case 'kyc_approved':
      case 'kyc_rejected':
      case 'kyc':
        router.push('/kyc' as any);
        break;
      case 'withdrawal_completed':
      case 'withdrawal_failed':
      case 'offramp_success':
      case 'offramp_failure':
        router.push('/spending-stash');
        break;
      case 'card_transaction':
        router.push('/card');
        break;
      case 'p2p_claimed':
      case 'p2p_received':
        router.push('/spending-stash');
        break;
      case 'spending_warning':
      case 'spending_critical':
      case 'spending_depleted':
      case 'transaction_declined':
        router.push('/spending-stash');
        break;
      case 'security':
        router.push('/(tabs)/settings');
        break;
      case 'level_up':
      case 'challenge_complete':
      case 'achievement_unlocked':
      case 'streak_warning':
      case 'financial_insight':
        router.push('/gameplay' as never);
        break;
      case 'subscription_expired':
      case 'subscription_past_due':
        router.push('/subscription' as never);
        break;
      case 'morning_greeting':
        router.push('/(tabs)' as never);
        break;
      case 'automation':
      case 'spending_alert':
      case 'budget_pace_alert':
      case 'cash_runway_alert':
      case 'idle_money':
      case 'savings_milestone':
      case 'weekly_digest':
      case 'month_recap': {
        const preloaded = typeof data.preloaded_message === 'string' ? data.preloaded_message : '';
        if (preloaded) {
          router.push({ pathname: '/ai-chat', params: { preloaded_message: preloaded } } as any);
        } else {
          router.push('/ai-chat' as never);
        }
        break;
      }

      default:
        // SECURITY FIX (R4-H1): Validate screen against allowlist to prevent
        // arbitrary navigation via crafted push notification payloads.
        const SAFE_SCREENS = new Set([
          '/notifications',
          '/(tabs)',
          '/(tabs)/settings',
          '/ai-chat',
          '/spending-stash',
          '/investment-stash',
          '/kyc',
          '/card',
          '/gameplay',
          '/subscription',
          '/market',
        ]);
        const target =
          typeof screen === 'string' && SAFE_SCREENS.has(screen) ? screen : '/notifications';
        const preloadedMsg =
          typeof data.preloaded_message === 'string' ? data.preloaded_message : '';
        if (target === '/ai-chat' && preloadedMsg) {
          router.push({ pathname: '/ai-chat', params: { preloaded_message: preloadedMsg } } as any);
        } else {
          router.push(target as any);
        }
    }
  }

  removeListeners() {
    if (this.foregroundListener) {
      OneSignal.Notifications.removeEventListener('foregroundWillDisplay', this.foregroundListener);
      this.foregroundListener = null;
    }
    if (this.clickListener) {
      OneSignal.Notifications.removeEventListener('click', this.clickListener);
      this.clickListener = null;
    }
  }

  removeUserAlias(): void {
    OneSignal.User.removeAlias(ONESIGNAL_EXTERNAL_ID_ALIAS);
  }

  getToken(): string | null {
    return this.expoPushToken;
  }

  async getBadgeCount(): Promise<number> {
    return Notifications.getBadgeCountAsync();
  }

  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }
}

export const pushNotificationService = new PushNotificationService();
