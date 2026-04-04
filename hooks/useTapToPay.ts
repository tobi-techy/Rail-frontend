import { useEffect, useCallback, useRef, useState } from 'react';
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const mod = Platform.OS === 'ios' ? NativeModules.RailTapToPay : null;
const emitter = mod ? new NativeEventEmitter(mod) : null;

export type NearbyPeer = {
  peerId: string;
  railtag: string;
  displayName: string;
};

export type TransferRequest = {
  peerId: string;
  amount: string;
  senderName: string;
  senderRailtag: string;
};

export function useTapToPay(railtag: string, displayName: string) {
  const [peers, setPeers] = useState<NearbyPeer[]>([]);
  const [incomingRequest, setIncomingRequest] = useState<TransferRequest | null>(null);
  const [transferAccepted, setTransferAccepted] = useState<string | null>(null);
  const [transferDeclined, setTransferDeclined] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const peersRef = useRef<NearbyPeer[]>([]);

  const start = useCallback(() => {
    if (!mod) return;
    mod.startDiscovery(railtag, displayName);
    setIsActive(true);
  }, [railtag, displayName]);

  const stop = useCallback(() => {
    if (!mod) return;
    mod.stopDiscovery();
    setPeers([]);
    peersRef.current = [];
    setIsActive(false);
    setIncomingRequest(null);
    setTransferAccepted(null);
    setTransferDeclined(false);
  }, []);

  const sendIntent = useCallback((peerId: string, amount: string) => {
    if (!mod) return;
    mod.sendTransferIntent(peerId, amount);
  }, []);

  const respond = useCallback((peerId: string, accepted: boolean) => {
    if (!mod) return;
    mod.respondToTransfer(peerId, accepted);
    setIncomingRequest(null);
  }, []);

  useEffect(() => {
    if (!emitter) return;

    const subs = [
      emitter.addListener('onPeerFound', (peer: NearbyPeer) => {
        peersRef.current = [...peersRef.current.filter((p) => p.peerId !== peer.peerId), peer];
        setPeers([...peersRef.current]);
      }),
      emitter.addListener('onPeerLost', ({ peerId }: { peerId: string }) => {
        peersRef.current = peersRef.current.filter((p) => p.peerId !== peerId);
        setPeers([...peersRef.current]);
      }),
      emitter.addListener('onTransferRequest', (req: TransferRequest) => {
        setIncomingRequest(req);
      }),
      emitter.addListener(
        'onTransferAccepted',
        ({ responderRailtag }: { responderRailtag: string }) => {
          setTransferAccepted(responderRailtag);
        }
      ),
      emitter.addListener('onTransferDeclined', () => {
        setTransferDeclined(true);
        setTimeout(() => setTransferDeclined(false), 3000);
      }),
    ];

    return () => {
      for (const sub of subs) {
        sub.remove();
      }
    };
  }, []);

  return {
    peers,
    incomingRequest,
    transferAccepted,
    transferDeclined,
    isActive,
    isSupported: Platform.OS === 'ios' && !!mod,
    start,
    stop,
    sendIntent,
    respond,
  };
}
