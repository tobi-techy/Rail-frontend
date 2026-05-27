import React from 'react';
import { GorhomBottomSheet } from './GorhomBottomSheet';
import { Text } from 'react-native';

interface StashPerformanceSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function StashPerformanceSheet({ visible, onClose }: StashPerformanceSheetProps) {
  return (
    <GorhomBottomSheet visible={visible} onClose={onClose} showCloseButton={false} dismissible>
      <Text>Hello Stash</Text>
    </GorhomBottomSheet>
  );
}
