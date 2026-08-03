import React, { useEffect, useMemo, memo } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  type LayoutRectangle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Copy01Icon, Delete02Icon, RefreshIcon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import { PencilSimpleIcon } from 'phosphor-react-native';
import { useButtonFeedback } from '@/hooks/useButtonFeedback';

export interface MessageContextMenuProps {
  visible: boolean;
  onClose: () => void;
  onCopy: () => void;
  onEdit?: () => void;
  onRetry?: () => void;
  onDelete?: () => void;
  anchor: LayoutRectangle | null;
  isUser: boolean;
}

const MENU_WIDTH = 220;
const ITEM_HEIGHT = 50;
const ICON_COLOR = '#1C1C1E';

export const MessageContextMenu = memo(function MessageContextMenu({
  visible,
  onClose,
  onCopy,
  onEdit,
  onRetry,
  onDelete,
  anchor,
  isUser,
}: MessageContextMenuProps) {
  const scale = useSharedValue(0.92);
  const opacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const originY = useSharedValue(0);
  const triggerFeedback = useButtonFeedback();

  useEffect(() => {
    if (visible) {
      // Offset toward anchor for origin-aware scaling
      originY.value = anchor ? -4 : 0;
      opacity.value = withTiming(1, { duration: 140 });
      backdropOpacity.value = withTiming(1, { duration: 160 });
      scale.value = withSpring(1, { damping: 22, stiffness: 320 });
    } else {
      opacity.value = withTiming(0, { duration: 100 });
      backdropOpacity.value = withTiming(0, { duration: 100 });
      scale.value = withTiming(0.92, { duration: 100 });
    }
  }, [visible]);

  const menuStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: originY.value * (1 - scale.value) * 8 }, { scale: scale.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  const items = useMemo(
    () => [
      {
        id: 'copy',
        label: 'Copy',
        icon: <HugeiconsIcon icon={Copy01Icon} size={20} color={ICON_COLOR} weight="regular" />,
        onPress: () => {
          onClose();
          setTimeout(onCopy, 120);
        },
        destructive: false,
      },
      ...(isUser && onEdit
        ? [
            {
              id: 'edit',
              label: 'Edit',
              icon: <PencilSimpleIcon size={20} color={ICON_COLOR} weight="regular" />,
              onPress: () => {
                onClose();
                setTimeout(onEdit, 120);
              },
              destructive: false,
            },
          ]
        : []),
      ...(onRetry
        ? [
            {
              id: 'retry',
              label: isUser ? 'Retry' : 'Regenerate',
              icon: (
                <HugeiconsIcon icon={RefreshIcon} size={20} color={ICON_COLOR} weight="regular" />
              ),
              onPress: () => {
                onClose();
                setTimeout(onRetry, 120);
              },
              destructive: false,
            },
          ]
        : []),
      ...(onDelete
        ? [
            {
              id: 'delete',
              label: 'Delete',
              icon: (
                <HugeiconsIcon icon={Delete02Icon} size={20} color="#FF3B30" weight="regular" />
              ),
              onPress: () => {
                onClose();
                setTimeout(onDelete, 120);
              },
              destructive: true,
            },
          ]
        : []),
    ],
    [isUser, onCopy, onEdit, onRetry, onDelete, onClose]
  );

  if (!anchor) return null;

  const screenWidth = Dimensions.get('window').width;
  const menuHeight = items.length * ITEM_HEIGHT;
  const fitsAbove = anchor.y - 12 >= menuHeight;
  const top = fitsAbove ? anchor.y - menuHeight - 8 : anchor.y + anchor.height + 8;
  const left = isUser
    ? Math.max(8, anchor.x + anchor.width - MENU_WIDTH)
    : Math.min(anchor.x, screenWidth - MENU_WIDTH - 8);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View className="absolute inset-0 bg-black/[0.22]" style={backdropStyle} />
      </TouchableWithoutFeedback>

      <Animated.View
        className="absolute overflow-hidden rounded-[14px] bg-white"
        style={[
          menuStyle,
          {
            top,
            left,
            width: MENU_WIDTH,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.18,
            shadowRadius: 24,
            elevation: 12,
          },
        ]}>
        {items.map((item, i) => (
          <React.Fragment key={item.id}>
            <Pressable
              onPress={() => {
                triggerFeedback();
                item.onPress();
              }}
              className="flex-row items-center justify-between px-[18px] active:bg-black/[0.05]"
              style={{ height: ITEM_HEIGHT }}
              accessibilityRole="button"
              accessibilityLabel={item.label}>
              <Text
                className={`font-body-medium text-[16px] ${item.destructive ? 'text-[#FF3B30]' : 'text-[#1C1C1E]'}`}>
                {item.label}
              </Text>
              {item.icon}
            </Pressable>
            {i < items.length - 1 && <View className="h-[0.5px] bg-black/[0.08]" />}
          </React.Fragment>
        ))}
      </Animated.View>
    </Modal>
  );
});
