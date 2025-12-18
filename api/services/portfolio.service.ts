/**
 * Portfolio API Service
 * Handles portfolio-related API calls
 */

import apiClient from '../client';
import type { PortfolioOverview } from '../types';
import { ENDPOINTS } from '../config';

export const portfolioService = {
  /**
   * Get portfolio overview including balance, buying power, and performance
   */
  async getPortfolioOverview(): Promise<PortfolioOverview> {
    return apiClient.get<PortfolioOverview>(ENDPOINTS.PORTFOLIO.OVERVIEW);
  },
};

export default portfolioService;
