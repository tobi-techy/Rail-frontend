# Seeker + iOS Hackathon Launch Runbook

## Goal

Ship:

- A signed Android APK for Solana dApp Store validation (Seeker-ready path).
- An internal Android QA APK.
- A TestFlight iOS build.

## Xcode + Android Workflow

- Use Xcode for iOS/TestFlight (unchanged).
- Use Gradle/Android tooling for Seeker/dApp Store APK.
- Do not upload until local smoke checks are complete.

## Android Release Prerequisites

Generate and use a dedicated dApp Store keystore (do not reuse Google Play signing keys):

```bash
KEYSTORE_PASSWORD='<strong-password>' \
scripts/generate-android-dapp-keystore.sh
```

Set release signing properties in `android/gradle.properties` or pass them via `-P`:

```properties
RAIL_UPLOAD_STORE_FILE=../keystores/rail-dapp-store.jks
RAIL_UPLOAD_STORE_PASSWORD=***
RAIL_UPLOAD_KEY_ALIAS=rail-dapp-store
RAIL_UPLOAD_KEY_PASSWORD=***
```

## Local Build + Verify (No Upload)

From repo root:

```bash
# Build + signature verification (local)
scripts/build-seeker-release-apk.sh

# iOS TestFlight
xcodebuild -workspace ios/rail.xcworkspace -scheme rail -configuration Release -archivePath build/rail.xcarchive archive
```

Notes:

- If signing env vars are present, the script uses them.
- Otherwise it uses `android/gradle.properties`.
- Release build intentionally fails if signing vars are missing.

## Seeker Smoke Test Checklist

1. Install app APK on Seeker device.
2. Open app, authenticate, and navigate to Station.
3. Start flow: `Receive -> More Options -> Phantom` (repeat for Solflare).
4. Enter amount and confirm wallet launch.
5. In wallet, approve USDC transfer on devnet.
6. Return to app and verify pending -> confirmed state.
7. Verify history/deposit signature visibility.
8. Negative path checks:

- wallet missing
- wallet cancel
- wallet timeout

9. Verify market chart renders without clipping on Seeker.
10. Verify key bottom sheets open/close and keyboard interactions are stable.

## Upload Instructions (When You Are Ready)

Use either portal or CLI.

Portal path:

1. Open [publish.solanamobile.com](https://publish.solanamobile.com).
2. Complete publisher signup and KYC/KYB.
3. Connect and fund publisher wallet.
4. Create app listing and upload signed APK.
5. Submit version for review.

CLI path:

```bash
npm install --global @solana-mobile/dapp-store-cli
dapp-store --version
dapp-store login

# First app submission
dapp-store publish create-app --new-app-manifest <path-to-app-manifest>

# Next versions
dapp-store publish submit-version --version-manifest <path-to-version-manifest>
```

## Demo Script (Short)

1. Open Station and show current balance.
2. Tap `Receive`, choose Phantom/Solflare.
3. Enter amount and open wallet.
4. Approve transfer in wallet.
5. Return to app, show pending confirmation and final success state.
6. Show transaction signature and updated balance.

## Release Notes Draft

- Added Android-gated Solana MWA funding flow for Phantom/Solflare.
- Added Seeker-aware responsive behavior for critical funding and sheet surfaces.
- Hardened Android release signing requirements for non-debug release APKs.
- Reduced Android manifest permissions for cleaner release posture.
- Updated analytics platform reporting to runtime platform.

## Known Limitations (Hackathon Scope)

- MWA funding is Android-only in this milestone.
- Seeker-specific overrides are limited to critical funding/transaction surfaces.
- Solana network is devnet for hackathon validation.
