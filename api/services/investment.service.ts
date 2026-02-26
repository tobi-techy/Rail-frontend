import apiClient from '../client';
import { ENDPOINTS } from '../config';
import type {
  InvestmentDistributionResponse,
  InvestmentPerformanceResponse,
  InvestmentPeriod,
  InvestmentPositionsResponse,
  InvestmentStashResponse,
  InvestmentTransactionsParams,
  InvestmentTransactionsResponse,
} from '../types/investment';

export const investmentService = {
  async getInvestmentStash(): Promise<InvestmentStashResponse> {
    return apiClient.get<InvestmentStashResponse>(ENDPOINTS.ACCOUNT.INVESTMENT_STASH);
  },

  async getInvestmentPositions(params?: {
    page?: number;
    page_size?: number;
  }): Promise<InvestmentPositionsResponse> {
    return apiClient.get<InvestmentPositionsResponse>(ENDPOINTS.ACCOUNT.INVESTMENT_POSITIONS, {
      params,
    });
  },

  async getInvestmentDistribution(limit = 10): Promise<InvestmentDistributionResponse> {
    return apiClient.get<InvestmentDistributionResponse>(
      ENDPOINTS.ACCOUNT.INVESTMENT_DISTRIBUTION,
      {
        params: { limit },
      }
    );
  },

  async getInvestmentTransactions(
    params?: InvestmentTransactionsParams
  ): Promise<InvestmentTransactionsResponse> {
    return apiClient.get<InvestmentTransactionsResponse>(
      ENDPOINTS.ACCOUNT.INVESTMENT_TRANSACTIONS,
      {
        params,
      }
    );
  },

  async getInvestmentPerformance(
    period: InvestmentPeriod = '1W'
  ): Promise<InvestmentPerformanceResponse> {
    return apiClient.get<InvestmentPerformanceResponse>(ENDPOINTS.ACCOUNT.INVESTMENT_PERFORMANCE, {
      params: { period },
    });
  },
};

export default investmentService;
