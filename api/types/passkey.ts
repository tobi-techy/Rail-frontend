// ============= Passkey Management Types =============

export interface PasskeyCredential {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  deviceType: string;
  backedUp: boolean;
}

export interface ListPasskeysResponse {
  credentials: PasskeyCredential[];
}

export interface BeginPasskeyRegistrationResponse {
  options: Record<string, any>;
  sessionId: string;
}

export interface FinishPasskeyRegistrationRequest {
  sessionId: string;
  response: Record<string, any>;
  name?: string;
}

export interface FinishPasskeyRegistrationResponse {
  message: string;
  name: string;
}

export interface DeletePasskeyResponse {
  message: string;
}
