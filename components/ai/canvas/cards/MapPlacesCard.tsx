import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import { useAIHaptics } from '@/hooks/useAIHaptics';
import { PinIcon, ArrowUpRight01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import type { UIDirective, DisplayItem } from '@/api/types/ai';

interface Props {
  directive: UIDirective;
  onClose: () => void;
}

interface Coord {
  latitude: number;
  longitude: number;
}

const MAX_GEOCODE = 8;

function openInMaps(item: DisplayItem) {
  const q = encodeURIComponent(item.location || item.title);
  Linking.openURL(`https://maps.google.com/?q=${q}`).catch(() => {
    if (item.url) Linking.openURL(item.url).catch(() => {});
  });
}

/**
 * Map-backed places card. Coordinates are resolved on-device (expo-location
 * forward geocoding of each place's address/name) so no backend geo data is
 * required. Degrades to a list if nothing geocodes. Glass stays on the host
 * chrome; the map + rows are a solid, legible surface.
 */
export function MapPlacesCard({ directive }: Props) {
  const { onTap } = useAIHaptics();
  const items = useMemo(() => directive.data?.items ?? [], [directive.data?.items]);
  const [coords, setCoords] = useState<Record<number, Coord>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const targets = items.slice(0, MAX_GEOCODE);
      const resolved = await Promise.allSettled(
        targets.map((it) => Location.geocodeAsync(it.location || it.title))
      );
      if (cancelled) return;
      const next: Record<number, Coord> = {};
      resolved.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value[0]) {
          next[i] = { latitude: r.value[0].latitude, longitude: r.value[0].longitude };
        }
      });
      setCoords(next);
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [items]);

  const region = useMemo<Region | undefined>(() => {
    const first = Object.values(coords)[0];
    if (!first) return undefined;
    return {
      latitude: first.latitude,
      longitude: first.longitude,
      latitudeDelta: 0.06,
      longitudeDelta: 0.06,
    };
  }, [coords]);

  const handleOpen = useCallback(
    (item: DisplayItem) => {
      onTap();
      openInMaps(item);
    },
    [onTap]
  );

  const hasMap = !!region;

  return (
    <View className="px-5 pt-2">
      <View className="mb-3 flex-row items-center gap-2">
        <HugeiconsIcon icon={PinIcon} size={18} color="#ff3e00" />
        <Text className="font-body-bold text-headline-3 text-charcoal-primary" numberOfLines={1}>
          {directive.title}
        </Text>
      </View>

      {hasMap && (
        <View className="mb-3 overflow-hidden rounded-2xl" style={{ height: 200 }}>
          <MapView style={{ flex: 1 }} initialRegion={region}>
            {items.map((item, i) =>
              coords[i] ? (
                <Marker
                  key={`${item.title}-${i}`}
                  coordinate={coords[i]}
                  title={item.title}
                  description={item.location}
                />
              ) : null
            )}
          </MapView>
        </View>
      )}

      <ScrollView
        className="max-h-[300px]"
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
                className="h-12 w-12 rounded-xl bg-stone-surface"
                resizeMode="cover"
              />
            ) : (
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-stone-surface">
                <HugeiconsIcon icon={PinIcon} size={18} color="#a7a7a7" />
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
              {!!item.rating && (
                <Text className="mt-0.5 font-mono-medium text-caption text-deep-amber">
                  ★ {item.rating}
                </Text>
              )}
            </View>
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} color="#848281" />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
