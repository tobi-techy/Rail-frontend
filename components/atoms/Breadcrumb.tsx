import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Icon } from './Icon';
import { colors, typography, spacing } from '../../design/tokens';

export interface BreadcrumbItem {
  label: string;
  onPress?: () => void;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
  testID?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator,
  className,
  testID,
}) => {
  const defaultSeparator = (
    <Icon
      name="chevron-forward"
      library="ionicons"
      size={16}
      color={colors.text.secondary}
    />
  );

  return (
    <View
      className={`flex-row items-center ${className || ''}`}
      testID={testID}
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
      }}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <View
              style={{
                marginHorizontal: spacing.sm,
              }}
            >
              {separator || defaultSeparator}
            </View>
          )}
          
          {item.onPress ? (
            <TouchableOpacity
              onPress={item.onPress}
              accessibilityRole="button"
              accessibilityLabel={`Navigate to ${item.label}`}
            >
              <Text
                style={{
                  fontFamily: typography.fonts.secondary,
                  fontSize: typography.styles.body.size,
                  color: index === items.length - 1 
                    ? colors.text.primary 
                    : colors.primary.lavender,
                  fontWeight: index === items.length - 1 ? '600' : '400',
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text
              style={{
                fontFamily: typography.fonts.secondary,
                fontSize: typography.styles.body.size,
                color: colors.text.secondary,
                fontWeight: '400',
              }}
            >
              {item.label}
            </Text>
          )}
        </React.Fragment>
      ))}
    </View>
  );
};