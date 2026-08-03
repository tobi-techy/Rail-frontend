/**
 * Bank logo resolution backed by the open-source ng-bank-logos dataset.
 *
 * The dataset (assets/data/ng-bank-logos.json) is a slimmed, versioned snapshot
 * of https://github.com/Nigerian-Bank-Logos/ng-bank-logos — 637 Nigerian
 * institutions, each with a 400×400 PNG served from jsDelivr. It's bundled so
 * matching happens instantly and offline; only the images themselves hit the
 * network.
 *
 * Matching is deliberately layered because RampHub bank codes are
 * provider-scoped and don't always line up with the dataset's CBN codes:
 *   1. exact code match (bankCode or scCode)
 *   2. exact normalized name/alias match
 *   3. collision-safe "stripped" name match (drops Bank/PLC/Nigeria/… noise)
 * A miss returns null so callers can decide between the shared _default asset
 * and a local icon fallback.
 */
import bankData from '@/assets/data/ng-bank-logos.json';

interface SlimBank {
  /** Canonical name */
  n: string;
  /** CBN bank code */
  bc: string;
  /** PNG path relative to `base` */
  p: string;
  /** Extra aliases (canonical name excluded) */
  a?: string[];
  /** Sort-code, when the institution has one */
  sc?: string;
}

const PNG_BASE = bankData.base;
const BANKS = bankData.banks as SlimBank[];

/**
 * Expand a stored path into a full URL. Most records store a path relative to
 * PNG_BASE, but institutions with no source logo store the absolute shared
 * `_default.png` URL — pass those through untouched.
 */
function buildUrl(path: string): string {
  return path.startsWith('http') ? path : PNG_BASE + path;
}

/** Shared placeholder for institutions the dataset can't match. */
export const DEFAULT_BANK_LOGO =
  'https://cdn.jsdelivr.net/gh/Nigerian-Bank-Logos/ng-bank-logos@main/logos/_default.png';

/** Tokens that carry no identifying signal and cause false near-misses. */
const NOISE_TOKENS = new Set([
  'bank',
  'plc',
  'ltd',
  'limited',
  'nigeria',
  'nig',
  'microfinance',
  'mfb',
  'the',
  'and',
  'of',
  'company',
  'co',
]);

/** lowercase → alphanumeric-only, e.g. "GTBank Plc" → "gtbankplc". */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');
}

/** Drop noise tokens: "Access Bank Nigeria Plc" → "access". */
function strip(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .split(/[^a-z0-9]+/)
    .filter((t) => t && !NOISE_TOKENS.has(t))
    .join('');
}

const codeIndex = new Map<string, string>();
const nameIndex = new Map<string, string>();
// value `null` marks an ambiguous stripped key we must not trust.
const strippedIndex = new Map<string, string | null>();

for (const bank of BANKS) {
  if (bank.bc && !codeIndex.has(bank.bc)) codeIndex.set(bank.bc, bank.p);
  if (bank.sc && !codeIndex.has(bank.sc)) codeIndex.set(bank.sc, bank.p);

  const labels = [bank.n, ...(bank.a ?? [])];
  for (const label of labels) {
    // Some aliases are the institution's NIP code (e.g. Opay → "305"), which is
    // the scheme RampHub tends to key on — treat those as codes, not names.
    if (/^\d{3,6}$/.test(label)) {
      if (!codeIndex.has(label)) codeIndex.set(label, bank.p);
      continue;
    }

    const key = normalize(label);
    if (key && !nameIndex.has(key)) nameIndex.set(key, bank.p);

    const stripped = strip(label);
    if (!stripped) continue;
    if (!strippedIndex.has(stripped)) {
      strippedIndex.set(stripped, bank.p);
    } else if (strippedIndex.get(stripped) !== bank.p) {
      strippedIndex.set(stripped, null); // collision → untrustworthy
    }
  }
}

/**
 * Resolve a bank's logo URL, or `null` when the dataset has no confident match.
 * Pass the RampHub/PAJ bank code when available — it's the most reliable key.
 */
export function resolveBankLogoUrl(bankName?: string, bankCode?: string): string | null {
  if (bankCode) {
    const byCode = codeIndex.get(bankCode.trim());
    if (byCode) return buildUrl(byCode);
  }

  if (bankName) {
    const byName = nameIndex.get(normalize(bankName));
    if (byName) return buildUrl(byName);

    const byStripped = strippedIndex.get(strip(bankName));
    if (byStripped) return buildUrl(byStripped);
  }

  return null;
}

/** Same as {@link resolveBankLogoUrl} but always yields an image URL. */
export function resolveBankLogoOrDefault(bankName?: string, bankCode?: string): string {
  return resolveBankLogoUrl(bankName, bankCode) ?? DEFAULT_BANK_LOGO;
}
