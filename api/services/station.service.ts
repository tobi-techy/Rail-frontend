/**
 * Station API Service
 * Handles home screen data retrieval
 */

import apiClient from '../client';
import type { StationResponse } from '../types';
import { ENDPOINTS } from '../config';

export const stationService = {
  async getStation(): Promise<StationResponse> {
    return apiClient.get<StationResponse>(ENDPOINTS.ACCOUNT.STATION);
  },
};

export default stationService;
