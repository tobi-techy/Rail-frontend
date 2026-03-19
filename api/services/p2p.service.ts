import apiClient from '../client';

export interface P2PUserInfo {
  id: string;
  railTag?: string;
  firstName?: string;
  lastName?: string;
}

export interface P2PLookupResponse {
  found: boolean;
  identifierType: 'railtag' | 'email' | 'phone';
  user?: P2PUserInfo;
  canSend: boolean;
  message?: string;
}

export interface P2PSendRequest {
  identifier: string;
  amount: string;
  note?: string;
}

export interface P2PTransfer {
  id: string;
  recipientIdentifier: string;
  identifierType: string;
  amount: string;
  currency: string;
  note?: string;
  status: 'pending' | 'completed' | 'claimed' | 'expired' | 'cancelled';
  expiresAt: string;
  createdAt: string;
}

export interface P2PSendResponse {
  transfer: P2PTransfer;
  message: string;
}

export interface P2PRecentRecipient {
  recipientId: string;
  railTag?: string;
  firstName?: string;
  lastName?: string;
  lastSentAt: string;
  sendCount: number;
}

export interface SetRailTagResponse {
  railTag: string;
  message: string;
}

export interface CheckRailTagResponse {
  railTag: string;
  available: boolean;
}

export const p2pService = {
  async lookup(identifier: string): Promise<P2PLookupResponse> {
    return apiClient.post<P2PLookupResponse>('/v1/p2p/lookup', { identifier });
  },

  async send(data: P2PSendRequest): Promise<P2PSendResponse> {
    return apiClient.post<P2PSendResponse>('/v1/p2p/send', data);
  },

  async getRecentRecipients(): Promise<P2PRecentRecipient[]> {
    const res = await apiClient.get<{ recipients: P2PRecentRecipient[] }>('/v1/p2p/recent');
    return res?.recipients ?? [];
  },

  async setRailTag(railTag: string): Promise<SetRailTagResponse> {
    return apiClient.post<SetRailTagResponse>('/v1/p2p/railtag', { railTag });
  },

  async checkRailTag(railTag: string): Promise<CheckRailTagResponse> {
    return apiClient.post<CheckRailTagResponse>('/v1/p2p/railtag/check', { railTag });
  },
};
