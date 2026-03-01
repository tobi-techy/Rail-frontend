#!/bin/sh
set -e

echo "==> Installing Node dependencies"
cd "$CI_PRIMARY_REPOSITORY_PATH"

# Install Node via Homebrew if needed, then install bun
if ! command -v bun &> /dev/null; then
  brew install bun
fi

bun install --frozen-lockfile

echo "==> Installing CocoaPods dependencies"
cd "$CI_PRIMARY_REPOSITORY_PATH/ios"

# Ensure pod is available (Xcode Cloud has it, but set PATH explicitly)
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

pod install
