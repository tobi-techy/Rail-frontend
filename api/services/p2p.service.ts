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
  idempotencyKey?: string;
}

export interface TapIntentRequest {
  recipientRailtag: string;
  amount: string;
}

export interface TapIntentResponse {
  nonce: string;
  recipientId: string;
  expiresAt: string;
}

export interface TapConfirmRequest {
  nonce: string;
  idempotencyKey: string;
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

  async getTransfers(): Promise<P2PTransfer[]> {
    const res = await apiClient.get<{ transfers: P2PTransfer[] }>('/v1/p2p/transfers');
    return res?.transfers ?? [];
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

  async tapIntent(data: TapIntentRequest): Promise<TapIntentResponse> {
    return apiClient.post<TapIntentResponse>('/v1/p2p/tap/intent', data);
  },

  async tapConfirm(data: TapConfirmRequest): Promise<P2PSendResponse> {
    return apiClient.post<P2PSendResponse>('/v1/p2p/tap/confirm', data);
  },
};
