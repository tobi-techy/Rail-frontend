import React, { useCallback } from 'react';
import { View, Text, Image, ScrollView, Pressable } from 'react-native';
import * as Linking from 'expo-linking';
import { useAIHaptics } from '@/hooks/useAIHaptics';
import {
  PinIcon,
  Airplane01Icon,
  ShoppingBag01Icon,
  ArrowUpRight01Icon,
  IconComponent as HugeiconsIcon,
  type PhosphorIcon,
} from '@/lib/icons';
import type { UIDirective, DisplayItem } from '@/api/types/ai';

interface Props {
  directive: UIDirective;
  onClose: () => void;
}

function headerIcon(card: UIDirective['card']): PhosphorIcon {
  if (card === 'places') return PinIcon;
  if (card === 'flights') return Airplane01Icon;
  return ShoppingBag01Icon;
}

function openItem(item: DisplayItem, isPlace: boolean) {
  if (isPlace) {
    const q = encodeURIComponent(item.location || item.title);
    // Apple/Google Maps both honor this geo query scheme.
    Linking.openURL(`https://maps.google.com/?q=${q}`).catch(() => {
      if (item.url) Linking.openURL(item.url).catch(() => {});
    });
    return;
  }
  if (item.url) Linking.openURL(item.url).catch(() => {});
}

/** Places / flights / recommendations — a list-first card. Glass lives on the
 *  chrome (host); this body is a solid, legible surface for scannable results. */
export function RecommendationsCard({ directive, onClose }: Props) {
  const { onTap } = useAIHaptics();
  const items = directive.data?.items ?? [];
  const isPlace = directive.card === 'places';
  const budget = directive.data?.user_spend_balance;

  const handleOpen = useCallback(
    (item: DisplayItem) => {
      onTap();
      openItem(item, isPlace);
    },
    [onTap, isPlace]
  );

  return (
    <View className="px-5 pt-2">
      {/* Header */}
      <View className="mb-1 flex-row items-center gap-2">
        <HugeiconsIcon icon={headerIcon(directive.card)} size={18} color="#ff3e00" />
        <Text className="font-body-bold text-headline-3 text-charcoal-primary" numberOfLines={1}>
          {directive.title}
        </Text>
      </View>
      {!!directive.subtitle && (
        <Text className="mb-3 font-body text-caption text-ash" numberOfLines={1}>
          {directive.subtitle}
        </Text>
      )}

      <ScrollView
        className="max-h-[440px]"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 8 }}>
        {items.map((item, i) => (
          <Pressable
            key={`${item.title}-${i}`}
            onPress={() => handleOpen(item)}
            className="mb-2 flex-row items-center gap-3 rounded-2xl bg-warm-canvas p-3 active:opacity-70">
            {item.image_url ? (
              <Image
                source={{ uri: item.image_url }}
                className="h-14 w-14 rounded-xl bg-stone-surface"
                resizeMode="cover"
              />
            ) : (
              <View className="h-14 w-14 items-center justify-center rounded-xl bg-stone-surface">
                <HugeiconsIcon icon={headerIcon(directive.card)} size={20} color="#a7a7a7" />
              </View>
            )}

            <View className="flex-1">
              <Text className="font-body-medium text-body text-charcoal-primary" numberOfLines={1}>
                {item.title}
              </Text>
              {!!(item.location || item.subtitle) && (
                <Text className="font-body text-caption text-ash" numberOfLines={1}>
                  {item.location || item.subtitle}
                </Text>
              )}
              <View className="mt-0.5 flex-row items-center gap-2">
                {!!item.rating && (
                  <Text className="font-mono-medium text-caption text-deep-amber">
                    ★ {item.rating}
                  </Text>
                )}
                {!!item.price && (
                  <Text className="font-mono-medium text-caption text-charcoal-primary">
                    {item.price}
                  </Text>
                )}
                {!!item.meta && (
                  <Text className="font-body text-caption text-ash" numberOfLines={1}>
                    {item.meta}
                  </Text>
                )}
              </View>
            </View>

            <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} color="#848281" />
          </Pressable>
        ))}

        {items.length === 0 && (
          <Text className="py-6 text-center font-body text-caption text-ash">
            Nothing to show yet.
          </Text>
        )}
      </ScrollView>

      {!!budget && (
        <Text className="mt-1 font-mono-medium text-caption text-ash">
          Your spend balance: {budget}
        </Text>
      )}
    </View>
  );
}
