import React from 'react';
import { useFonts } from './useFonts';

/**
 * Higher-order component for font loading
 *
 * This HOC wraps components to ensure fonts are loaded before rendering.
 * If fonts fail to load, it shows a warning and continues with system fonts.
 *
 * Usage:
 * ```tsx
 * import { withFonts } from '../hooks/withFonts';
 *
 * const MyComponent = () => <Text>Hello</Text>;
 * export default withFonts(MyComponent);
 * ```
 */
export const withFonts = <P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P> => {
  const WithFontsComponent: React.FC<P> = (props) => {
    const { fontsLoaded, error } = useFonts();

    // Don't render if fonts haven't loaded yet
    if (!fontsLoaded) {
      return null; // You can customize this to show a loading spinner
    }

    // Log warning if fonts failed to load but continue rendering
    if (error) {
      console.warn('Fonts failed to load, falling back to system fonts:', error);
    }

    // Render the wrapped component
    return <WrappedComponent {...props} />;
  };

  // Set display name for debugging
  WithFontsComponent.displayName = `withFonts(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithFontsComponent;
};

export default withFonts;
