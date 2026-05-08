import React, { useCallback } from 'react';
import { router } from 'expo-router';
import { AmbientMiriam } from '@/components/ai/AmbientMiriam';
import { useNudge } from '@/hooks/useNudge';
import type { NudgeAction } from '@/api/types/ai';

type Props = {
  screen: string;
  amount?: string;
  currency?: string;
  daysUntilPayday?: number;
  debounceMs?: number;
  enabled?: boolean;
  cooldownMs?: number;
  cooldownScope?: 'context' | 'screen';
  merchantHint?: string;
  recentActions?: string[];
};

export function AmbientMiriamNudge({
  screen,
  amount,
  currency,
  daysUntilPayday,
  debounceMs,
  enabled,
  cooldownMs,
  cooldownScope,
  merchantHint,
  recentActions,
}: Props) {
  const { nudge, dismiss } = useNudge(screen, amount, currency, {
    daysUntilPayday,
    debounceMs,
    enabled,
    cooldownMs,
    cooldownScope,
    merchantHint,
    recentActions,
  });

  const handleAction = useCallback(
    (action: NudgeAction) => {
      dismiss();
      switch (action.destination) {
        case 'stash':
          router.push('/investment-stash' as never);
          break;
        case 'spend':
          router.push('/spending-stash' as never);
          break;
        case 'budget':
        case 'goals':
          router.push('/ai-chat' as never);
          break;
        default:
          if (action.type === 'open_screen' && action.destination.startsWith('/')) {
            router.push(action.destination as never);
          } else {
            router.push('/ai-chat' as never);
          }
      }
    },
    [dismiss]
  );

  return <AmbientMiriam nudge={nudge} onDismiss={dismiss} onAction={handleAction} />;
}
