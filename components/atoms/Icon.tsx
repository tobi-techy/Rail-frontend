import React from 'react';
import { View, ViewProps } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import type { HugeiconsProps } from '@hugeicons/react-native';
import * as Icons from '@hugeicons/core-free-icons';

export type HugeIconType = HugeiconsProps['icon'];

export interface IconProps extends Omit<ViewProps, 'children'> {
  icon?: HugeIconType;
  name?: string;
  size?: number;
  color?: string;
  className?: string;
  testID?: string;
  strokeWidth?: number;
}

// Kebab-case string -> hugeicons icon lookup
function resolveIconByName(name: string): HugeIconType {
  // Convert kebab-case to PascalCase + "Icon" suffix
  const pascal =
    name
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('') + 'Icon';
  return (Icons as any)[pascal] ?? Icons.HelpCircleIcon;
}

export const Icon: React.FC<IconProps> = ({
  icon,
  name,
  size = 24,
  color = '#000000',
  className,
  testID,
  style,
  strokeWidth = 1.5,
  ...props
}) => {
  const resolvedIcon = icon ?? (name ? resolveIconByName(name) : Icons.HelpCircleIcon);
  return (
    <View
      style={[{ alignItems: 'center', justifyContent: 'center' }, style]}
      className={className}
      testID={testID}
      {...props}>
      <HugeiconsIcon icon={resolvedIcon} size={size} color={color} strokeWidth={strokeWidth} />
    </View>
  );
};
