import apiClient from '../client';
import type { VirtualAccount, CreateVirtualAccountResponse } from '../types/funding';

interface VirtualAccountListResponse {
  virtual_accounts: VirtualAccount[];
  total: number;
}

export const virtualAccountService = {
  getVirtualAccounts: () =>
    apiClient.get<VirtualAccountListResponse>('/v1/funding/virtual-accounts'),
  createVirtualAccount: (currency: 'USD' | 'EUR' | 'GBP') =>
    apiClient.post<CreateVirtualAccountResponse>('/v1/funding/virtual-account', { currency }),
  getTOSLink: () => apiClient.get<{ tos_link: string }>('/v1/funding/tos-link'),
};
