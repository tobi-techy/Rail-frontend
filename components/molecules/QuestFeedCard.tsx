import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Card } from '../atoms/Card';
import { Icon } from '../atoms/Icon';
import { Button } from '../atoms/Button';
import { colors, spacing, typography, shadows } from '../../design/tokens';

export interface QuestFeedCardProps {
  id: string;
  title: string;
  description: string;
  iconName: any;
  iconBackgroundColor?: string;
  onPress: (id: string) => void;
  className?: string;
}

export const QuestFeedCard: React.FC<QuestFeedCardProps> = ({
  id,
  title,
  description,
  iconName,
  iconBackgroundColor = `${colors.primary.accent}20`,
  onPress,
  className,
}) => {
  return (
    <TouchableOpacity onPress={() => onPress(id)} activeOpacity={0.8} className={className}>
      <Card padding="small" style={[shadows.card, { backgroundColor: colors.background.surface }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: spacing.md }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: iconBackgroundColor,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing.md,
              }}
            >
              <Icon library="feather" name={iconName} size={28} color={colors.text.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{ fontFamily: typography.fonts.headline2, fontSize: 18, color: colors.text.primary }}
                numberOfLines={1}
              >
                {title}
              </Text>
              <Text
                style={{ fontFamily: typography.fonts.caption, fontSize: 14, color: colors.text.secondary, marginTop: 2 }}
                numberOfLines={1}
              >
                {description}
              </Text>
            </View>
          </View>

          <Button
            title="Go"
            onPress={() => onPress(id)}
            variant="primary"
            size="sm"
            style={{ backgroundColor: colors.primary.accent, width: 70 }}
          />
        </View>
      </Card>
    </TouchableOpacity>
  );
};
