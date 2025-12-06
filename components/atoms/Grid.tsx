import React from 'react';
import { View, ViewProps } from 'react-native';
import { spacing } from '../../design/tokens';

export interface GridProps extends ViewProps {
  columns?: number;
  gap?: keyof typeof spacing;
  children: React.ReactNode;
  className?: string;
}

export const Grid: React.FC<GridProps> = ({
  columns = 2,
  gap = 'md',
  children,
  className,
  style,
  ...props
}) => {
  const gapValue = spacing[gap];
  
  return (
    <View
      className={`flex-row flex-wrap ${className || ''}`}
      style={[
        {
          marginHorizontal: -gapValue / 2,
        },
        style,
      ]}
      {...props}
    >
      {React.Children.map(children, (child, index) => (
        <View
          key={index}
          style={{
            width: `${100 / columns}%`,
            paddingHorizontal: gapValue / 2,
            marginBottom: gapValue,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
};

export interface GridItemProps extends ViewProps {
  span?: number;
  children: React.ReactNode;
  className?: string;
}

export const GridItem: React.FC<GridItemProps> = ({
  span = 1,
  children,
  className,
  style,
  ...props
}) => {
  return (
    <View
      className={className}
      style={[
        {
          flex: span,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};