import React from 'react';
import { View, Text } from 'react-native';
import { Button } from '@/components/ui';
import type { UIDirective } from '@/api/types/ai';

interface Props {
  directive: UIDirective;
  onClose: () => void;
}

/** Generic fallback card — title, subtitle, and any items rendered as a simple
 *  legible list. Used for `info` directives and unknown card types. */
export function InfoCard({ directive, onClose }: Props) {
  const items = directive.data?.items ?? [];
  return (
    <View className="px-6 pb-2 pt-4">
      <Text className="mb-1 font-body-bold text-headline-3 text-charcoal-primary">
        {directive.title}
      </Text>
      {!!directive.subtitle && (
        <Text className="mb-4 font-body text-caption text-ash">{directive.subtitle}</Text>
      )}

      {items.map((item, i) => (
        <View key={`${item.title}-${i}`} className="mb-3">
          <Text className="font-body-medium text-body text-charcoal-primary">{item.title}</Text>
          {!!item.description && (
            <Text className="font-body text-caption text-graphite">{item.description}</Text>
          )}
        </View>
      ))}

      <Button title="Got it" variant="black" onPress={onClose} flex />
    </View>
  );
}
