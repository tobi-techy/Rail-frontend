/**
 * Portfolio API Service
 * Handles portfolio-related API calls
 */

import apiClient from '../client';
import type {
  PortfolioOverview,
  ApiResponse,
} from '../types';

const PORTFOLIO_ENDPOINTS = {
  OVERVIEW: '/v1/portfolio/overview', // Full path: /api/v1/portfolio/overview (correct)
};

export const portfolioService = {
  /**
   * Get portfolio overview including balance, buying power, and performance
   */
  async getPortfolioOverview(): Promise<PortfolioOverview> {
    return apiClient.get<PortfolioOverview>(PORTFOLIO_ENDPOINTS.OVERVIEW);
  },
};

export default portfolioService;
