import apiClient from '../client';
import type { VirtualAccount } from '../types/funding';

interface VirtualAccountListResponse {
  virtual_accounts: VirtualAccount[];
  total: number;
}

export const virtualAccountService = {
  getVirtualAccounts: () =>
    apiClient.get<VirtualAccountListResponse>('/v1/funding/virtual-accounts'),
};
