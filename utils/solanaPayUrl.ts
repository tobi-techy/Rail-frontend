export interface SolanaPayRequest {
  recipient: string;
  /** USDC amount (human-readable, e.g. 10.5) */
  amount?: number;
  splToken?: string;
  label?: string;
  message?: string;
}

const SOLANA_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/**
 * Parse a Solana Pay URL.
 * Spec: solana:<recipient>[?amount=<n>][&spl-token=<mint>][&label=<s>][&message=<s>]
 * Returns null if the URL is not a valid Solana Pay URL.
 */
export function parseSolanaPayUrl(raw: string): SolanaPayRequest | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('solana:')) return null;

  const withoutScheme = trimmed.slice('solana:'.length);
  const [recipientPart, queryPart] = withoutScheme.split('?');
  const recipient = recipientPart?.trim();
  if (!recipient || !SOLANA_ADDRESS_RE.test(recipient)) return null;

  const params = new URLSearchParams(queryPart ?? '');
  const amountStr = params.get('amount');
  const amount = amountStr !== null ? parseFloat(amountStr) : undefined;

  const splTokenRaw = params.get('spl-token');
  const splToken = splTokenRaw && SOLANA_ADDRESS_RE.test(splTokenRaw) ? splTokenRaw : undefined;

  return {
    recipient,
    amount: amount !== undefined && Number.isFinite(amount) && amount > 0 ? amount : undefined,
    splToken,
    label: params.get('label') ?? undefined,
    message: params.get('message') ?? undefined,
  };
}
