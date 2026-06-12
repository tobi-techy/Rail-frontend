#!/bin/bash

# Rail Money - Build and Upload to App Store Connect
# Usage: ./scripts/release-ios.sh [patch|minor|major]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
IOS_DIR="$PROJECT_ROOT/ios"
WORKSPACE="RailMoney.xcworkspace"
SCHEME="RailMoney"
ARCHIVE_PATH="$IOS_DIR/build/RailMoney.xcarchive"
EXPORT_PATH="$IOS_DIR/build/export"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[Rail]${NC} $1"; }
warn() { echo -e "${YELLOW}[Rail]${NC} $1"; }
error() { echo -e "${RED}[Rail]${NC} $1"; exit 1; }

# Get current version from app.json
get_version() {
  node -p "require('$PROJECT_ROOT/app.json').expo.version"
}

# Get current iOS build number
get_build_number() {
  /usr/libexec/PlistBuddy -c "Print CFBundleVersion" "$IOS_DIR/RailMoney/Info.plist" 2>/dev/null || echo "1"
}

# Bump version based on type (patch, minor, major)
bump_version() {
  local type="${1:-patch}"
  local current=$(get_version)
  local IFS='.'
  read -ra parts <<< "$current"
  
  case $type in
    major) parts[0]=$((parts[0] + 1)); parts[1]=0; parts[2]=0 ;;
    minor) parts[1]=$((parts[1] + 1)); parts[2]=0 ;;
    patch) parts[2]=$((parts[2] + 1)) ;;
    *) error "Invalid version type: $type (use patch, minor, or major)" ;;
  esac
  
  echo "${parts[0]}.${parts[1]}.${parts[2]}"
}

# Update version in app.json
update_app_json() {
  local new_version="$1"
  node -e "
    const fs = require('fs');
    const path = '$PROJECT_ROOT/app.json';
    const config = require(path);
    config.expo.version = '$new_version';
    fs.writeFileSync(path, JSON.stringify(config, null, 2) + '\n');
  "
  log "Updated app.json version to $new_version"
}

# Update iOS Info.plist
update_ios_version() {
  local new_version="$1"
  local build_number="$2"
  
  /usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $new_version" "$IOS_DIR/RailMoney/Info.plist"
  /usr/libexec/PlistBuddy -c "Set :CFBundleVersion $build_number" "$IOS_DIR/RailMoney/Info.plist"
  log "Updated Info.plist: version=$new_version build=$build_number"
}

# Build archive
build_archive() {
  log "Opening Xcode for archive..."
  cd "$IOS_DIR"
  open "$WORKSPACE"
  
  log ""
  log "In Xcode:"
  log "  1. Select 'Any iOS Device' as destination"
  log "  2. Product → Archive"
  log "  3. Once complete, click 'Distribute App'"
  log "  4. Select 'App Store Connect' → Upload"
  log ""
  read -p "Press Enter when upload is complete..."
}

# Upload to App Store Connect
upload_to_appstore() {
  log "Uploading to App Store Connect..."
  cd "$IOS_DIR"
  
  # Create export options plist
  cat > "$IOS_DIR/ExportOptions.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store-connect</string>
    <key>destination</key>
    <string>upload</string>
    <key>signingStyle</key>
    <string>automatic</string>
</dict>
</plist>
EOF

  xcodebuild -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportOptionsPlist "$IOS_DIR/ExportOptions.plist" \
    -exportPath "$EXPORT_PATH" \
    -allowProvisioningUpdates
  
  log "Upload complete!"
}

# Main
main() {
  local bump_type="${1:-patch}"
  
  log "Starting iOS release process..."
  
  # Get versions
  local current_version=$(get_version)
  local new_version=$(bump_version "$bump_type")
  local current_build=$(get_build_number)
  local new_build=$((current_build + 1))
  
  log "Current: v$current_version ($current_build)"
  log "New:     v$new_version ($new_build)"
  
  read -p "Continue with release? (y/n) " -n 1 -r
  echo
  [[ ! $REPLY =~ ^[Yy]$ ]] && exit 0
  
  # Update versions
  update_app_json "$new_version"
  update_ios_version "$new_version" "$new_build"
  
  # Install pods if needed
  if [ ! -d "$IOS_DIR/Pods" ]; then
    log "Installing CocoaPods..."
    cd "$IOS_DIR" && pod install
  fi
  
  # Build and upload
  build_archive
  
  # Git commit
  read -p "Commit and tag release? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd "$PROJECT_ROOT"
    git add app.json
    git commit -m "Release v$new_version ($new_build)"
    git tag -a "v$new_version" -m "Release v$new_version"
    git push && git push --tags
    log "Tagged and pushed v$new_version"
  fi
  
  log "🎉 Release v$new_version uploaded to App Store Connect!"
  log "Check TestFlight in ~15-30 minutes for the new build."
}

main "$@"
