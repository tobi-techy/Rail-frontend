import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import apiClient from '@/api/client';
import { logger } from '@/lib/logger';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PushNotificationData = {
  type?: string;
  screen?: string;
  id?: string;
  [key: string]: unknown;
};

class PushNotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: Notifications.EventSubscription | null = null;
  private responseListener: Notifications.EventSubscription | null = null;

  async initialize(): Promise<string | null> {
    if (!Device.isDevice) {
      logger.debug('Push notifications require a physical device', {
        component: 'PushNotifications',
      });
      return null;
    }

    // Request permissions
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

    // Get native device push token (APNs for iOS, FCM for Android)
    // This is required for AWS SNS delivery — Expo tokens only work with Expo's push service
    try {
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      this.expoPushToken = deviceToken.data;

      logger.debug('Got native device push token', {
        component: 'PushNotifications',
        platform: deviceToken.type,
        tokenPrefix:
          typeof deviceToken.data === 'string'
            ? deviceToken.data.substring(0, 20) + '...'
            : 'unknown',
      });

      // Android-specific channel setup
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      return this.expoPushToken;
    } catch (error) {
      console.error('Failed to get push token:', error);
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
      console.warn('Failed to register push token:', error);
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
      console.error('Failed to unregister push token:', error);
    }
  }

  setupListeners(queryClient?: import('@tanstack/react-query').QueryClient) {
    // Handle notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as PushNotificationData;
      if (queryClient) {
        this.invalidateForType(data.type, queryClient);
      }
    });

    // Handle notification taps
    this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as PushNotificationData;
      this.handleNotificationTap(data);
    });
  }

  private invalidateForType(
    type: string | undefined,
    qc: import('@tanstack/react-query').QueryClient
  ) {
    const { queryKeys } = require('@/api/queryClient');
    switch (type) {
      case 'deposit_confirmed':
      case 'allocation_complete':
      case 'allocation_failed':
        qc.invalidateQueries({ queryKey: queryKeys.station.all });
        qc.invalidateQueries({ queryKey: queryKeys.wallet.all });
        qc.invalidateQueries({ queryKey: queryKeys.funding.all });
        qc.invalidateQueries({ queryKey: queryKeys.allocation.all });
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
      default:
        router.push(screen ? (screen as any) : '/notifications');
    }
  }

  removeListeners() {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
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
