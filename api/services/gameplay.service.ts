/**
 * Gameplay API Service
 * Handles streaks, XP, challenges, achievements, and subscription
 */

import apiClient from '../client';
import { ENDPOINTS } from '../config';

export interface GameplayProfile {
  level: number;
  level_title: string;
  total_xp: number;
  xp_progress_pct: number;
  next_level_xp: number;
  streaks: Streak[];
  active_challenges: UserChallenge[];
  achievements_earned: number;
  achievements_total: number;
}

export interface Streak {
  id: string;
  streak_type: 'deposit' | 'no_spend' | 'stash_growth' | 'roundup';
  current_count: number;
  longest_count: number;
  last_activity_at: string | null;
}

export interface UserChallenge {
  id: string;
  challenge_id: string;
  progress: number;
  status: 'active' | 'completed' | 'expired';
  challenge?: {
    title: string;
    description: string;
    target_value: number;
    xp_reward: number;
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  icon: string;
  unlocked: boolean;
}

export interface XPEvent {
  id: string;
  event_type: string;
  xp_amount: number;
  description: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  plan: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  current_period_end: string;
}

export interface SubscriptionResponse {
  subscription: Subscription | null;
  is_pro: boolean;
}

export const gameplayService = {
  async getProfile(): Promise<GameplayProfile> {
    return apiClient.get<GameplayProfile>(ENDPOINTS.GAMEPLAY.PROFILE);
  },

  async getStreaks(): Promise<{ streaks: Streak[] }> {
    return apiClient.get(ENDPOINTS.GAMEPLAY.STREAKS);
  },

  async getXP(): Promise<{
    total_xp: number;
    level: number;
    level_title: string;
    next_level_xp: number;
  }> {
    return apiClient.get(ENDPOINTS.GAMEPLAY.XP);
  },

  async getXPHistory(limit = 20, offset = 0): Promise<{ events: XPEvent[] }> {
    return apiClient.get(ENDPOINTS.GAMEPLAY.XP_HISTORY, { params: { limit, offset } });
  },

  async getChallenges(): Promise<{ challenges: UserChallenge[] }> {
    return apiClient.get(ENDPOINTS.GAMEPLAY.CHALLENGES);
  },

  async getAchievements(): Promise<{ achievements: Achievement[] }> {
    return apiClient.get(ENDPOINTS.GAMEPLAY.ACHIEVEMENTS);
  },

  async getSubscription(): Promise<SubscriptionResponse> {
    return apiClient.get(ENDPOINTS.SUBSCRIPTION.STATUS);
  },

  async subscribe(): Promise<{ subscription: Subscription }> {
    return apiClient.post(ENDPOINTS.SUBSCRIPTION.SUBSCRIBE);
  },

  async cancelSubscription(): Promise<{ message: string }> {
    return apiClient.delete(ENDPOINTS.SUBSCRIPTION.CANCEL);
  },
};

export default gameplayService;
