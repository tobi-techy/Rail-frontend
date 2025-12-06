import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  TouchableWithoutFeedback,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { Icon } from '../atoms/Icon';
import { colors, typography, spacing, shadows } from '../../design/tokens';

export interface DrawerItem {
  id: string;
  label: string;
  icon?: string;
  iconLibrary?: 'ionicons' | 'material' | 'feather';
  onPress: () => void;
  badge?: string | number;
  disabled?: boolean;
}

export interface DrawerProps {
  isVisible: boolean;
  onClose: () => void;
  items: DrawerItem[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  position?: 'left' | 'right';
  className?: string;
  testID?: string;
}

const { width: screenWidth } = Dimensions.get('window');

export const Drawer: React.FC<DrawerProps> = ({
  isVisible,
  onClose,
  items,
  header,
  footer,
  width = screenWidth * 0.8,
  position = 'left',
  className,
  testID,
}) => {
  const slideAnim = useRef(new Animated.Value(position === 'left' ? -width : width)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: position === 'left' ? -width : width,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, slideAnim, overlayAnim, width, position]);

  if (!isVisible) {
    return null;
  }

  return (
    <View
      className={`absolute inset-0 z-50 ${className || ''}`}
      testID={testID}
    >
      {/* Overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          className="absolute inset-0"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            opacity: overlayAnim,
          }}
        />
      </TouchableWithoutFeedback>

      {/* Drawer */}
      <Animated.View
        className="absolute top-0 bottom-0"
        style={[
          {
            width,
            backgroundColor: colors.surface.light,
            transform: [{ translateX: slideAnim }],
            ...shadows.md,
          },
          position === 'left' ? { left: 0 } : { right: 0 },
        ]}
      >
        <SafeAreaView className="flex-1">
          {/* Header */}
          {header && (
            <View
              style={{
                padding: spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: colors.border.secondary,
              }}
            >
              {header}
            </View>
          )}

          {/* Close Button */}
          <View
            className="flex-row justify-end"
            style={{
              padding: spacing.md,
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              className="p-2"
              accessibilityRole="button"
              accessibilityLabel="Close drawer"
            >
              <Icon
                name="close"
                library="ionicons"
                size={24}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
          </View>

          {/* Items */}
          <ScrollView className="flex-1">
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={item.onPress}
                disabled={item.disabled}
                className={`flex-row items-center px-6 py-4 ${
                  item.disabled ? 'opacity-50' : ''
                }`}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                {item.icon && (
                  <View className="mr-4">
                    <Icon
                      name={item.icon}
                      library={item.iconLibrary || 'ionicons'}
                      size={24}
                      color={item.disabled ? colors.text.tertiary : colors.text.primary}
                    />
                  </View>
                )}

                <Text
                  className="flex-1"
                  style={{
                    fontFamily: typography.fonts.secondary,
                    fontSize: typography.styles.body.size,
                    color: item.disabled ? colors.text.tertiary : colors.text.primary,
                    fontWeight: '500',
                  }}
                >
                  {item.label}
                </Text>

                {item.badge && (
                  <View
                    className="rounded-full px-2 py-1 ml-2"
                    style={{
                      backgroundColor: colors.accent.limeGreen,
                      minWidth: 20,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: typography.fonts.secondary,
                        fontSize: 12,
                        color: colors.text.onPrimary,
                        fontWeight: '600',
                      }}
                    >
                      {item.badge}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Footer */}
          {footer && (
            <View
              style={{
                padding: spacing.lg,
                borderTopWidth: 1,
                borderTopColor: colors.border.secondary,
              }}
            >
              {footer}
            </View>
          )}
        </SafeAreaView>
      </Animated.View>
    </View>
  );
};