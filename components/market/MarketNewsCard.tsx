import React, { useCallback } from 'react';
import { Image, Linking, Pressable, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Tag } from 'lucide-react-native';
import type { MarketNewsItem } from '@/api/types';

const toRelativeTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  return `${Math.floor(diff / day)}d ago`;
};

export function MarketNewsCard({
  item,
  compact = false,
}: {
  item: MarketNewsItem;
  compact?: boolean;
}) {
  const estimateReadTime = (text?: string): string => {
    const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(words / 220));
    return `${minutes} min read`;
  };

  const onPress = useCallback(() => {
    if (!item.url) return;
    WebBrowser.openBrowserAsync(item.url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      controlsColor: '#111111',
      showInRecents: true,
    }).catch(() => {
      Linking.openURL(item.url).catch(() => {});
    });
  }, [item.url]);

  const readTime = estimateReadTime(item.content_preview || item.summary);
  const metaText = [toRelativeTime(item.published_at), readTime].filter(Boolean).join(' • ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open news: ${item.title}`}
      className={`rounded-md border border-surface bg-white ${compact ? 'mb-2 p-3' : 'mb-3 p-md'}`}>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="font-caption text-caption text-text-secondary">
          {item.source || 'News'}
        </Text>
        <Text className="font-caption text-caption text-text-secondary">{metaText}</Text>
      </View>

      <Text className="font-subtitle text-body text-text-primary" numberOfLines={compact ? 1 : 2}>
        {item.title}
      </Text>

      {!compact && item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          className="mt-3 h-32 w-full rounded-sm bg-surface"
        />
      ) : null}

      {item.summary ? (
        <Text
          className="mt-2 font-caption text-caption text-text-secondary"
          numberOfLines={compact ? 1 : 2}>
          {item.summary}
        </Text>
      ) : null}

      {item.related_symbols?.length > 0 ? (
        <View className="mt-3 flex-row items-center">
          <Tag size={14} color="#757575" />
          <Text className="ml-2 font-caption text-caption text-text-secondary" numberOfLines={1}>
            {item.related_symbols.slice(0, 4).join(', ')}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
