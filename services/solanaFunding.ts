import { Buffer } from 'buffer';
import {
  transact,
  type Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { SolanaMobileWalletAdapterErrorCode } from '@solana-mobile/mobile-wallet-adapter-protocol';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';

export type SupportedFundingWallet = 'phantom' | 'solflare';

export interface StartMobileWalletFundingInput {
  wallet: SupportedFundingWallet;
  amountUsd: number;
  recipientOwnerAddress: string;
}

export interface StartMobileWalletFundingResult {
  signature: string;
  fromAddress: string;
  toAddress: string;
  amountBaseUnits: string;
  walletUriBase?: string;
}

export type FundingErrorCategory =
  | 'wallet_missing'
  | 'wallet_timeout'
  | 'wallet_cancelled'
  | 'transaction_failed'
  | 'unknown';

export interface NormalizedFundingError {
  category: FundingErrorCategory;
  code: string;
  message: string;
}

export const DEFAULT_SOLANA_RPC_URL = 'https://api.devnet.solana.com';
export const DEFAULT_DEVNET_USDC_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
export const USDC_DECIMALS = 6;

const APP_IDENTITY = {
  name: 'Rail Money',
  uri: 'https://userail.money',
};

type FundingDeps = {
  transactFn: typeof transact;
  getConnection: (endpoint: string) => Pick<Connection, 'getLatestBlockhash'>;
};

const defaultDeps: FundingDeps = {
  transactFn: transact,
  getConnection: (endpoint) => new Connection(endpoint, 'confirmed'),
};

export function resolveWalletBaseUri(wallet: SupportedFundingWallet): string {
  if (wallet === 'phantom') return 'https://phantom.app/ul/v1';
  return 'https://solflare.com/ul/v1';
}

export function usdToUsdcBaseUnits(amountUsd: number): bigint {
  if (!Number.isFinite(amountUsd)) return 0n;
  const roundedToCents = Math.round(amountUsd * 100);
  if (roundedToCents <= 0) return 0n;
  return BigInt(roundedToCents) * 10_000n;
}

export function normalizeMobileWalletFundingError(error: unknown): NormalizedFundingError {
  const rawCode = String(
    (error as { code?: string })?.code ||
      (error as { error?: { code?: string } })?.error?.code ||
      ''
  ).toUpperCase();
  const rawMessage = String(
    (error as { message?: string })?.message ||
      (error as { error?: { message?: string } })?.error?.message ||
      'Funding failed. Please try again.'
  );
  const normalizedMessage = rawMessage.toLowerCase();

  if (rawCode.includes(SolanaMobileWalletAdapterErrorCode.ERROR_WALLET_NOT_FOUND)) {
    return {
      category: 'wallet_missing',
      code: rawCode || 'ERROR_WALLET_NOT_FOUND',
      message: 'Selected wallet is not installed on this device.',
    };
  }

  if (
    rawCode.includes(SolanaMobileWalletAdapterErrorCode.ERROR_SESSION_TIMEOUT) ||
    normalizedMessage.includes('timeout')
  ) {
    return {
      category: 'wallet_timeout',
      code: rawCode || 'ERROR_SESSION_TIMEOUT',
      message: 'Wallet session timed out. Open the wallet and try again.',
    };
  }

  if (
    normalizedMessage.includes('cancel') ||
    normalizedMessage.includes('declin') ||
    normalizedMessage.includes('reject')
  ) {
    return {
      category: 'wallet_cancelled',
      code: rawCode || 'WALLET_CANCELLED',
      message: 'Funding was cancelled in wallet.',
    };
  }

  if (rawCode) {
    return {
      category: 'transaction_failed',
      code: rawCode,
      message: rawMessage,
    };
  }

  return {
    category: 'unknown',
    code: 'UNKNOWN',
    message: rawMessage,
  };
}

function toPublicKey(address: string): PublicKey {
  try {
    return new PublicKey(address);
  } catch {
    const decoded = Buffer.from(address, 'base64');
    return new PublicKey(decoded);
  }
}

async function buildAndSendTransfer(
  wallet: Web3MobileWallet,
  input: StartMobileWalletFundingInput,
  deps: FundingDeps
): Promise<StartMobileWalletFundingResult> {
  const amountBaseUnits = usdToUsdcBaseUnits(input.amountUsd);
  if (amountBaseUnits <= 0n) {
    throw new Error('Enter an amount greater than $0.00.');
  }

  const endpoint = process.env.EXPO_PUBLIC_SOLANA_RPC_URL || DEFAULT_SOLANA_RPC_URL;
  const usdcMintAddress = process.env.EXPO_PUBLIC_SOLANA_USDC_MINT || DEFAULT_DEVNET_USDC_MINT;
  const connection = deps.getConnection(endpoint);
  const mint = new PublicKey(usdcMintAddress);
  const recipientOwner = new PublicKey(input.recipientOwnerAddress);

  const authorization = await wallet.authorize({
    identity: APP_IDENTITY,
    chain: 'devnet',
  });
  const sourceAddress = authorization.accounts?.[0]?.address;
  if (!sourceAddress) {
    throw new Error('Wallet did not provide an authorized account.');
  }

  const senderOwner = toPublicKey(sourceAddress);
  const senderTokenAccount = getAssociatedTokenAddressSync(
    mint,
    senderOwner,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const recipientTokenAccount = getAssociatedTokenAddressSync(
    mint,
    recipientOwner,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const latestBlockhash = await connection.getLatestBlockhash('confirmed');
  const transaction = new Transaction({
    feePayer: senderOwner,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  });
  transaction.add(
    createAssociatedTokenAccountIdempotentInstruction(
      senderOwner,
      recipientTokenAccount,
      recipientOwner,
      mint,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
  );
  transaction.add(
    createTransferCheckedInstruction(
      senderTokenAccount,
      mint,
      recipientTokenAccount,
      senderOwner,
      amountBaseUnits,
      USDC_DECIMALS
    )
  );

  const signatures = await wallet.signAndSendTransactions({
    transactions: [transaction],
    commitment: 'confirmed',
    skipPreflight: false,
  });
  const signature = signatures[0];
  if (!signature) {
    throw new Error('Wallet did not return a transaction signature.');
  }

  return {
    signature,
    fromAddress: senderOwner.toBase58(),
    toAddress: recipientOwner.toBase58(),
    amountBaseUnits: amountBaseUnits.toString(),
    walletUriBase: authorization.wallet_uri_base,
  };
}

export async function startMobileWalletFunding(
  input: StartMobileWalletFundingInput,
  deps: Partial<FundingDeps> = {}
): Promise<StartMobileWalletFundingResult> {
  const mergedDeps: FundingDeps = { ...defaultDeps, ...deps };

  try {
    return await mergedDeps.transactFn(
      async (wallet) => buildAndSendTransfer(wallet, input, mergedDeps),
      { baseUri: resolveWalletBaseUri(input.wallet) }
    );
  } catch (error) {
    const normalized = normalizeMobileWalletFundingError(error);
    const wrapped = new Error(normalized.message) as Error & {
      code: string;
      category: FundingErrorCategory;
    };
    wrapped.code = normalized.code;
    wrapped.category = normalized.category;
    throw wrapped;
  }
}
