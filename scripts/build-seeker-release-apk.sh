#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="$REPO_ROOT/android"
APK_PATH="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"

find_apksigner() {
  if command -v apksigner >/dev/null 2>&1; then
    command -v apksigner
    return 0
  fi

  local sdk_root="${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}"
  local candidate
  candidate="$(find "$sdk_root/build-tools" -name apksigner -type f 2>/dev/null | sort -V | tail -n 1 || true)"
  if [[ -n "$candidate" ]]; then
    echo "$candidate"
    return 0
  fi
  return 1
}

echo "==> Building release APK for Seeker/dApp Store"

cd "$ANDROID_DIR"

GRADLE_PROPS=()
if [[ -n "${RAIL_UPLOAD_STORE_FILE:-}" && -n "${RAIL_UPLOAD_STORE_PASSWORD:-}" && -n "${RAIL_UPLOAD_KEY_ALIAS:-}" && -n "${RAIL_UPLOAD_KEY_PASSWORD:-}" ]]; then
  echo "==> Using signing values from environment variables"
  GRADLE_PROPS+=("-PRAIL_UPLOAD_STORE_FILE=${RAIL_UPLOAD_STORE_FILE}")
  GRADLE_PROPS+=("-PRAIL_UPLOAD_STORE_PASSWORD=${RAIL_UPLOAD_STORE_PASSWORD}")
  GRADLE_PROPS+=("-PRAIL_UPLOAD_KEY_ALIAS=${RAIL_UPLOAD_KEY_ALIAS}")
  GRADLE_PROPS+=("-PRAIL_UPLOAD_KEY_PASSWORD=${RAIL_UPLOAD_KEY_PASSWORD}")
else
  echo "==> Using signing values from android/gradle.properties"
fi

if [[ ${#GRADLE_PROPS[@]} -gt 0 ]]; then
  ./gradlew :app:clean :app:assembleRelease -x lint "${GRADLE_PROPS[@]}"
else
  ./gradlew :app:clean :app:assembleRelease -x lint
fi

if [[ ! -f "$APK_PATH" ]]; then
  echo "error: release APK not found at $APK_PATH" >&2
  exit 1
fi

echo "==> Release APK ready:"
echo "    $APK_PATH"

if APKSIGNER_BIN="$(find_apksigner)"; then
  echo "==> Verifying APK signature using $APKSIGNER_BIN"
  "$APKSIGNER_BIN" verify --print-certs "$APK_PATH"
else
  echo "warning: apksigner not found on PATH or Android SDK build-tools." >&2
  echo "         verify manually once apksigner is available." >&2
fi

cat <<EOF

No upload performed.
Next when ready:
1) Publish UI: https://publish.solanamobile.com
2) Or CLI:
   npm install --global @solana-mobile/dapp-store-cli
   dapp-store --version
   dapp-store login
   dapp-store publish submit-version --version-manifest <path-to-version-manifest>
EOF
