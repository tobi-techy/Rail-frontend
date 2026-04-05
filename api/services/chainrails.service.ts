import  apiClient  from '../client';

export const chainrailsService = {
  async createSession(amount: string): Promise<{ session_token: string; expires_at?: string }> {
    const res = await apiClient.post<{ data: { session_token: string; expires_at?: string } }>(
      '/v1/funding/chainrails/session',
      { amount }
    );
    return res.data;
  },
};
