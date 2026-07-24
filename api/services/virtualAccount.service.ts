import apiClient from '../client';
import type {
  VirtualAccount,
  CreateVirtualAccountResponse,
  NgnVirtualAccountResponse,
  ProvisionNgnAccountRequest,
} from '../types/funding';

interface VirtualAccountListResponse {
  virtual_accounts: VirtualAccount[];
  total: number;
}

function isNotFoundError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'status' in error &&
    (error as { status?: number }).status === 404
  );
}

export const virtualAccountService = {
  getVirtualAccounts: () =>
    apiClient.get<VirtualAccountListResponse>('/v1/funding/virtual-accounts'),
  createVirtualAccount: (currency: 'USD' | 'EUR' | 'GBP' | 'NGN') =>
    apiClient.post<CreateVirtualAccountResponse>('/v1/funding/virtual-account', { currency }),
  getTOSLink: () => apiClient.get<{ tos_link: string }>('/v1/funding/tos-link'),

  /** Named NGN account (Graph). Returns null when not yet provisioned (404). */
  async getNgnVirtualAccount(): Promise<NgnVirtualAccountResponse | null> {
    try {
      return await apiClient.get<NgnVirtualAccountResponse>('/v1/funding/ngn/virtual-account');
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  },

  /** Provision the named NGN account. Idempotent — a duplicate returns the existing account. */
  provisionNgnVirtualAccount: (req: ProvisionNgnAccountRequest) =>
    apiClient.post<NgnVirtualAccountResponse>('/v1/funding/ngn/virtual-account', {
      id_type: 'nin',
      ...req,
    }),

  /** Auto-provision NGN account — checks Graph person verification and creates bank account. Zero user input. */
  autoProvisionNgn: () =>
    apiClient.post<NgnVirtualAccountResponse>('/v1/funding/ngn/auto-provision'),
};
