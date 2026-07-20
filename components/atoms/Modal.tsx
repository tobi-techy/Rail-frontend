import React from 'react';
import { View, Modal as RNModal, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useButtonFeedback } from '@/hooks/useButtonFeedback';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import { ImpactFeedbackStyle } from '@/utils/platformHaptics';

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
  const triggerFeedback = useButtonFeedback();
  const { impact } = useHaptics();
  return (
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
        onPress={
          closeOnBackdrop
            ? () => {
                impact(ImpactFeedbackStyle.Light);
                playUISound('dismiss');
                onClose();
              }
            : undefined
        }>
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View
            className={`max-w-[90%] rounded-lg bg-parchment-card p-5 ${className || ''}`}
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
                onPress={() => {
                  triggerFeedback();
                  onClose();
                }}
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
};
