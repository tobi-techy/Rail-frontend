import React from 'react';
import { View, Text } from 'react-native';
import { Icon } from '../atoms/Icon';
import {
  colors,
  typography,
  spacing,
} from '../../design/tokens';

export interface SectionHeaderProps {
  title: string;
  timeRemaining?: string;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  timeRemaining,
  className,
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
      }}
      className={className}
    >
      <Text className="font-body-bold text-body-lg text-text-primary">
        {title}
      </Text>
      
      {timeRemaining && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Icon
            name="time"
            library="ionicons"
            size={16}
            color={colors.semantic.warning}
            style={{ marginRight: spacing.xs }}
          />
          <Text className="font-heading text-body-xs text-semantic-warning uppercase">
            {timeRemaining}
          </Text>
        </View>
      )}
    </View>
  );
};
