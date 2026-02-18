import apiClient from '../client';
import type {
  CreateVirtualAccountResponse,
  DepositsResponse,
  Withdrawal,
  InitiateWithdrawalRequest,
  InitiateFiatWithdrawalRequest,
  InitiateWithdrawalResponse,
} from '../types';

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
    return apiClient.get<Withdrawal[]>('/v1/withdrawals', {
      params: { limit, offset },
    });
  },

  // Crypto withdrawal (USDC to external Solana wallet)
  async initiateWithdrawal(req: InitiateWithdrawalRequest): Promise<InitiateWithdrawalResponse> {
    return apiClient.post<InitiateWithdrawalResponse>('/v1/withdrawals/crypto', {
      amount: typeof req.amount === 'string' ? parseFloat(req.amount) : req.amount,
      destination_address: req.destination_address,
    });
  },

  // Fiat withdrawal (USDC to bank account via Bridge)
  async initiateFiatWithdrawal(
    req: InitiateFiatWithdrawalRequest
  ): Promise<InitiateWithdrawalResponse> {
    return apiClient.post<InitiateWithdrawalResponse>('/v1/withdrawals/fiat', req);
  },
};

export default fundingService;
