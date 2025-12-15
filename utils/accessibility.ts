import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Announce message to screen readers
 */
export const announceForAccessibility = (message: string) => {
  AccessibilityInfo.announceForAccessibility(message);
};

/**
 * Check if screen reader is enabled
 */
export const isScreenReaderEnabled = async (): Promise<boolean> => {
  return AccessibilityInfo.isScreenReaderEnabled();
};

/**
 * Generate accessibility props for interactive elements
 */
export const getAccessibilityProps = (options: {
  label: string;
  hint?: string;
  role?: 'button' | 'link' | 'header' | 'text' | 'image' | 'search' | 'tab';
  disabled?: boolean;
  selected?: boolean;
}) => ({
  accessible: true,
  accessibilityLabel: options.label,
  accessibilityHint: options.hint,
  accessibilityRole: options.role,
  accessibilityState: {
    disabled: options.disabled,
    selected: options.selected,
  },
});

/**
 * Format currency for screen readers
 */
export const formatCurrencyForA11y = (amount: number, currency = 'USD'): string => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
  
  return `${formatted.replace('$', '')} dollars`;
};
