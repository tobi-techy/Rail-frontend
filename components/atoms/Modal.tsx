import React from 'react';
import { View, Modal as RNModal, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
}) => (
  <RNModal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
    <TouchableOpacity
      style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}
      activeOpacity={1}
      onPress={closeOnBackdrop ? onClose : undefined}>
      <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
        <View
          className={`max-w-[90%] rounded-lg bg-white p-5 ${className || ''}`}
          style={[{ maxHeight: '80%' }, style]}>
          {showCloseButton && (
            <TouchableOpacity
              style={{
                alignSelf: 'flex-end',
                padding: 8,
                marginBottom: 8,
                minHeight: 44,
                minWidth: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={onClose}
              accessibilityLabel="Close modal"
              accessibilityRole="button">
              <Ionicons name="close" size={24} color="#757575" />
            </TouchableOpacity>
          )}
          {children}
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  </RNModal>
);
