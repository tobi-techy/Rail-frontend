import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  Switch,
  SwitchProps,
} from 'react-native';
import { useButtonFeedback } from '@/hooks/useButtonFeedback';
import { playUISound } from '@/lib/uiSounds';
import { IconComponent } from '@/lib/icons';
import type { PhosphorIcon } from '@/lib/icons';

export interface ListItemProps extends TouchableOpacityProps {
  title: string;
  subtitle?: string;
  icon?: PhosphorIcon;
  iconSize?: number;
  iconColor?: string;
  iconBg?: string;
  /** Render the icon inside a rounded square tile. */
  iconTile?: boolean;
  rightIcon?: React.ReactNode;
  rightText?: string;
  rightElement?: React.ReactNode;
  /** Render a native Switch on the right; the row becomes non-tappable unless onPress is also provided. */
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  toggleProps?: Partial<SwitchProps>;
  /** Destructive label styling for log out / delete account rows. */
  destructive?: boolean;
  onPress?: () => void;
  showDivider?: boolean;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  icon,
  iconSize = 18,
  iconColor = '#343433',
  iconBg = '#f2f2f2',
  iconTile = false,
  rightIcon,
  rightText,
  rightElement,
  toggle = false,
  toggleValue,
  onToggle,
  toggleProps,
  destructive = false,
  onPress,
  showDivider = true,
  className,
  titleClassName,
  subtitleClassName,
  ...props
}) => {
  const Component = onPress && !toggle ? TouchableOpacity : View;
  const triggerFeedback = useButtonFeedback();

  const handlePress = () => {
    if (!toggle) triggerFeedback();
    onPress?.();
  };

  const handleToggle = (value: boolean) => {
    playUISound('toggle');
    onToggle?.(value);
  };

  const titleColor = destructive ? 'text-destructive' : 'text-text-primary';
  const iconColorResolved = destructive ? '#ff2b3a' : iconColor;

  const leftIconNode = icon ? (
    <View
      className={`mr-3 items-center justify-center ${iconTile ? 'h-8 w-8 rounded-lg' : 'h-6 w-6'}`}
      style={iconTile ? { backgroundColor: iconBg } : undefined}>
      <IconComponent icon={icon} size={iconSize} color={iconColorResolved} />
    </View>
  ) : null;

  const accessibilityLabel = `${title}${subtitle ? `, ${subtitle}` : ''}${rightText ? `, ${rightText}` : ''}`;

  return (
    <>
      <Component
        onPress={handlePress}
        className={`min-h-[56px] flex-row items-center px-4 py-4 ${onPress && !toggle ? 'active:bg-surface' : ''} ${className || ''}`}
        accessibilityRole={toggle ? 'switch' : onPress ? 'button' : undefined}
        accessibilityState={toggle ? { checked: !!toggleValue } : undefined}
        accessibilityLabel={accessibilityLabel}
        {...props}>
        {leftIconNode}

        <View className="flex-1">
          <Text
            className={`font-body text-body ${titleColor} ${titleClassName || ''}`}
            numberOfLines={1}
            maxFontSizeMultiplier={1.3}>
            {title}
          </Text>
          {subtitle && (
            <Text
              className={`mt-1 font-caption text-caption text-text-secondary ${subtitleClassName || ''}`}
              numberOfLines={2}
              maxFontSizeMultiplier={1.4}>
              {subtitle}
            </Text>
          )}
        </View>

        {(rightText || rightIcon || rightElement || toggle) && (
          <View className="ml-3 flex-row items-center">
            {rightText && !toggle && (
              <Text className="mr-2 font-caption text-caption text-text-secondary">
                {rightText}
              </Text>
            )}
            {rightIcon}
            {rightElement}
            {toggle && (
              <Switch
                value={toggleValue}
                onValueChange={handleToggle}
                accessibilityLabel={accessibilityLabel}
                {...toggleProps}
              />
            )}
          </View>
        )}
      </Component>

      {showDivider && <View className="ml-14 h-px bg-surface" />}
    </>
  );
};
