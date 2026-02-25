import apiClient from '../client';
import type {
  CreateVirtualAccountResponse,
  DepositsResponse,
  Withdrawal,
  InitiateWithdrawalRequest,
  InitiateFiatWithdrawalRequest,
  InitiateWithdrawalResponse,
} from '../types';

function isNotFoundError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'status' in error &&
    (error as { status?: number }).status === 404
  );
}

export const fundingService = {
  // Virtual account
  async createVirtualAccount(alpacaAccountId: string): Promise<CreateVirtualAccountResponse> {
    return apiClient.post<CreateVirtualAccountResponse>('/v1/funding/virtual-account', {
      alpaca_account_id: alpacaAccountId,
    });
  },

  // Deposits
  async getDeposits(limit = 20, offset = 0): Promise<DepositsResponse> {
    return apiClient.get<DepositsResponse>('/v1/deposits', {
      params: { limit, offset },
    });
  },

  // Withdrawals
  async getWithdrawals(limit = 20, offset = 0): Promise<Withdrawal[]> {
    const response = await apiClient.get<
      | Withdrawal[]
      | {
          withdrawals?: Withdrawal[];
          items?: Withdrawal[];
          data?: Withdrawal[] | { withdrawals?: Withdrawal[]; items?: Withdrawal[] };
        }
    >('/v1/withdrawals', {
      params: { limit, offset },
    });
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.withdrawals)) return response.withdrawals;
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.withdrawals)) return response.data.withdrawals;
    if (Array.isArray(response?.data?.items)) return response.data.items;
    return [];
  },

  // Crypto withdrawal (USDC to external Solana wallet)
  async initiateWithdrawal(req: InitiateWithdrawalRequest): Promise<InitiateWithdrawalResponse> {
    const payload = {
      amount: typeof req.amount === 'string' ? parseFloat(req.amount) : req.amount,
      destination_address: req.destination_address,
    };

    try {
      return await apiClient.post<InitiateWithdrawalResponse>('/v1/withdrawals/crypto', payload);
    } catch (error) {
      // Compatibility fallback for environments that have not mounted /withdrawals/crypto yet.
      if (isNotFoundError(error)) {
        return apiClient.post<InitiateWithdrawalResponse>('/v1/withdrawals', payload);
      }
      throw error;
    }
  },

  // Fiat withdrawal (USDC to bank account via Bridge)
  async initiateFiatWithdrawal(
    req: InitiateFiatWithdrawalRequest
  ): Promise<InitiateWithdrawalResponse> {
    return apiClient.post<InitiateWithdrawalResponse>('/v1/withdrawals/fiat', req);
  },
};

export default fundingService;
