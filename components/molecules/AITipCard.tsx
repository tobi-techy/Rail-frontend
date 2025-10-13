import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Card } from '../atoms/Card';
import { Icon } from '../atoms/Icon';
import {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
} from '../../design/tokens';

export interface AITipCardProps {
  id: string;
  title: string;
  content: string;
  category: 'market' | 'portfolio' | 'education' | 'strategy';
  readTime: number;
  isBookmarked: boolean;
  onPress: (id: string) => void;
  onBookmark: (id: string) => void;
  className?: string; // FIX: Added className to the props interface
}

export const AITipCard: React.FC<AITipCardProps> = ({
  id,
  title,
  content,
  category,
  readTime,
  isBookmarked,
  onPress,
  onBookmark,
  className, // Destructure className
}) => {
  const categoryStyles = {
    market: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      icon: 'trending-up',
    },
    portfolio: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      icon: 'briefcase',
    },
    education: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      icon: 'book-open',
    },
    strategy: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      icon: 'target',
    },
  };

  const styles = categoryStyles[category];

  return (
    <TouchableOpacity
      onPress={() => onPress(id)}
      activeOpacity={0.8}
      className={className}
    >
      <Card
        variant="default"
        padding="large"
        style={[shadows.md, { backgroundColor: colors.surface.card }]}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.md,
          }}
        >
          <View
            className={styles.bg}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: spacing.xs,
              paddingHorizontal: spacing.sm,
              borderRadius: borderRadius.md,
            }}
          >
            <Icon
              library="feather"
              name={styles.icon as any}
              size={14}
              color={colors.text.primary}
            />
            <Text
              className={styles.text}
              style={{
                marginLeft: spacing.xs,
                fontFamily: typography.fonts.secondary,
                fontWeight: typography.weights.medium,
                fontSize: 12,
                textTransform: 'uppercase',
              }}
            >
              {category}
            </Text>
          </View>
          <TouchableOpacity onPress={() => onBookmark(id)}>
            <Icon
              library="feather"
              name={isBookmarked ? 'bookmark' : 'bookmark'}
              size={20}
              color={
                isBookmarked ? colors.primary.lavender : colors.text.tertiary
              }
            />
          </TouchableOpacity>
        </View>

        <Text
          style={{
            fontFamily: typography.fonts.primary,
            fontSize: 20,
            fontWeight: typography.weights.bold,
            color: colors.text.primary,
            marginBottom: spacing.sm,
          }}
          numberOfLines={2}
        >
          {title}
        </Text>

        <Text
          style={{
            fontFamily: typography.fonts.primary,
            fontSize: 15,
            color: colors.text.secondary,
            lineHeight: 22,
            marginBottom: spacing.lg,
          }}
          numberOfLines={3}
        >
          {content}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text
            style={{
              fontFamily: typography.fonts.secondary,
              fontSize: 14,
              color: colors.text.tertiary,
            }}
          >
            {readTime} min read
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: typography.fonts.primary,
                fontSize: 14,
                fontWeight: typography.weights.medium,
                color: colors.primary.lavender,
                marginRight: spacing.xs,
              }}
            >
              Read Tip
            </Text>
            <Icon
              library="feather"
              name="arrow-right"
              size={16}
              color={colors.primary.lavender}
            />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};
