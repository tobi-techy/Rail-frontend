import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  ViewProps,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import {
  VirtualCreditCard,
  VirtualCreditCardProps,
} from './VirtualCardDisplay';

export interface VirtualCreditCardFeedProps extends ViewProps {
  cards: VirtualCreditCardProps[];
  activeCardId?: string;
  onCardChange?: (card: VirtualCreditCardProps, index: number) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth * 0.85;
const spacing = 10;
const emptyItemWidth = (screenWidth - cardWidth) / 2;

export const VirtualCreditCardFeed: React.FC<VirtualCreditCardFeedProps> = ({
  cards,
  activeCardId,
  onCardChange,
  ...props
}) => {
  const listRef = useRef<FlatList<any>>(null);
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 70,
  }).current;

  const data = useMemo(
    () => [
      { id: 'left-spacer', type: 'spacer' as const },
      ...cards.map((card, index) => {
        const normalizedCard = {
          ...card,
          id: card.id ?? `card-${index}`,
        };

        return {
          id: normalizedCard.id,
          type: 'card' as const,
          card: normalizedCard,
          index,
        };
      }),
      { id: 'right-spacer', type: 'spacer' as const },
    ],
    [cards],
  );

  useEffect(() => {
    if (!activeCardId || !listRef.current) {
      return;
    }

    const targetIndex = data.findIndex(
      item => item.type === 'card' && item.id === activeCardId,
    );

    if (targetIndex > -1) {
      // Defer until list has measured layouts
      setTimeout(() => {
        try {
          listRef.current?.scrollToIndex({
            index: targetIndex,
            animated: true,
          });
        } catch {
          listRef.current?.scrollToOffset({
            offset: Math.max(targetIndex - 1, 0) * (cardWidth + spacing),
            animated: true,
          });
        }
      }, 0);
    }
  }, [activeCardId, data]);

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { item: any }[] }) => {
      const cardItem = viewableItems.find(
        ({ item }) => item.type === 'card',
      );

      if (cardItem && cardItem.item) {
        onCardChange?.(cardItem.item.card, cardItem.item.index);
      }
    },
  ).current;

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const offset = event.nativeEvent.contentOffset.x;
    const approximateIndex = Math.round(
      offset / (cardWidth + spacing),
    );
    const cardIndex = Math.min(
      cards.length - 1,
      Math.max(0, approximateIndex),
    );

    const currentCard = cards[cardIndex];
    if (currentCard) {
      const normalizedCard = {
        ...currentCard,
        id: currentCard.id ?? `card-${cardIndex}`,
      };
      onCardChange?.(normalizedCard, cardIndex);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === 'spacer') {
      return <View style={{ width: emptyItemWidth }} />;
    }

    return (
      <View style={{ width: cardWidth, marginHorizontal: spacing / 0 }}>
        <VirtualCreditCard {...item.card} />
      </View>
    );
  };

  return (
    <View {...props}>
      <FlatList
        ref={listRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        data={data}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        snapToAlignment="start"
        decelerationRate="fast"
        snapToInterval={cardWidth + spacing}
        contentContainerStyle={{ alignItems: 'center' }}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      />
    </View>
  );
};
