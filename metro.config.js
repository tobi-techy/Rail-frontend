// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Suppress Metro bundler progress logs in development
if (process.env.EXPO_PUBLIC_SUPPRESS_DEV_WARNINGS === 'true') {
  config.reporter = {
    update: () => {}, // Suppress progress updates
  };
}

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
  // Defer module evaluation until first `require` instead of running every
  // module's top-level code at bundle load. Big cold-start win for an app this
  // size on Hermes. Side-effect imports in the entry chain (global.css, Sentry,
  // gesture-handler, polyfills) still run eagerly because they're required from
  // the entry/_layout top level.
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'],
  extraNodeModules: {
    ...config.resolver.extraNodeModules,
    'react-native-svg': path.resolve(__dirname, 'node_modules/react-native-svg'),
  },
};

module.exports = withNativeWind(config, { input: './global.css' });
