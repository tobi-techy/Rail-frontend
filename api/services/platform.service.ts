/**
 * Platform linking API — connect Miriam to a messaging channel (iMessage /
 * WhatsApp). The user requests a token, texts it to the bridge, and the bridge
 * binds their real sender id to their Rail account.
 */
import apiClient from '../client';
import type { InitiateLinkResponse, LinkedIdentity, PlatformType } from '../types/platform';

const BASE = '/v1/platform';

export const platformService = {
  async initiateLink(platform: PlatformType): Promise<InitiateLinkResponse> {
    return apiClient.post<InitiateLinkResponse>(`${BASE}/link`, { platform });
  },

  async listLinked(): Promise<LinkedIdentity[]> {
    const res = await apiClient.get<any>(`${BASE}/linked`);
    if (Array.isArray(res)) return res as LinkedIdentity[];
    if (Array.isArray(res?.identities)) return res.identities as LinkedIdentity[];
    if (Array.isArray(res?.data)) return res.data as LinkedIdentity[];
    return [];
  },

  async unlink(platform: PlatformType): Promise<void> {
    await apiClient.delete(`${BASE}/${platform}`);
  },
};

export default platformService;
