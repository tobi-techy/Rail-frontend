import apiClient from '../client';
import type { SpendingStashResponse } from '../types/spending';

export const spendingService = {
  async getSpendingStash(): Promise<SpendingStashResponse> {
    return apiClient.get<SpendingStashResponse>('/v1/account/spending-stash');
  },
};
