import apiClient from '../client';

export const chainrailsService = {
  async createSession(amount: string): Promise<Record<string, any>> {
    return apiClient.post('/v1/funding/chainrails/session', { amount });
  },
};
