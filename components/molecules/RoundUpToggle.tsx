import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../design/tokens';
import { ToggleSwitch } from '../atoms/ToggleSwitch';
import { Icon } from '../atoms/Icon';

export interface RoundUpToggleProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  roundUpAmount?: number;
  currency?: string;
  onInfoPress?: () => void;
  className?: string;
  testID?: string;
}

export const RoundUpToggle: React.FC<RoundUpToggleProps> = ({
  isEnabled,
  onToggle,
  roundUpAmount = 0,
  currency = 'USD',
  onInfoPress,
  className,
  testID,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <View
      style={{
        backgroundColor: colors.surface.card,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
      }}
      className={className}
      testID={testID}
    >
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: spacing.md 
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Text
            style={[
              {
                fontFamily: typography.fonts.primary,
                fontSize: typography.styles.body.size,
                fontWeight: typography.styles.body.weight,
              },
              { color: colors.text.primary }
            ]}
          >
            Round-up Savings
          </Text>
          
          {onInfoPress && (
            <TouchableOpacity
              onPress={onInfoPress}
              style={{ marginLeft: spacing.xs }}
              testID={`${testID}-info`}
            >
              <Icon
                name="information-circle-outline"
                library="ionicons"
                size={20}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
          )}
        </View>

        <ToggleSwitch
          value={isEnabled}
          onValueChange={onToggle}
        />
      </View>

      {/* Description */}
      <Text
        style={[
          {
            fontFamily: typography.fonts.secondary,
            fontSize: typography.styles.caption.size,
            fontWeight: typography.styles.caption.weight,
            marginBottom: spacing.md,
          },
          { color: colors.text.secondary }
        ]}
      >
        {isEnabled 
          ? 'Automatically round up purchases and save the spare change'
          : 'Turn on to start saving spare change from your purchases'
        }
      </Text>

      {/* Round-up Amount Display */}
      {isEnabled && roundUpAmount > 0 && (
        <View style={{
          backgroundColor: colors.accent.limeGreen + '20', // 20% opacity
          borderRadius: borderRadius.md,
          padding: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <Icon
            name="trending-up"
            library="ionicons"
            size={16}
            color={colors.accent.limeGreen}
            style={{ marginRight: spacing.xs }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                {
                  fontFamily: typography.fonts.secondary,
                  fontSize: typography.styles.caption.size,
                  fontWeight: typography.styles.caption.weight,
                },
                { color: colors.text.secondary }
              ]}
            >
              Total saved this month
            </Text>
            <Text
              style={[
                {
                  fontFamily: typography.fonts.primary,
                  fontSize: typography.styles.label.size,
                  fontWeight: typography.styles.label.weight,
                },
                { color: colors.accent.limeGreen }
              ]}
            >
              {formatCurrency(roundUpAmount)}
            </Text>
          </View>
        </View>
      )}

      {/* Example Display */}
      {isEnabled && (
        <View style={{
          backgroundColor: colors.surface.light,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          marginTop: spacing.md,
        }}>
          <Text
            style={[
              {
                fontFamily: typography.fonts.secondary,
                fontSize: typography.styles.caption.size,
                fontWeight: typography.styles.caption.weight,
                marginBottom: spacing.xs,
              },
              { color: colors.text.secondary }
            ]}
          >
            Example:
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text
              style={[
                {
                  fontFamily: typography.fonts.secondary,
                  fontSize: typography.styles.caption.size,
                  fontWeight: typography.styles.caption.weight,
                },
                { color: colors.text.primary }
              ]}
            >
              Purchase: $4.25
            </Text>
            <Text
              style={[
                {
                  fontFamily: typography.fonts.secondary,
                  fontSize: typography.styles.caption.size,
                  fontWeight: typography.styles.caption.weight,
                },
                { color: colors.accent.limeGreen }
              ]}
            >
              Round-up: $0.75
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};