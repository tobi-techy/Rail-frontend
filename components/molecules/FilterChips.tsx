import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, ViewProps } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../design/tokens';

export interface FilterChip {
  id: string;
  label: string;
  value: string;
}

export interface FilterChipsProps extends ViewProps {
  chips: FilterChip[];
  selectedChips: string[];
  onChipPress: (chipValue: string) => void;
  onClearAll?: () => void;
  showClearAll?: boolean;
  className?: string;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  chips,
  selectedChips,
  onChipPress,
  onClearAll,
  showClearAll = true,
  className,
  style,
  ...props
}) => {
  const hasSelectedChips = selectedChips.length > 0;

  return (
    <View style={style} className={className} {...props}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
      >
        {showClearAll && hasSelectedChips && (
          <TouchableOpacity
            onPress={onClearAll}
            style={{
              backgroundColor: colors.semantic.destructive,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.full,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityLabel="Clear all filters"
            accessibilityRole="button"
          >
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontFamily: typography.fonts.caption, fontWeight: '500' }}>
              Clear All
            </Text>
          </TouchableOpacity>
        )}

        {chips.map((chip) => {
          const isSelected = selectedChips.includes(chip.value);

          return (
            <TouchableOpacity
              key={chip.id}
              onPress={() => onChipPress(chip.value)}
              style={{
                backgroundColor: isSelected ? colors.primary.accent : colors.background.surface,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: borderRadius.full,
                borderWidth: 1,
                borderColor: isSelected ? colors.primary.accent : colors.background.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              accessibilityLabel={`Filter by ${chip.label}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={{
                  color: isSelected ? '#FFFFFF' : colors.text.primary,
                  fontSize: 12,
                  fontFamily: typography.fonts.caption,
                  fontWeight: '500',
                }}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
