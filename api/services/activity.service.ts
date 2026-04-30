import apiClient from '../client';
import type { ActivityFeedResponse } from '../types/activity';

export const activityService = {
  async getActivityFeed(limit = 20, offset = 0): Promise<ActivityFeedResponse> {
    return apiClient.get<ActivityFeedResponse>('/v1/activity', {
      params: { limit, offset },
    });
  },
};
