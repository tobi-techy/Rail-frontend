import { useCallback, useRef, useState } from 'react';
import { type FlatList, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';

const SCROLL_BUTTON_THRESHOLD = 220;

export function useAutoScroll() {
  const scrollRef = useRef<FlatList>(null);
  const contentHeightRef = useRef(0);
  const scrollOffsetRef = useRef(0);
  const listHeightRef = useRef(0);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const isNearBottom = useCallback(() => {
    const distance = contentHeightRef.current - scrollOffsetRef.current - listHeightRef.current;
    return distance < SCROLL_BUTTON_THRESHOLD;
  }, []);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
      setShowScrollBtn(!isNearBottom());
    },
    [isNearBottom]
  );

  const scrollToBottom = useCallback((animated = true) => {
    scrollRef.current?.scrollToEnd({ animated });
    setShowScrollBtn(false);
  }, []);

  const handleContentSizeChange = useCallback((_: number, h: number) => {
    contentHeightRef.current = h;
  }, []);

  const handleLayout = useCallback((e: { nativeEvent: { layout: { height: number } } }) => {
    listHeightRef.current = e.nativeEvent.layout.height;
  }, []);

  return {
    scrollRef,
    showScrollBtn,
    isNearBottom,
    handleScroll,
    scrollToBottom,
    handleContentSizeChange,
    handleLayout,
  };
}
