import React from 'react';
import { View, Modal as RNModal, TouchableOpacity, Text, ViewStyle } from 'react-native';
import { colors, borderRadius } from '../../design/tokens';

export interface ModalProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  className?: string;
  style?: ViewStyle;
}

export const Modal: React.FC<ModalProps> = ({
  isVisible,
  onClose,
  children,
  showCloseButton = true,
  closeOnBackdrop = true,
  className,
  style,
}) => {
  const backdropStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.overlay, // rgba(0, 0, 0, 0.5)
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  };

  const modalContentStyle: ViewStyle = {
    backgroundColor: colors.background.main, // #FFFFFF
    borderRadius: borderRadius.modal, // 24px from design.json
    padding: 20,
    maxWidth: '90%',
    maxHeight: '80%',
  };

  const closeButtonStyle: ViewStyle = {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 8,
  };

  const closeButtonTextStyle = {
    fontSize: 18,
    color: colors.text.secondary,
    fontWeight: 'bold' as const,
  };

  const combinedModalStyle = [modalContentStyle, style];

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  return (
    <RNModal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={backdropStyle}
        activeOpacity={1}
        onPress={handleBackdropPress}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            className={className}
            style={combinedModalStyle}
          >
            {showCloseButton && (
              <TouchableOpacity
                style={closeButtonStyle}
                onPress={onClose}
                accessibilityLabel="Close modal"
                accessibilityRole="button"
              >
                <Text style={closeButtonTextStyle}>×</Text>
              </TouchableOpacity>
            )}
            {children}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </RNModal>
  );
};