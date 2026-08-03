import * as Crypto from 'expo-crypto';
import { aiService } from '@/api/services/ai.service';
import { presentCanvas } from '@/stores/miriamCanvasStore';
import type { UIDirective } from '@/api/types/ai';

interface WalletToken {
  symbol: string;
  balance: number;
  usdValue: number;
}

export interface MiriamClientToolDeps {
  tokens: WalletToken[];
  totalBalanceUSD: number;
  /** expo-router push */
  navigate: (screen: string) => void;
}

function buildFinancialContext(tokens: WalletToken[], totalBalanceUSD: number): string {
  const lines: string[] = [`Total: $${totalBalanceUSD.toFixed(2)}`];
  for (const t of tokens.slice(0, 5)) {
    if (t.balance > 0) lines.push(`${t.symbol}: $${t.usdValue.toFixed(2)}`);
  }
  return lines.join('. ');
}

/**
 * Single source of truth for Miriam's voice client tools, shared by the
 * full-screen voice mode and the ambient "Hey Miriam" background session so
 * both expose identical capabilities.
 */
export function buildMiriamClientTools(deps: MiriamClientToolDeps) {
  return {
    getBalance: async () => buildFinancialContext(deps.tokens, deps.totalBalanceUSD),

    navigateToScreen: async (params: { screen: string }) => {
      deps.navigate(params.screen);
      return `Navigated to ${params.screen}`;
    },

    // Search the web (places, flights, products…) and render a Canvas card.
    web_search: async (params: { query: string; category?: string }) => {
      try {
        const { result } = await aiService.executeVoiceTool({
          tool_name: 'web_search',
          parameters: params,
        });
        const r = (result ?? {}) as { display?: UIDirective; results?: { title?: string }[] };
        if (r.display) presentCanvas(r.display);
        const titles = (r.results ?? [])
          .map((x) => x.title)
          .filter(Boolean)
          .slice(0, 3)
          .join(', ');
        return titles
          ? `Showing options on screen: ${titles}.`
          : 'I put some options on the screen for you.';
      } catch {
        return 'I had trouble searching just now.';
      }
    },

    // Model-controlled (hybrid): surface a curated card directly.
    show_card: async (directive: UIDirective) => {
      if (directive?.card && directive?.title) {
        presentCanvas(directive);
        return 'Card shown.';
      }
      return 'Nothing to show.';
    },

    // Voice-confirm: stage a money action server-side, then show a confirm card
    // (with biometric). Money is NEVER moved from this tool — only on tap-confirm.
    show_confirm: async (raw: Record<string, unknown>) => {
      const action = String(raw?.action ?? '');
      if (!action) return 'I need to know what to confirm.';
      const nested = (raw?.params as Record<string, unknown>) ?? null;
      const { action: _omit, params: _omit2, ...rest } = raw ?? {};
      const params = nested ?? rest;
      try {
        const conversationId = Crypto.randomUUID();
        const res = await aiService.prepareVoiceAction({
          conversation_id: conversationId,
          action,
          params,
        });
        if (res.error || !res.pending_action) {
          return res.error || "I couldn't prepare that. Try the app.";
        }
        presentCanvas({
          card: 'confirm',
          intent: 'confirm_action',
          title: res.pending_action.description || 'Confirm this action',
          action_id: res.conversation_id ?? conversationId,
          data: { pending_action: res.pending_action },
        });
        return 'I put it on screen — tap to confirm.';
      } catch {
        return "I couldn't prepare that right now.";
      }
    },
  };
}
