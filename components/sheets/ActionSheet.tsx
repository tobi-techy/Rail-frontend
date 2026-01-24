import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight, LucideIcon } from 'lucide-react-native';
import { BottomSheet } from './BottomSheet';

interface ActionItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  onPress: () => void;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  illustration?: React.ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  title: string;
  subtitle?: string;
  actions: ActionItem[];
}

export function ActionSheet({
  visible,
  onClose,
  illustration,
  icon: HeaderIcon,
  iconColor = '#FF5A00',
  title,
  subtitle,
  actions,
}: ActionSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {/* Header */}
      <View className="mb-6 items-center pr-8">
        {illustration && <View className="mb-3">{illustration}</View>}
        {!illustration && HeaderIcon && <HeaderIcon size={32} color={iconColor} className="mb-2" />}
        <Text className="text-center font-subtitle text-xl text-text-primary">{title}</Text>
        {subtitle && (
          <Text className="mt-1 text-center font-caption text-[15px] leading-5 text-gray-400">
            {subtitle}
          </Text>
        )}
      </View>

      {/* Actions */}
      <>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <TouchableOpacity
              key={action.id}
              className="flex-row items-center py-4"
              onPress={() => {
                action.onPress();
                onClose();
              }}
              activeOpacity={0.7}>
              <View
                className="mr-4 h-11 w-11 items-center justify-center rounded-sm"
                style={{ backgroundColor: action.iconBgColor ?? '#F5F5F5' }}>
                <Icon size={22} color={action.iconColor ?? '#1B84FF'} />
              </View>
              <View className="flex-1">
                <Text className="font-subtitle text-lg text-text-primary">{action.label}</Text>
                {action.sublabel && (
                  <Text className="mt-0.5 font-caption text-sm text-text-secondary">
                    {action.sublabel}
                  </Text>
                )}
              </View>
              <ChevronRight size={20} color="#757575" />
            </TouchableOpacity>
          );
        })}
      </>
    </BottomSheet>
  );
}
