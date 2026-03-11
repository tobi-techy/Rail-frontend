import { useMutation } from '@tanstack/react-query';
import { p2pService } from '../services/p2p.service';

export function useSetRailTag() {
  return useMutation({
    mutationFn: (railTag: string) => p2pService.setRailTag(railTag),
  });
}

export function useCheckRailTag() {
  return useMutation({
    mutationFn: (railTag: string) => p2pService.checkRailTag(railTag),
  });
}
