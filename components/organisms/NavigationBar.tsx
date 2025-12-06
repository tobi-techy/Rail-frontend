import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { colors, typography, spacing } from '../../design/tokens';

export interface NavigationTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  onPress: () => void;
}

export interface NavigationBarProps {
  tabs: NavigationTab[];
  activeTabId: string;
  backgroundColor?: string;
  className?: string;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  tabs,
  activeTabId,
  backgroundColor = colors.background.main,
  className,
}) => {
  return (
    <SafeAreaView style={{ backgroundColor }}>
      <View 
        className={`
          flex-row items-center justify-around py-2 px-4
          border-t border-[#F7F7F7]
          ${className || ''}
        `}
        style={{ backgroundColor }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={tab.onPress}
              className="flex-1 items-center py-2"
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
            >
              {/* Icon Container */}
              <View className="relative mb-1">
                {/* Icon */}
                {tab.icon && (
                  <View className={isActive ? 'opacity-100' : 'opacity-60'}>
                    {tab.icon}
                  </View>
                )}

                {/* Badge */}
                {tab.badge && (
                  <View 
                    className="absolute -top-1 -right-1 bg-[#DC3545] rounded-full min-w-[16px] h-4 items-center justify-center px-1"
                  >
                    <Text 
                      className="text-white text-xs font-medium"
                      style={{
                        fontFamily: typography.fonts.secondary,
                        fontSize: 10,
                        fontWeight: typography.weights.medium,
                      }}
                    >
                      {typeof tab.badge === 'number' && tab.badge > 99 ? '99+' : tab.badge}
                    </Text>
                  </View>
                )}
              </View>

              {/* Label */}
              <Text 
                className={`text-xs font-medium ${
                  isActive ? 'text-[#5852FF]' : 'text-[#A0A0A0]'
                }`}
                style={{
                  fontFamily: typography.fonts.secondary,
                  fontSize: 10,
                  fontWeight: typography.weights.medium,
                }}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};