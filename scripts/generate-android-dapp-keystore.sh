#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="$REPO_ROOT/android"
DEFAULT_KEYSTORE_PATH="$ANDROID_DIR/keystores/rail-dapp-store.jks"

KEYSTORE_PATH="${KEYSTORE_PATH:-$DEFAULT_KEYSTORE_PATH}"
KEY_ALIAS="${KEY_ALIAS:-rail-dapp-store}"
KEY_ALG="${KEY_ALG:-RSA}"
KEY_SIZE="${KEY_SIZE:-2048}"
VALIDITY_DAYS="${VALIDITY_DAYS:-10000}"
DNAME="${DNAME:-CN=Rail Money, OU=Mobile, O=Rail, L=New York, S=NY, C=US}"

usage() {
  cat <<EOF
Generate a dedicated Android keystore for Solana dApp Store signing.

Usage:
  KEYSTORE_PASSWORD='<secret>' [KEY_PASSWORD='<secret>'] \\
  $0

Optional env vars:
  KEYSTORE_PATH      (default: $DEFAULT_KEYSTORE_PATH)
  KEY_ALIAS          (default: rail-dapp-store)
  KEY_ALG            (default: RSA)
  KEY_SIZE           (default: 2048)
  VALIDITY_DAYS      (default: 10000)
  DNAME              (default: '$DNAME')

Notes:
  - Use a dApp-Store-only key. Do not reuse a Google Play signing key.
  - Keep keystore + passwords safe. You need the same key for every update.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if ! command -v keytool >/dev/null 2>&1; then
  echo "error: keytool not found. Install a JDK and ensure keytool is on PATH." >&2
  exit 1
fi

if [[ -z "${KEYSTORE_PASSWORD:-}" ]]; then
  echo "error: KEYSTORE_PASSWORD is required." >&2
  usage
  exit 1
fi

KEY_PASSWORD="${KEY_PASSWORD:-$KEYSTORE_PASSWORD}"

mkdir -p "$(dirname "$KEYSTORE_PATH")"

if [[ -f "$KEYSTORE_PATH" ]]; then
  echo "error: keystore already exists at $KEYSTORE_PATH" >&2
  echo "       remove it first or choose a different KEYSTORE_PATH." >&2
  exit 1
fi

keytool -genkey -v \
  -keystore "$KEYSTORE_PATH" \
  -alias "$KEY_ALIAS" \
  -keyalg "$KEY_ALG" \
  -keysize "$KEY_SIZE" \
  -validity "$VALIDITY_DAYS" \
  -storepass "$KEYSTORE_PASSWORD" \
  -keypass "$KEY_PASSWORD" \
  -dname "$DNAME"

cat <<EOF

Keystore created:
  $KEYSTORE_PATH

Next: set these for release builds (do not commit secrets):
  RAIL_UPLOAD_STORE_FILE=$KEYSTORE_PATH
  RAIL_UPLOAD_STORE_PASSWORD=<your-keystore-password>
  RAIL_UPLOAD_KEY_ALIAS=$KEY_ALIAS
  RAIL_UPLOAD_KEY_PASSWORD=<your-key-password>
EOF
