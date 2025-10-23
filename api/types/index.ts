/**
 * API Types and Interfaces
 * Centralized type definitions for all API requests and responses
 */

// ============= Common Types =============

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// ============= Authentication Types =============

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface RegisterRequest {
  email?: string;  // Optional: required if phone not provided
  phone?: string;  // Optional: required if email not provided
  password: string;
}

export interface RegisterResponse {
  message: string;
  identifier: string;
}

export interface VerifyCodeRequest {
  email?: string;  // Optional: required if phone not provided
  phone?: string;  // Optional: required if email not provided
  code: string;
}

export interface VerifyCodeResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface ResendCodeRequest {
  email?: string;  // Optional: required if phone not provided
  phone?: string;  // Optional: required if email not provided
}

export interface ResendCodeResponse {
  message: string;
  identifier: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface User {
  id: string;
  email: string;
  phone?: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  kycStatus: 'pending' | 'processing' | 'approved' | 'rejected' | 'expired';
  onboardingStatus: 'started' | 'wallets_pending' | 'kyc_pending' | 'kyc_approved' | 'kyc_rejected' | 'completed';
  createdAt: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ============= Passcode Types =============

export interface PasscodeStatus {
  enabled: boolean;
  locked: boolean;
  failedAttempts: number;
  remainingAttempts: number;
  lockedUntil: string | null;
  updatedAt: string;
}

export interface CreatePasscodeRequest {
  passcode: string;
  confirmPasscode: string;
}

export interface CreatePasscodeResponse {
  message: string;
  status: PasscodeStatus;
}

export interface UpdatePasscodeRequest {
  currentPasscode: string;
  newPasscode: string;
  confirmPasscode: string;
}

export interface UpdatePasscodeResponse {
  message: string;
  status: PasscodeStatus;
}

export interface VerifyPasscodeRequest {
  passcode: string;
}

export interface VerifyPasscodeResponse {
  verified: boolean;
  sessionToken: string;
  expiresAt: string;
}

export interface DeletePasscodeRequest {
  passcode: string;
}

export interface DeletePasscodeResponse {
  message: string;
  status: PasscodeStatus;
}

// ============= Onboarding Types =============

export interface OnboardingStartRequest {
  email: string;
  phone?: string;
}

export interface OnboardingStartResponse {
  userId: string;
  onboardingStatus: string;
  nextStep: string;
  sessionToken?: string;
}

export interface OnboardingStatusResponse {
  userId: string;
  onboardingStatus: string;
  kycStatus: string;
  currentStep: string;
  completedSteps: string[];
  walletStatus: {
    totalWallets: number;
    createdWallets: number;
    pendingWallets: number;
    failedWallets: number;
    supportedChains: string[];
    walletsByChain: Record<string, string>;
  };
  canProceed: boolean;
  requiredActions: string[];
}

// ============= Wallet Types =============

export interface Token {
  id: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  usdValue: string;
  priceChange24h: number;
  network: string;
  contractAddress?: string;
  logoUrl?: string;
}

export interface WalletBalance {
  totalBalanceUSD: string;
  tokens: Token[];
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap' | 'deposit' | 'withdraw';
  tokenId: string;
  amount: string;
  usdAmount: string;
  from: string;
  to: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  txHash?: string;
  fee?: string;
  network: string;
  confirmations?: number;
}

export interface GetTransactionsRequest extends PaginationParams {
  type?: Transaction['type'];
  status?: Transaction['status'];
  tokenId?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetTransactionsResponse extends PaginatedResponse<Transaction> {}

// ============= Transfer/Withdrawal Types =============

export interface CreateTransferRequest {
  tokenId: string;
  toAddress: string;
  amount: string;
  network: string;
  memo?: string;
}

export interface CreateTransferResponse {
  transaction: Transaction;
  estimatedFee: string;
  estimatedTime: string;
}

export interface ValidateAddressRequest {
  address: string;
  network: string;
}

export interface ValidateAddressResponse {
  valid: boolean;
  addressType?: 'wallet' | 'contract' | 'ens';
  resolvedAddress?: string;
}

export interface EstimateFeeRequest {
  tokenId: string;
  toAddress: string;
  amount: string;
  network: string;
}

export interface EstimateFeeResponse {
  fee: string;
  feeUSD: string;
  estimatedTime: string;
}

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

// ============= Price Types =============

export interface TokenPrice {
  tokenId: string;
  symbol: string;
  price: string;
  priceChange24h: number;
  marketCap?: string;
  volume24h?: string;
  updatedAt: string;
}

export interface GetPricesRequest {
  tokenIds: string[];
  currency?: string;
}

export interface GetPricesResponse {
  prices: TokenPrice[];
}

// ============= Network Types =============

export interface Network {
  id: string;
  name: string;
  symbol: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  isTestnet: boolean;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface GetNetworksResponse {
  networks: Network[];
}

// ============= KYC Types =============

export interface KYCVerificationRequest {
  documentType: 'passport' | 'drivers_license' | 'national_id';
  documents: Array<{
    type: string;
    fileUrl: string;
    contentType: string;
  }>;
  personalInfo?: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    country: string;
    address?: {
      street: string;
      city: string;
      state?: string;
      postalCode: string;
      country: string;
    };
  };
  metadata?: Record<string, any>;
}

export interface KYCVerificationResponse {
  message: string;
  status: string;
  user_id: string;
  next_steps: string[];
}

export interface KYCStatusResponse {
  status: 'pending' | 'verified' | 'rejected';
  verificationId?: string;
  rejectionReason?: string;
  submittedAt?: string;
  verifiedAt?: string;
}

// ============= Notification Types =============

export interface Notification {
  id: string;
  type: 'transaction' | 'security' | 'system' | 'promotion';
  title: string;
  message: string;
  read: boolean;
  data?: any;
  createdAt: string;
}

export interface GetNotificationsRequest extends PaginationParams {
  type?: Notification['type'];
  unreadOnly?: boolean;
}

export interface GetNotificationsResponse extends PaginatedResponse<Notification> {}

export interface MarkNotificationReadRequest {
  notificationIds: string[];
}

// ============= Settings Types =============

export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    biometricEnabled: boolean;
    passcodeEnabled: boolean;
  };
  preferences: {
    currency: string;
    language: string;
    theme: 'light' | 'dark' | 'auto';
  };
}

export interface UpdateSettingsRequest {
  notifications?: Partial<UserSettings['notifications']>;
  security?: Partial<UserSettings['security']>;
  preferences?: Partial<UserSettings['preferences']>;
}

// ============= 2FA Types =============

export interface Enable2FAResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface Verify2FARequest {
  code: string;
}

export interface Verify2FAResponse {
  verified: boolean;
}

// ============= Device Management Types =============

export interface Device {
  id: string;
  name: string;
  type: 'mobile' | 'web' | 'desktop';
  os: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface GetDevicesResponse {
  devices: Device[];
}

export interface RemoveDeviceRequest {
  deviceId: string;
}
