import { safeLog } from "@/utils/logSanitizer";

// Platform polyfill for React Native
(() => {
  const createPlatformPolyfill = () => ({
    OS: 'ios' as const,
    Version: '1.0',
    isPad: false,
    isTesting: false,
    isTV: false,
    select: (obj: any) => obj.ios || obj.default || obj,
    constants: {
      reactNativeVersion: { major: 0, minor: 79, patch: 5 },
      Version: '1.0',
      Release: '1.0',
      Model: 'iPhone',
      Brand: 'Apple',
      SystemName: 'iOS',
      SystemVersion: '16.0',
      ApiLevel: null,
      ApplicationName: 'Expo',
    },
  });

  // Apply polyfill to global object
  if (typeof globalThis !== 'undefined') {
    const globalAny = globalThis as any;
    if (!globalAny.Platform || !globalAny.Platform.OS) {
      globalAny.Platform = createPlatformPolyfill();
    }
    
    // Fix TurboModule proxy issue
    if (!globalAny.__turboModuleProxy) {
      globalAny.__turboModuleProxy = function(name: string) {
        safeLog(`TurboModule ${name} not available, using fallback`);
        return null;
      };
    }
  }

  // Try to polyfill React Native's Platform module directly
  try {
    const RN = require('react-native');
    if (!RN.Platform || !RN.Platform.OS) {
      RN.Platform = createPlatformPolyfill();
    }
  } catch (e) {
    // React Native not available yet, that's okay
  }
})();

// Safe import with error handling
let Ionicons: any;

try {
  const vectorIcons = require('@expo/vector-icons');
  Ionicons = vectorIcons.Ionicons;
  
  // Ensure Ionicons has the expected structure
  if (!Ionicons || typeof Ionicons !== 'function') {
    throw new Error('Ionicons not properly loaded');
  }
  
  // Ensure glyphMap exists
  if (!Ionicons.glyphMap) {
    Ionicons.glyphMap = {};
  }
} catch (error) {
  console.warn('Failed to load Ionicons, using fallback:', error);
  
  // Fallback Ionicons component
  Ionicons = ({ name, size = 24, color = '#000', style, ...props }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    
    return React.createElement(Text, {
      style: [
        {
          fontSize: size,
          color,
          fontFamily: 'System',
        },
        style,
      ],
      ...props,
    }, '●'); // Simple fallback icon
  };
  
  // Add empty glyphMap for compatibility
  Ionicons.glyphMap = {};
}

export { Ionicons };
