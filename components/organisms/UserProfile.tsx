import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { colors, typography, spacing, borderRadius } from '../../design/tokens';

export interface UserProfileProps {
  name: string;
  email?: string;
  avatar?: React.ReactNode;
  bio?: string;
  stats?: {
    label: string;
    value: string | number;
  }[];
  actions?: {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  }[];
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
      {/* Header with Avatar and Edit Button */}
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-row items-center flex-1">
          {/* Avatar */}
          {avatar && (
            <View className="mr-4">
              {avatar}
            </View>
          )}

          {/* Name and Email */}
          <View className="flex-1">
            <Text 
              className="text-[#000000] text-xl font-bold"
              style={{
                fontFamily: typography.fonts.primary,
                fontSize: typography.styles.h2.size,
                fontWeight: typography.weights.bold,
              }}
              numberOfLines={2}
            >
              {name}
            </Text>
            {email && (
              <Text 
                className="text-[#A0A0A0] text-sm mt-1"
                style={{
                  fontFamily: typography.fonts.secondary,
                  fontSize: typography.styles.label.size,
                }}
                numberOfLines={1}
              >
                {email}
              </Text>
            )}
          </View>
        </View>

        {/* Edit Button */}
        {onEditPress && (
          <TouchableOpacity
            onPress={onEditPress}
            className="p-2 -mr-2"
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <Text className="text-[#5852FF] text-sm font-medium">Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bio */}
      {bio && (
        <Text 
          className="text-[#545454] text-base mb-4"
          style={{
            fontFamily: typography.fonts.secondary,
            fontSize: typography.styles.body.size,
            lineHeight: typography.lineHeights.relaxed * typography.styles.body.size,
          }}
        >
          {bio}
        </Text>
      )}

      {/* Stats */}
      {stats && stats.length > 0 && (
        <View className="flex-row justify-around py-4 border-t border-b border-[#F7F7F7] mb-4">
          {stats.map((stat, index) => (
            <View key={index} className="items-center">
              <Text 
                className="text-[#000000] text-lg font-bold"
                style={{
                  fontFamily: typography.fonts.primary,
                  fontSize: typography.styles.h3.size,
                  fontWeight: typography.weights.bold,
                }}
              >
                {stat.value}
              </Text>
              <Text 
                className="text-[#A0A0A0] text-sm"
                style={{
                  fontFamily: typography.fonts.secondary,
                  fontSize: typography.styles.label.size,
                }}
              >
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      {actions && actions.length > 0 && (
        <View className="space-y-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              title={action.label}
              variant={action.variant || 'primary'}
              onPress={action.onPress}
              className="w-full"
            />
          ))}
        </View>
      )}
    </Card>
  );
};