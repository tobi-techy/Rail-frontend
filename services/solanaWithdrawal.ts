/**
 * MWA Withdrawal — connects user's wallet via Mobile Wallet Adapter,
 * gets their public key, then asks the backend to send USDC to that address.
 */
import { Buffer } from 'buffer';
import { PublicKey } from '@solana/web3.js';

export interface MWAWithdrawalResult {
  destinationAddress: string;
  walletName?: string;
}

const APP_IDENTITY = {
  name: 'Rail Money',
  uri: 'https://userail.money',
};

function toPublicKey(address: string): PublicKey {
  try {
    return new PublicKey(address);
  } catch {
    return new PublicKey(Buffer.from(address, 'base64'));
  }
}

/**
 * Opens the system MWA wallet picker (includes Seed Vault on Seeker),
 * authorizes the app, and returns the user's wallet public key.
 * No transaction is signed — the backend handles the actual transfer.
 */
export async function connectMobileWalletForWithdrawal(): Promise<MWAWithdrawalResult> {
  const { transact } = await import('@solana-mobile/mobile-wallet-adapter-protocol-web3js');

  return transact(async (wallet) => {
    const authorization = await wallet.authorize({
      identity: APP_IDENTITY,
      chain: 'solana:devnet',
    });

    const account = authorization.accounts?.[0];
    if (!account?.address) {
      throw new Error('Wallet did not provide an account address.');
    }

    const publicKey = toPublicKey(account.address);

    return {
      destinationAddress: publicKey.toBase58(),
      walletName: authorization.wallet_uri_base,
    };
  });
  // No baseUri — lets the system show all available wallets including Seed Vault
}
