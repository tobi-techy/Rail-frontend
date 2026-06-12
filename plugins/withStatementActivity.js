const { withXcodeProject, withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const EXTENSION_NAME = 'StatementActivity';
const EXTENSION_BUNDLE_ID_SUFFIX = '.statementactivity';

// Step 1: Add the extension target via xcode library
function withExtensionTarget(config) {
  return withXcodeProject(config, async (cfg) => {
    const xcodeProject = cfg.modResults;
    const appBundleId = cfg.ios?.bundleIdentifier ?? 'com.railmoney.rail';
    const extensionBundleId = appBundleId + EXTENSION_BUNDLE_ID_SUFFIX;

    // Robust idempotency check — count existing targets with this name
    const allTargets = xcodeProject.pbxNativeTargetSection();
    const alreadyExists = Object.values(allTargets).some(
      (t) => t && typeof t === 'object' && t.name === EXTENSION_NAME
    );
    if (alreadyExists) return cfg;

    const extensionDir = path.join(cfg.modRequest.projectRoot, 'ios', EXTENSION_NAME);
    if (!fs.existsSync(extensionDir)) {
      // Extension source files don't exist yet (e.g. after --clean). Skip.
      return cfg;
    }
    const swiftFiles = fs.readdirSync(extensionDir).filter(f => f.endsWith('.swift'));
    const allFiles = fs.readdirSync(extensionDir).filter(f => f.endsWith('.swift') || f.endsWith('.plist'));

    const target = xcodeProject.addTarget(EXTENSION_NAME, 'app_extension', EXTENSION_NAME);

    xcodeProject.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', target.uuid);
    xcodeProject.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid);
    xcodeProject.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', target.uuid);

    const group = xcodeProject.addPbxGroup(allFiles, EXTENSION_NAME, EXTENSION_NAME);
    const mainGroup = xcodeProject.getFirstProject().firstProject.mainGroup;
    xcodeProject.addToPbxGroup(group.uuid, mainGroup);

    swiftFiles.forEach(file => {
      xcodeProject.addSourceFile(
        path.join(EXTENSION_NAME, file),
        { target: target.uuid },
        group.uuid
      );
    });

    const buildSettings = {
      ALWAYS_SEARCH_USER_PATHS: 'NO',
      CLANG_ENABLE_MODULES: 'YES',
      CLANG_ENABLE_OBJC_ARC: 'YES',
      CODE_SIGN_STYLE: 'Automatic',
      CURRENT_PROJECT_VERSION: '1',
      GENERATE_INFOPLIST_FILE: 'NO',
      INFOPLIST_FILE: `${EXTENSION_NAME}/Info.plist`,
      IPHONEOS_DEPLOYMENT_TARGET: '16.2',
      MARKETING_VERSION: '1.0',
      PRODUCT_BUNDLE_IDENTIFIER: extensionBundleId,
      PRODUCT_NAME: '$(TARGET_NAME)',
      SKIP_INSTALL: 'YES',
      SWIFT_EMIT_LOC_STRINGS: 'YES',
      TARGETED_DEVICE_FAMILY: '1',
    };

    Object.entries(buildSettings).forEach(([key, value]) => {
      xcodeProject.updateBuildProperty(key, value, 'Debug', EXTENSION_NAME);
      xcodeProject.updateBuildProperty(key, value, 'Release', EXTENSION_NAME);
    });

    xcodeProject.addFramework('WidgetKit.framework', { target: target.uuid, weak: false });
    xcodeProject.addFramework('ActivityKit.framework', { target: target.uuid, weak: true });

    if (!cfg.ios) cfg.ios = {};
    if (!cfg.ios.infoPlist) cfg.ios.infoPlist = {};
    cfg.ios.infoPlist.NSSupportsLiveActivities = true;
    cfg.ios.infoPlist.NSSupportsLiveActivitiesFrequentUpdates = false;

    return cfg;
  });
}

// Step 2: Directly patch the pbxproj to inject SWIFT_VERSION = 5.0 into the
// StatementActivity build configurations. The xcode npm library's updateBuildProperty
// doesn't reliably target newly-added extension configurations, so we patch the file directly.
function withSwiftVersionPatch(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const pbxprojPath = path.join(
        cfg.modRequest.projectRoot,
        'ios',
        'RailMoney.xcodeproj',
        'project.pbxproj'
      );

      let contents = fs.readFileSync(pbxprojPath, 'utf8');

      // Inject SWIFT_VERSION = 5.0 into every build configuration block that
      // belongs to StatementActivity (identified by PRODUCT_NAME = "StatementActivity")
      // and doesn't already have SWIFT_VERSION set.
      const blockRegex = /((?:PRODUCT_NAME = "StatementActivity";[\s\S]*?SKIP_INSTALL = YES;))/g;

      contents = contents.replace(blockRegex, (match) => {
        if (match.includes('SWIFT_VERSION')) return match;
        return match + '\n\t\t\t\tSWIFT_VERSION = 5.0;';
      });

      fs.writeFileSync(pbxprojPath, contents, 'utf8');
      return cfg;
    },
  ]);
}

module.exports = function withStatementActivity(config) {
  config = withExtensionTarget(config);
  config = withSwiftVersionPatch(config);
  return config;
};
