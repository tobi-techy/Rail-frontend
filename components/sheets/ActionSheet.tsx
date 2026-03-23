import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import type { HugeiconsProps } from '@hugeicons/react-native';

type HugeIconType = HugeiconsProps['icon'];

interface ActionItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: HugeIconType | React.ReactNode;
  iconColor?: string;
  iconBgColor?: string;
  onPress: () => void;
  badge?: string;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  illustration?: React.ReactNode;
  icon?: HugeIconType;
  iconColor?: string;
  title: string;
  subtitle?: string;
  actions: ActionItem[];
}

const isHugeIcon = (icon: HugeIconType | React.ReactNode): icon is HugeIconType =>
  Array.isArray(icon);

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
  const handleActionPress = (action: ActionItem) => {
    action.onPress();
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {/* Header */}
      <View className="mb-6">
        {illustration && <View className="mb-3">{illustration}</View>}
        {!illustration && HeaderIcon && (
          <HugeiconsIcon icon={HeaderIcon} size={32} color={iconColor} />
        )}
        <Text className="font-subtitle text-xl text-text-primary">{title}</Text>
        {subtitle && (
          <Text className="mt-1 font-caption text-sm leading-5 text-gray-500">{subtitle}</Text>
        )}
      </View>

      {/* Actions - Scrollable if needed */}
      <ScrollView
        scrollEnabled={actions.length > 6}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 4 }}>
        {actions.map((action) => {
          const Icon = action.icon;
          const isElement = React.isValidElement(Icon);
          return (
            <TouchableOpacity
              key={action.id}
              className="flex-row items-center justify-between rounded-2xl px-0 py-3.5 active:bg-gray-50"
              onPress={() => handleActionPress(action)}
              activeOpacity={0.6}>
              <View className="flex-1 flex-row items-center">
                <View
                  className="mr-4 h-11 w-11 items-center justify-center rounded-full"
                  style={{ backgroundColor: action.iconBgColor ?? '#F5F5F5' }}>
                  {isElement
                    ? Icon
                    : isHugeIcon(Icon) && (
                        <HugeiconsIcon
                          icon={Icon}
                          size={22}
                          color={action.iconColor ?? '#1B84FF'}
                        />
                      )}
                </View>
                <View className="flex-1">
                  <Text className="font-subtitle text-base text-text-primary">{action.label}</Text>
                  {action.sublabel && (
                    <Text className="mt-0.5 font-caption text-[12px] text-text-secondary">
                      {action.sublabel}
                    </Text>
                  )}
                </View>
              </View>

              {action.badge && (
                <View className="mr-3 rounded-full bg-pink-100 px-2.5 py-0.5">
                  <Text className="font-button text-[11px] text-pink-600">{action.badge}</Text>
                </View>
              )}

              <HugeiconsIcon icon={ArrowRight01Icon} size={20} color="#9CA3AF" />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </BottomSheet>
  );
}
