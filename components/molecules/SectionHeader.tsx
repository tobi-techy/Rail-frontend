import React from 'react';
import { View, Text } from 'react-native';
import { Icon } from '../atoms/Icon';
import { colors, spacing } from '../../design/tokens';

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
      <Text className="font-headline-2 text-headline-2 text-text-primary">{title}</Text>

      {timeRemaining && (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon
            name="time"
            library="ionicons"
            size={16}
            color={colors.semantic.destructive}
            style={{ marginRight: spacing.xs }}
          />
          <Text className="font-caption text-caption text-destructive uppercase">{timeRemaining}</Text>
        </View>
      )}
    </View>
  );
};
