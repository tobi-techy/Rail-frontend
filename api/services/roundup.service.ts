import apiClient from '../client';

export interface RoundupSettings {
  enabled: boolean;
  daily_limit?: number;
  auto_invest_enabled?: boolean;
}

export const roundupService = {
  getSettings: () => apiClient.get<{ settings: RoundupSettings }>('/v1/roundups/settings'),
  updateSettings: (body: { enabled?: boolean }) =>
    apiClient.put<{ settings: RoundupSettings }>('/v1/roundups/settings', body),
};
