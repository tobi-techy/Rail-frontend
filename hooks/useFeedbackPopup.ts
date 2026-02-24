import { useCallback } from 'react';
import { useFeedbackPopupStore, type FeedbackPopupType } from '@/stores/feedbackPopupStore';

interface PopupOptions {
  duration?: number;
  action?: {
    label: string;
    onPress?: () => void;
  };
}

const showByType =
  (
    showPopup: ReturnType<typeof useFeedbackPopupStore.getState>['showPopup'],
    type: FeedbackPopupType
  ) =>
  (title: string, message?: string, options?: PopupOptions) => {
    showPopup({
      type,
      title,
      message,
      duration: options?.duration,
      action: options?.action,
    });
  };

export function useFeedbackPopup() {
  const showPopup = useFeedbackPopupStore((state) => state.showPopup);
  const dismissPopup = useFeedbackPopupStore((state) => state.dismissPopup);

  const showError = useCallback(showByType(showPopup, 'error'), [showPopup]);
  const showSuccess = useCallback(showByType(showPopup, 'success'), [showPopup]);
  const showWarning = useCallback(showByType(showPopup, 'warning'), [showPopup]);
  const showInfo = useCallback(showByType(showPopup, 'info'), [showPopup]);

  return {
    showPopup,
    dismissPopup,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  };
}

