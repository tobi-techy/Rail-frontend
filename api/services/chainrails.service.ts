import apiClient from '../client';

export const chainrailsService = {
  async createSession(
    amount: string
  ): Promise<{ sessionToken: string; sessionId: string; expiresAt?: string; amount: string }> {
    const res = await apiClient.post<{
      data: { sessionToken: string; sessionId: string; expiresAt?: string; amount: string };
    }>('/v1/funding/chainrails/session', { amount });
    return res.data;
  },
};
