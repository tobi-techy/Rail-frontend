import type { ComponentType } from 'react';
import type { CanvasCard, UIDirective } from '@/api/types/ai';
import { RecommendationsCard } from './cards/RecommendationsCard';
import { MapPlacesCard } from './cards/MapPlacesCard';
import { ConfirmCard } from './cards/ConfirmCard';
import { InfoCard } from './cards/InfoCard';

export interface CanvasCardProps {
  directive: UIDirective;
  onClose: () => void;
}

/**
 * Card registry: `card` type → component. Adding a new card is one entry here,
 * no host changes. Unknown types fall back to InfoCard so nothing ever breaks.
 */
const registry: Partial<Record<CanvasCard, ComponentType<CanvasCardProps>>> = {
  places: MapPlacesCard,
  flights: RecommendationsCard,
  recommendations: RecommendationsCard,
  confirm: ConfirmCard,
  info: InfoCard,
};

export function canvasCardFor(card: CanvasCard): ComponentType<CanvasCardProps> {
  return registry[card] ?? InfoCard;
}
