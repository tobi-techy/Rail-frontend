import React from 'react';
import { View, Text } from 'react-native';

function formatDay(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msg = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today.getTime() - msg.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: diffDays > 365 ? 'numeric' : undefined,
  });
}

/**
 * Centred day label shown between messages from different calendar days,
 * exactly like iMessage's date separators.
 */
export function DateSeparator({ iso }: { iso: string }) {
  const label = formatDay(iso);
  if (!label) return null;
  return (
    <View className="my-3 items-center">
      <Text className="font-body text-[12px] text-ash">{label}</Text>
    </View>
  );
}

/**
 * Returns true when two ISO timestamps fall on different calendar days.
 * Safe when either value is undefined/empty.
 */
export function isDifferentDay(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return true;
  const da = new Date(a);
  const db = new Date(b);
  if (isNaN(da.getTime()) || isNaN(db.getTime())) return false;
  return da.toDateString() !== db.toDateString();
}
