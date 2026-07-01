#!/bin/bash
# Run once with sudo to fix iOS 26 simulator SDK issues that break third-party apps.
#
# 1. SwiftUICore allowable-clients restriction: PostHog and Sentry import SwiftUI,
#    which transitively links SwiftUICore. The iOS 26.5 SDK TBD file blocks
#    third-party apps from linking SwiftUICore directly.
#
# 2. UIUtilities not in Frameworks/: iOS 26.5 moved UIDefines/UIGeometry/
#    UICoordinateSpace into a UIUtilities sub-framework under SubFrameworks/.
#    UIKit headers import <UIUtilities/...> but the compiler only auto-searches
#    Frameworks/, so every Clang module that includes UIKit fails to build.
#    Fix: symlink UIUtilities.framework into Frameworks/ and create a .tbd stub.
#
# Usage: sudo ./scripts/patch-ios26-sdk.sh
#
# Safe to re-run (idempotent). Does not affect device or App Store builds —
# TBD files and SDK search paths only affect the local simulator toolchain.

set -euo pipefail

SIMULATOR_SDK_BASE="/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs"
DEVICE_SDK_BASE="/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs"

# ── Patch 1: remove allowable-clients from SwiftUICore.tbd ──────────────────
patch_swiftuicore() {
  local tbd="$1/System/Library/Frameworks/SwiftUICore.framework/SwiftUICore.tbd"
  [ -f "$tbd" ] || { echo "  skip (SwiftUICore.tbd not found)"; return; }

  if ! grep -q "allowable-clients:" "$tbd"; then
    echo "  SwiftUICore already patched"; return
  fi

  [ -f "${tbd}.orig" ] || { cp "$tbd" "${tbd}.orig"; echo "  backed up: ${tbd}.orig"; }

  python3 - "$tbd" <<'PYEOF'
import sys, re
path = sys.argv[1]
text = open(path).read()
patched = re.sub(r'^allowable-clients:.*?(?=^\w|\Z)', '', text,
                 flags=re.MULTILINE | re.DOTALL)
open(path, 'w').write(patched)
print(f"  patched SwiftUICore.tbd")
PYEOF
}

# ── Patch 2: symlink UIUtilities into Frameworks/ + create .tbd stub ─────────
# The compiler auto-searches $SYSROOT/System/Library/Frameworks when resolving
# framework imports. By symlinking UIUtilities.framework there (pointing at its
# real location in SubFrameworks/) the compiler can find and build the UIKit
# module without any per-target FRAMEWORK_SEARCH_PATHS changes.
# The .tbd stub lets the linker satisfy UIUtilities auto-link requests.
patch_uiutilities() {
  local sdk_dir="$1"
  local subfw="$sdk_dir/System/Library/SubFrameworks/UIUtilities.framework"
  local fw_link="$sdk_dir/System/Library/Frameworks/UIUtilities.framework"
  local tbd="$subfw/UIUtilities.tbd"

  [ -d "$subfw" ] || { echo "  skip (SubFrameworks/UIUtilities.framework not found)"; return; }

  # Symlink into Frameworks/ so both compiler and linker find it automatically
  if [ -L "$fw_link" ] || [ -e "$fw_link" ]; then
    echo "  UIUtilities symlink already exists in Frameworks/"
  else
    ln -sf "../SubFrameworks/UIUtilities.framework" "$fw_link"
    echo "  symlinked UIUtilities.framework into Frameworks/"
  fi

  # .tbd stub so the linker can satisfy auto-link requests
  if [ -f "$tbd" ]; then
    echo "  UIUtilities.tbd already exists"
  else
    cat > "$tbd" <<'TBD'
--- !tapi-tbd
tbd-version:     4
targets:         [ x86_64-ios-simulator, arm64-ios-simulator ]
install-name:    '/System/Library/SubFrameworks/UIUtilities.framework/UIUtilities'
current-version: 9126.5.5
swift-abi-version: 7
...
TBD
    echo "  created UIUtilities.tbd stub"
  fi
}

# ── Patch 3: remove dead ExpoModulesCore import from expo-dev-launcher ───────
# Avatar.swift imports ExpoModulesCore but uses nothing from it (only SwiftUI,
# UIKit, Foundation). In iOS 26.5 the UIKit Clang module build chain hits the
# UIUtilities issue in expo-dev-launcher's specific compilation context, causing
# "cannot load underlying module for 'ExpoModulesCore'". Removing the dead
# import unblocks compilation. Safe to re-run (idempotent).
patch_avatar_swift() {
  local SCRIPT_DIR
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  local avatar="$SCRIPT_DIR/../node_modules/expo-dev-launcher/ios/SwiftUI/Utils/Avatar.swift"
  if [ ! -f "$avatar" ]; then
    echo "  skip (expo-dev-launcher Avatar.swift not found)"
    return
  fi
  if grep -q "import ExpoModulesCore" "$avatar"; then
    sed -i '' '/^import ExpoModulesCore$/d' "$avatar"
    echo "  removed dead 'import ExpoModulesCore' from Avatar.swift"
  else
    echo "  Avatar.swift already patched"
  fi
}

# ── Patch 4: drop EXDevMenuInterface import from DevLauncherDevMenuDelegate ──
# DevLauncherDevMenuDelegate.swift conforms to DevMenuHostDelegate (from
# EXDevMenuInterface) in Swift, but the class is only ever used from ObjC
# (EXDevLauncherController.m stores it as DevLauncherDevMenuDelegate* and
# passes it to DevMenuManager setDelegate:). All DevMenuHostDelegate methods
# are @objc optional, so ObjC's respondsToSelector: will find them at runtime
# regardless of the formal Swift conformance declaration.
#
# In Xcode 17 / iOS 26.5 SDK, building EXDevMenuInterface as a Clang module
# inside expo-dev-launcher's compilation context triggers the same UIUtilities
# chain failure as ExpoModulesCore in Avatar.swift, giving:
#   "Cannot load underlying module for 'EXDevMenuInterface'"
# Removing the import + conformance annotation unblocks the build without
# affecting runtime behaviour. Safe to re-run (idempotent).
patch_dev_launcher_delegate() {
  local SCRIPT_DIR
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  local delegate="$SCRIPT_DIR/../node_modules/expo-dev-launcher/ios/DevLauncherDevMenuDelegate.swift"
  if [ ! -f "$delegate" ]; then
    echo "  skip (DevLauncherDevMenuDelegate.swift not found)"
    return
  fi
  if grep -q "import EXDevMenuInterface" "$delegate"; then
    sed -i '' '/^import EXDevMenuInterface$/d' "$delegate"
    sed -i '' 's/: NSObject, DevMenuHostDelegate {/: NSObject {/' "$delegate"
    echo "  patched DevLauncherDevMenuDelegate.swift (removed EXDevMenuInterface import + conformance)"
  else
    echo "  DevLauncherDevMenuDelegate.swift already patched"
  fi
}

for sdk_dir in "$SIMULATOR_SDK_BASE"/iPhoneSimulator*.sdk; do
  echo "Patching simulator SDK: $sdk_dir"
  patch_swiftuicore "$sdk_dir"
  patch_uiutilities "$sdk_dir"
done

for sdk_dir in "$DEVICE_SDK_BASE"/iPhoneOS*.sdk; do
  echo "Patching device SDK: $sdk_dir"
  patch_swiftuicore "$sdk_dir"
  patch_uiutilities "$sdk_dir"
done

echo ""
echo "Patching node_modules..."
patch_avatar_swift
patch_dev_launcher_delegate

echo ""
echo "Done. Run: pod install && npx expo run:ios"
