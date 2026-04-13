import { useEffect, useCallback, useRef, useState } from 'react';
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const mod =
  Platform.OS === 'ios' || Platform.OS === 'android'
    ? NativeModules.RailTapToPay
    : null;
const emitter = mod ? new NativeEventEmitter(mod) : null;

export type NearbyPeer = {
  peerId: string;   // opaque session UUID — never user-controlled
  railtag: string;
  displayName: string;
};

export type TransferRequest = {
  peerId: string;
  amount: string;
  senderName: string;
  senderRailtag: string;
  nonce: string;  // server-issued nonce from sender's intent — must be echoed back
};

// nonce is the server-issued value echoed back by the recipient
export type TransferAcceptedEvent = {
  peerId: string;
  nonce: string;
};

export function useTapToPay(railtag: string, displayName: string) {
  const [peers, setPeers] = useState<NearbyPeer[]>([]);
  const [peerDistances, setPeerDistances] = useState<Record<string, number>>({});
  const [incomingRequest, setIncomingRequest] = useState<TransferRequest | null>(null);
  const [transferAccepted, setTransferAccepted] = useState<TransferAcceptedEvent | null>(null);
  const [transferDeclined, setTransferDeclined] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const peersRef = useRef<NearbyPeer[]>([]);
  const distancesRef = useRef<Record<string, number>>({});
  const distanceFlushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const railtagRef = useRef(railtag);
  const displayNameRef = useRef(displayName);
  railtagRef.current = railtag;
  displayNameRef.current = displayName;

  const start = useCallback(() => {
    if (!mod) return;
    mod.startDiscovery(railtagRef.current, displayNameRef.current);
    setIsActive(true);
  }, []);

  const stop = useCallback(() => {
    if (!mod) return;
    mod.stopDiscovery();
    setPeers([]);
    peersRef.current = [];
    distancesRef.current = {};
    setPeerDistances({});
    if (distanceFlushTimer.current) { clearTimeout(distanceFlushTimer.current); distanceFlushTimer.current = null; }
    setIsActive(false);
    setIncomingRequest(null);
    setTransferAccepted(null);
    setTransferDeclined(false);
  }, []);

  // nonce is the server-issued intent nonce — included in the MC payload
  const sendIntent = useCallback((peerId: string, amount: string, nonce: string) => {
    if (!mod) return;
    mod.sendTransferIntent(peerId, amount, nonce);
  }, []);

  // nonce must be echoed back so the sender can confirm with the server
  const respond = useCallback((peerId: string, accepted: boolean, nonce: string) => {
    if (!mod) return;
    mod.respondToTransfer(peerId, accepted, nonce);
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
        delete distancesRef.current[peerId];
        setPeerDistances({ ...distancesRef.current });
      }),
      emitter.addListener('onPeerDistance', ({ peerId, distance }: { peerId: string; distance: number }) => {
        distancesRef.current[peerId] = distance;
        // Throttle state updates to ~4fps to avoid excessive re-renders
        if (!distanceFlushTimer.current) {
          distanceFlushTimer.current = setTimeout(() => {
            setPeerDistances({ ...distancesRef.current });
            distanceFlushTimer.current = null;
          }, 250);
        }
      }),
      emitter.addListener('onTransferRequest', (req: TransferRequest) => {
        setIncomingRequest(req);
      }),
      emitter.addListener('onTransferAccepted', (evt: TransferAcceptedEvent) => {
        setTransferAccepted(evt);
      }),
      emitter.addListener('onTransferDeclined', () => {
        setTransferDeclined(true);
        setTimeout(() => setTransferDeclined(false), 3000);
      }),
    ];

    return () => {
      for (const sub of subs) sub.remove();
    };
  }, []);

  return {
    peers,
    peerDistances,
    incomingRequest,
    transferAccepted,
    transferDeclined,
    isActive,
    isSupported: !!mod,
    start,
    stop,
    sendIntent,
    respond,
  };
}
