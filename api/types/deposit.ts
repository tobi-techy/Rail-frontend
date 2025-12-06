// ============= Deposit Types =============

export interface GetDepositAddressRequest {
  tokenId: string;
  network: string;
}

export interface GetDepositAddressResponse {
  address: string;
  network: string;
  qrCode: string;
  memo?: string;
  minimumDeposit?: string;
}
