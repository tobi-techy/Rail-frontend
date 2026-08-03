import { useMutation } from '@tanstack/react-query';
import { chainrailsService } from '../services/chainrails.service';

export function useChainRailsSession() {
  return useMutation({
    mutationFn: (amount: string) => chainrailsService.createSession(amount),
  });
}
