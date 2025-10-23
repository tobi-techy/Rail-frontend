/**
 * User Hooks
 * React Query hooks for user, settings, and notifications
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services';
import { queryKeys, invalidateQueries } from '../queryClient';
import type {
  UpdateSettingsRequest,
  KYCVerificationRequest,
  GetNotificationsRequest,
  MarkNotificationReadRequest,
  Verify2FARequest,
  RemoveDeviceRequest,
  User,
} from '../types';

/**
 * Get user profile
 */
export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: () => userService.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Update user profile mutation
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<User>) => userService.updateProfile(data),
    onSuccess: (updatedProfile) => {
      // Update cached profile
      queryClient.setQueryData(queryKeys.user.profile(), updatedProfile);
    },
  });
}

/**
 * Get user settings
 */
export function useUserSettings() {
  return useQuery({
    queryKey: queryKeys.user.settings(),
    queryFn: () => userService.getSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Update user settings mutation
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSettingsRequest) => userService.updateSettings(data),
    onSuccess: (updatedSettings) => {
      // Update cached settings
      queryClient.setQueryData(queryKeys.user.settings(), updatedSettings);
    },
  });
}

/**
 * Submit KYC verification mutation
 */
export function useSubmitKYC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: KYCVerificationRequest) => userService.submitKYC(data),
    onSuccess: () => {
      // Invalidate KYC status to fetch latest
      queryClient.invalidateQueries({ queryKey: queryKeys.user.kycStatus() });
    },
  });
}

/**
 * Get KYC status
 */
export function useKYCStatus() {
  return useQuery({
    queryKey: queryKeys.user.kycStatus(),
    queryFn: () => userService.getKYCStatus(),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Get notifications
 */
export function useNotifications(params?: GetNotificationsRequest) {
  return useQuery({
    queryKey: queryKeys.user.notifications(params),
    queryFn: () => userService.getNotifications(params),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Mark notifications as read mutation
 */
export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MarkNotificationReadRequest) => 
      userService.markNotificationsRead(data),
    onSuccess: () => {
      // Invalidate notifications to refresh
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
    },
  });
}

/**
 * Enable 2FA mutation
 */
export function useEnable2FA() {
  return useMutation({
    mutationFn: () => userService.enable2FA(),
  });
}

/**
 * Verify 2FA mutation
 */
export function useVerify2FA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Verify2FARequest) => userService.verify2FA(data),
    onSuccess: () => {
      // Invalidate settings to refresh 2FA status
      queryClient.invalidateQueries({ queryKey: queryKeys.user.settings() });
    },
  });
}

/**
 * Disable 2FA mutation
 */
export function useDisable2FA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => userService.disable2FA(code),
    onSuccess: () => {
      // Invalidate settings to refresh 2FA status
      queryClient.invalidateQueries({ queryKey: queryKeys.user.settings() });
    },
  });
}

/**
 * Get user devices
 */
export function useDevices() {
  return useQuery({
    queryKey: queryKeys.user.devices(),
    queryFn: () => userService.getDevices(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Remove device mutation
 */
export function useRemoveDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RemoveDeviceRequest) => userService.removeDevice(data),
    onSuccess: () => {
      // Invalidate devices to refresh list
      queryClient.invalidateQueries({ queryKey: queryKeys.user.devices() });
    },
  });
}
