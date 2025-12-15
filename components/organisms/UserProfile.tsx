import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { typography } from '../../design/tokens';

export interface UserProfileProps {
  name: string;
  email?: string;
  avatar?: React.ReactNode;
  bio?: string;
  stats?: { label: string; value: string | number }[];
  actions?: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' }[];
  onEditPress?: () => void;
  className?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  name,
  email,
  avatar,
  bio,
  stats,
  actions,
  onEditPress,
  className,
}) => {
  return (
    <Card className={`p-6 ${className || ''}`}>
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-row items-center flex-1">
          {avatar && <View className="mr-4">{avatar}</View>}

          <View className="flex-1">
            <Text
              className="text-text-primary text-headline-2"
              style={{ fontFamily: typography.fonts.headline2 }}
              numberOfLines={2}
            >
              {name}
            </Text>
            {email && (
              <Text
                className="text-text-secondary text-caption mt-1"
                style={{ fontFamily: typography.fonts.caption }}
                numberOfLines={1}
              >
                {email}
              </Text>
            )}
          </View>
        </View>

        {onEditPress && (
          <TouchableOpacity
            onPress={onEditPress}
            className="p-2 -mr-2"
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <Text className="text-primary-accent text-caption font-subtitle">Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {bio && (
        <Text className="text-text-secondary text-body mb-4" style={{ fontFamily: typography.fonts.body }}>
          {bio}
        </Text>
      )}

      {stats && stats.length > 0 && (
        <View className="flex-row justify-around py-4 border-t border-b border-surface mb-4">
          {stats.map((stat, index) => (
            <View key={index} className="items-center">
              <Text className="text-text-primary text-subtitle" style={{ fontFamily: typography.fonts.headline2 }}>
                {stat.value}
              </Text>
              <Text className="text-text-secondary text-caption" style={{ fontFamily: typography.fonts.caption }}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      )}

      {actions && actions.length > 0 && (
        <View className="space-y-3">
          {actions.map((action, index) => (
            <Button key={index} title={action.label} variant={action.variant || 'primary'} onPress={action.onPress} className="w-full" />
          ))}
        </View>
      )}
    </Card>
  );
};
