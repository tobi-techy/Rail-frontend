import { create } from 'zustand';

export type FeedbackPopupType = 'success' | 'error' | 'warning' | 'info';

export interface FeedbackPopupAction {
  label: string;
  onPress?: () => void;
}

export interface FeedbackPopupPayload {
  id: number;
  type: FeedbackPopupType;
  title: string;
  message?: string;
  duration?: number;
  action?: FeedbackPopupAction;
}

type NewFeedbackPopupPayload = Omit<FeedbackPopupPayload, 'id'>;

interface FeedbackPopupState {
  popup: FeedbackPopupPayload | null;
  showPopup: (payload: NewFeedbackPopupPayload) => void;
  dismissPopup: () => void;
}

let popupId = 0;

export const useFeedbackPopupStore = create<FeedbackPopupState>((set) => ({
  popup: null,
  showPopup: (payload) =>
    set({
      popup: {
        ...payload,
        id: ++popupId,
      },
    }),
  dismissPopup: () => set({ popup: null }),
}));

