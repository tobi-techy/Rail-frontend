import React from 'react';
import { View, ViewProps } from 'react-native';
import { IconComponent, resolveIcon, type PhosphorIcon } from '@/lib/icons';
import type { IconWeight } from 'phosphor-react-native';

export type HugeIconType = PhosphorIcon;

export interface IconProps extends Omit<ViewProps, 'children'> {
  icon?: PhosphorIcon;
  name?: string;
  size?: number;
  color?: string;
  fill?: string;
  className?: string;
  testID?: string;
  strokeWidth?: number;
  weight?: IconWeight;
}

export const Icon: React.FC<IconProps> = ({
  icon,
  name,
  size = 24,
  color = '#000000',
  fill,
  className,
  testID,
  style,
  weight = 'regular',
  ...props
}) => {
  const resolvedIcon = icon ?? (name ? resolveIcon(name) : resolveIcon('HelpCircleIcon'));
  return (
    <View
      style={[{ alignItems: 'center', justifyContent: 'center' }, style]}
      className={className}
      testID={testID}
      {...props}>
      <IconComponent icon={resolvedIcon} size={size} color={color} fill={fill} weight={weight} />
    </View>
  );
};
