/* eslint-disable @typescript-eslint/no-require-imports */

jest.mock('@solana-mobile/mobile-wallet-adapter-protocol-web3js', () => ({
  transact: jest.fn(),
}));

jest.mock('@solana-mobile/mobile-wallet-adapter-protocol', () => ({
  SolanaMobileWalletAdapterErrorCode: {
    ERROR_WALLET_NOT_FOUND: 'ERROR_WALLET_NOT_FOUND',
    ERROR_SESSION_TIMEOUT: 'ERROR_SESSION_TIMEOUT',
  },
}));

jest.mock('@solana/web3.js', () => {
  class PublicKey {
    private value: string;

    constructor(value: string | Uint8Array) {
      this.value =
        typeof value === 'string' ? value : Buffer.from(value).toString('base64').slice(0, 32);
    }

    toBase58() {
      return this.value;
    }
  }

  class Transaction {
    recentBlockhash?: string;
    feePayer?: PublicKey;
    instructions: unknown[] = [];

    constructor(config?: { blockhash?: string; feePayer?: PublicKey }) {
      this.recentBlockhash = config?.blockhash;
      this.feePayer = config?.feePayer;
    }

    add(instruction: unknown) {
      this.instructions.push(instruction);
      return this;
    }
  }

  class Connection {
    async getLatestBlockhash() {
      return { blockhash: 'mock-blockhash', lastValidBlockHeight: 1 };
    }
  }

  return { Connection, PublicKey, Transaction };
});

jest.mock('@solana/spl-token', () => ({
  ASSOCIATED_TOKEN_PROGRAM_ID: 'associated-program',
  TOKEN_PROGRAM_ID: 'token-program',
  createAssociatedTokenAccountIdempotentInstruction: jest.fn(() => ({ type: 'create-ata' })),
  createTransferCheckedInstruction: jest.fn(() => ({ type: 'transfer-checked' })),
  getAssociatedTokenAddressSync: jest.fn(() => 'mock-ata'),
}));

const {
  normalizeMobileWalletFundingError,
  resolveWalletBaseUri,
  startMobileWalletFunding,
  usdToUsdcBaseUnits,
} = require('../../services/solanaFunding');

describe('solanaFunding helpers', () => {
  it('converts USD to USDC base units with cent rounding', () => {
    expect(usdToUsdcBaseUnits(1)).toBe(1_000_000n);
    expect(usdToUsdcBaseUnits(1.234)).toBe(1_230_000n);
    expect(usdToUsdcBaseUnits(1.235)).toBe(1_240_000n);
    expect(usdToUsdcBaseUnits(0)).toBe(0n);
  });

  it('maps wallet methods to deterministic base URIs', () => {
    expect(resolveWalletBaseUri('phantom')).toBe('https://phantom.app/ul/v1');
    expect(resolveWalletBaseUri('solflare')).toBe('https://solflare.com/ul/v1');
  });

  it('normalizes wallet-not-found errors', () => {
    const normalized = normalizeMobileWalletFundingError({
      code: 'ERROR_WALLET_NOT_FOUND',
      message: 'no wallet',
    });

    expect(normalized.category).toBe('wallet_missing');
    expect(normalized.code).toContain('ERROR_WALLET_NOT_FOUND');
  });
});

describe('startMobileWalletFunding', () => {
  it('passes selected wallet baseUri into transact config', async () => {
    let capturedBaseUri = '';
    const fakeWallet = {
      authorize: jest.fn().mockResolvedValue({
        accounts: [{ address: '11111111111111111111111111111111' }],
        wallet_uri_base: 'https://phantom.app',
      }),
      signAndSendTransactions: jest.fn().mockResolvedValue(['sig123']),
    };

    const result = await startMobileWalletFunding(
      {
        wallet: 'phantom',
        amountUsd: 12.34,
        recipientOwnerAddress: '11111111111111111111111111111111',
      },
      {
        transactFn: async (
          cb: (wallet: unknown) => Promise<unknown>,
          config?: { baseUri?: string }
        ) => {
          capturedBaseUri = config?.baseUri || '';
          return cb(fakeWallet);
        },
      }
    );

    expect(capturedBaseUri).toBe('https://phantom.app/ul/v1');
    expect(result.signature).toBe('sig123');
    expect(result.amountBaseUnits).toBe('12340000');
  });
});
