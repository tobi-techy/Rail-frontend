import apiClient from '../client';

export const chainrailsService = {
  async createSession(amount: string): Promise<{ sessionToken: string; amount?: string }> {
    return apiClient.post('/v1/funding/chainrails/session', { amount });
  },
};
