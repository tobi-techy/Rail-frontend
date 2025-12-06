import React from 'react';
import { View, ViewProps, Text } from 'react-native';
import * as Lucide from 'lucide-react-native';
import { Ionicons, Feather, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { colors } from '../../design/tokens';

export type IconLibrary = 'lucide' | 'ionicons' | 'feather' | 'material' | 'fontawesome';

export interface IconProps extends Omit<ViewProps, 'children'> {
  name: string;
  library?: IconLibrary;
  size?: number;
  color?: string;
  className?: string;
  testID?: string;
  strokeWidth?: number;
  fill?: string;
}

const FallbackIcon = ({ size = 24, color = '#000', style, ...props }: any) => {
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
  }, '●');
};

function kebabToPascal(input: string) {
  return input
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

function resolveLucideComponent(name: string) {
  const pascalName = kebabToPascal(name);
  const component = (Lucide as any)[pascalName];
  return component || (Lucide as any).Circle || FallbackIcon;
}

export const Icon: React.FC<IconProps> = ({
  name,
  library = 'lucide',
  size = 24,
  color = colors.text.primary,
  className,
  testID,
  style,
  strokeWidth = 0.8,
  fill = 'none',
  ...props
}) => {
  const LucideIcon = resolveLucideComponent(name);
  const vectorLibraries = {
    ionicons: Ionicons,
    feather: Feather,
    material: MaterialIcons,
    fontawesome: FontAwesome,
  } as const;

  const VectorIcon = library !== 'lucide' ? vectorLibraries[library] : null;

  return (
    <View 
      style={[{ alignItems: 'center', justifyContent: 'center' }, style]}
      className={className}
      testID={testID}
      {...props}
    >
      {library === 'lucide' ? (
        <LucideIcon 
          size={size}
          color={color}
          strokeWidth={strokeWidth}
          fill={fill}
        />
      ) : VectorIcon ? (
        <VectorIcon name={name as any} size={size} color={color} />
      ) : (
        <FallbackIcon size={size} color={color} />
      )}
    </View>
  );
};
