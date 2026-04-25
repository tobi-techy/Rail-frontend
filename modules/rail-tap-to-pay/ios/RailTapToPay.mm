#import "RailTapToPay.h"
#import <MultipeerConnectivity/MultipeerConnectivity.h>
#import <NearbyInteraction/NearbyInteraction.h>

// ── UWB session wrapper ────────────────────────────────────────────────────────

API_AVAILABLE(ios(16.0))
@interface RailNISessionWrapper : NSObject <NISessionDelegate>
@property (nonatomic, strong) NISession *niSession;
@property (nonatomic, copy) NSString *sessionID;  // opaque UUID for JS
@property (nonatomic, weak) RailTapToPay *owner;
@end

@implementation RailNISessionWrapper

- (instancetype)initWithSessionID:(NSString *)sid owner:(RailTapToPay *)owner {
  self = [super init];
  if (self) {
    _sessionID = sid;
    _owner = owner;
    _niSession = [[NISession alloc] init];
    _niSession.delegate = self;
  }
  return self;
}

- (void)runWithToken:(NIDiscoveryToken *)peerToken {
  NINearbyPeerConfiguration *config = [[NINearbyPeerConfiguration alloc] initWithPeerToken:peerToken];
  [self.niSession runWithConfiguration:config];
}

- (void)session:(NISession *)session didUpdateNearbyObjects:(NSArray<__kindof NINearbyObject *> *)objects {
  for (NINearbyObject *obj in objects) {
    if (obj.distance >= 0) {
      [self.owner emitDistance:self.sessionID distance:obj.distance];
    }
  }
}

- (void)session:(NISession *)session didRemoveNearbyObjects:(NSArray<__kindof NINearbyObject *> *)objects withReason:(NINearbyObjectRemovalReason)reason {}
- (void)sessionWasSuspended:(NISession *)session {}
- (void)sessionSuspensionEnded:(NISession *)session {
  // Re-run will happen on next token exchange
}
- (void)session:(NISession *)session didInvalidateWithError:(NSError *)error {}

@end

// ── Main module ────────────────────────────────────────────────────────────────

@interface RailTapToPay () <MCSessionDelegate, MCNearbyServiceAdvertiserDelegate, MCNearbyServiceBrowserDelegate>
@property (nonatomic, strong) MCPeerID *peerID;
@property (nonatomic, strong) MCSession *mcSession;
@property (nonatomic, strong) MCNearbyServiceAdvertiser *advertiser;
@property (nonatomic, strong) MCNearbyServiceBrowser *browser;
@property (nonatomic, strong) NSMutableDictionary<NSString *, MCPeerID *> *discoveredPeers;
@property (nonatomic, strong) NSMutableDictionary<NSString *, NSString *> *peerDisplayNameToSessionID;
@property (nonatomic, strong) NSMutableArray<NSDictionary *> *pendingMessages;
@property (nonatomic, copy) NSString *myRailtag;
@property (nonatomic, copy) NSString *myDisplayName;
@property (nonatomic, assign) BOOL hasListeners;
// UWB
@property (nonatomic, strong) NSMutableDictionary<NSString *, id> *niSessions; // sessionID → RailNISessionWrapper
@end

static NSString *const kServiceType = @"rail-pay";

@implementation RailTapToPay

RCT_EXPORT_MODULE();

- (instancetype)init {
  self = [super init];
  if (self) {
    _discoveredPeers = [NSMutableDictionary new];
    _peerDisplayNameToSessionID = [NSMutableDictionary new];
    _pendingMessages = [NSMutableArray new];
    _niSessions = [NSMutableDictionary new];
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup { return NO; }

- (NSArray<NSString *> *)supportedEvents {
  return @[@"onPeerFound", @"onPeerLost", @"onTransferRequest", @"onTransferAccepted", @"onTransferDeclined", @"onPeerDistance", @"onError"];
}

- (void)startObserving { self.hasListeners = YES; }
- (void)stopObserving { self.hasListeners = NO; }

- (void)emit:(NSString *)name body:(NSDictionary *)body {
  if (self.hasListeners) [self sendEventWithName:name body:body];
}

- (void)emitDistance:(NSString *)sessionID distance:(float)distance {
  [self emit:@"onPeerDistance" body:@{@"peerId": sessionID, @"distance": @(distance)}];
}

// MARK: - UWB helpers

- (BOOL)uwbAvailable {
  if (@available(iOS 16.0, *)) {
    return NISession.deviceCapabilities.supportsPreciseDistanceMeasurement;
  }
  return NO;
}

- (void)startNISessionForPeer:(NSString *)sessionID mcPeer:(MCPeerID *)mcPeer {
  if (![self uwbAvailable]) return;
  if (@available(iOS 16.0, *)) {
    // Tear down any existing session for this peer (e.g. on MC reconnect)
    [self teardownNISession:sessionID];
    RailNISessionWrapper *wrapper = [[RailNISessionWrapper alloc] initWithSessionID:sessionID owner:self];
    self.niSessions[sessionID] = wrapper;
    // Send our NI discovery token to the peer over MC
    NSData *tokenData = [NSKeyedArchiver archivedDataWithRootObject:wrapper.niSession.discoveryToken
                                              requiringSecureCoding:YES error:nil];
    if (!tokenData) return;
    NSDictionary *msg = @{@"type": @"ni_token", @"token": [tokenData base64EncodedStringWithOptions:0]};
    [self sendData:msg toPeer:mcPeer];
  }
}

- (void)handleNIToken:(NSString *)base64Token fromSessionID:(NSString *)sessionID {
  if (@available(iOS 16.0, *)) {
    RailNISessionWrapper *wrapper = self.niSessions[sessionID];
    if (!wrapper) {
      // We received a token before creating our own session — create one now
      MCPeerID *mcPeer = self.discoveredPeers[sessionID];
      if (!mcPeer) return;
      [self startNISessionForPeer:sessionID mcPeer:mcPeer];
      wrapper = self.niSessions[sessionID];
      if (!wrapper) return;
    }
    NSData *tokenData = [[NSData alloc] initWithBase64EncodedString:base64Token options:0];
    if (!tokenData) return;
    NIDiscoveryToken *peerToken = [NSKeyedUnarchiver unarchivedObjectOfClass:[NIDiscoveryToken class]
                                                                    fromData:tokenData error:nil];
    if (peerToken) [wrapper runWithToken:peerToken];
  }
}

- (void)teardownNISession:(NSString *)sessionID {
  if (@available(iOS 16.0, *)) {
    RailNISessionWrapper *wrapper = self.niSessions[sessionID];
    if (wrapper) {
      [wrapper.niSession invalidate];
      [self.niSessions removeObjectForKey:sessionID];
    }
  }
}

// MARK: - JS API

RCT_EXPORT_METHOD(startDiscovery:(NSString *)railtag displayName:(NSString *)displayName) {
  [self stopDiscovery];
  self.myRailtag = railtag;
  self.myDisplayName = displayName;

  NSString *peerName = [NSString stringWithFormat:@"%@|%@", displayName, railtag];
  self.peerID = [[MCPeerID alloc] initWithDisplayName:peerName];
  self.mcSession = [[MCSession alloc] initWithPeer:self.peerID securityIdentity:nil encryptionPreference:MCEncryptionRequired];
  self.mcSession.delegate = self;

  NSDictionary *info = @{@"railtag": railtag, @"name": displayName};
  self.advertiser = [[MCNearbyServiceAdvertiser alloc] initWithPeer:self.peerID discoveryInfo:info serviceType:kServiceType];
  self.advertiser.delegate = self;
  [self.advertiser startAdvertisingPeer];

  self.browser = [[MCNearbyServiceBrowser alloc] initWithPeer:self.peerID serviceType:kServiceType];
  self.browser.delegate = self;
  [self.browser startBrowsingForPeers];
}

RCT_EXPORT_METHOD(stopDiscovery) {
  [self.advertiser stopAdvertisingPeer];
  [self.browser stopBrowsingForPeers];
  [self.mcSession disconnect];
  self.advertiser = nil;
  self.browser = nil;
  self.mcSession = nil;
  [self.discoveredPeers removeAllObjects];
  [self.peerDisplayNameToSessionID removeAllObjects];
  [self.pendingMessages removeAllObjects];
  // Tear down all NI sessions
  for (NSString *sid in self.niSessions.allKeys) [self teardownNISession:sid];
}

RCT_EXPORT_METHOD(sendTransferIntent:(NSString *)peerId amount:(NSString *)amount nonce:(NSString *)nonce) {
  MCPeerID *peer = self.discoveredPeers[peerId];
  if (!peer) {
    [self emit:@"onError" body:@{@"message": @"Peer not found"}];
    return;
  }
  NSDictionary *payload = @{
    @"type": @"transfer_request", @"amount": amount,
    @"nonce": nonce ?: @"", @"senderRailtag": self.myRailtag ?: @"", @"senderName": self.myDisplayName ?: @"",
  };
  if ([self.mcSession.connectedPeers containsObject:peer]) {
    [self sendData:payload toPeer:peer];
  } else {
    @synchronized (self.pendingMessages) {
      [self.pendingMessages addObject:@{@"payload": payload, @"peerId": peerId}];
    }
    [self.browser invitePeer:peer toSession:self.mcSession withContext:nil timeout:10];
  }
}

RCT_EXPORT_METHOD(respondToTransfer:(NSString *)peerId accepted:(BOOL)accepted nonce:(NSString *)nonce) {
  MCPeerID *peer = self.discoveredPeers[peerId];
  if (!peer) return;
  NSDictionary *payload = accepted
    ? @{@"type": @"transfer_accepted", @"nonce": nonce ?: @""}
    : @{@"type": @"transfer_declined"};
  if ([self.mcSession.connectedPeers containsObject:peer]) {
    [self sendData:payload toPeer:peer];
  } else {
    @synchronized (self.pendingMessages) {
      [self.pendingMessages addObject:@{@"payload": payload, @"peerId": peerId}];
    }
    [self.browser invitePeer:peer toSession:self.mcSession withContext:nil timeout:10];
  }
}

// MARK: - Helpers

- (void)sendData:(NSDictionary *)dict toPeer:(MCPeerID *)peer {
  NSData *data = [NSJSONSerialization dataWithJSONObject:dict options:0 error:nil];
  if (!data || !self.mcSession) return;
  NSError *err = nil;
  [self.mcSession sendData:data toPeers:@[peer] withMode:MCSessionSendDataReliable error:&err];
  if (err) [self emit:@"onError" body:@{@"message": err.localizedDescription ?: @"Send failed"}];
}

- (void)flushPendingForPeer:(MCPeerID *)peer {
  @synchronized (self.pendingMessages) {
    NSMutableArray *toRemove = [NSMutableArray new];
    for (NSDictionary *msg in self.pendingMessages) {
      MCPeerID *target = self.discoveredPeers[msg[@"peerId"]];
      if (target && [target isEqual:peer]) {
        [self sendData:msg[@"payload"] toPeer:peer];
        [toRemove addObject:msg];
      }
    }
    [self.pendingMessages removeObjectsInArray:toRemove];
  }
}

- (void)parseInfo:(MCPeerID *)peer info:(NSDictionary *)info railtag:(NSString **)railtag name:(NSString **)name {
  *railtag = info[@"railtag"] ?: [[peer.displayName componentsSeparatedByString:@"|"] lastObject] ?: @"";
  *name = info[@"name"] ?: [[peer.displayName componentsSeparatedByString:@"|"] firstObject] ?: @"";
}

// MARK: - MCNearbyServiceBrowserDelegate

- (void)browser:(MCNearbyServiceBrowser *)browser foundPeer:(MCPeerID *)peerID withDiscoveryInfo:(NSDictionary<NSString *,NSString *> *)info {
  if ([peerID isEqual:self.peerID]) return;
  NSString *railtag, *name;
  [self parseInfo:peerID info:info railtag:&railtag name:&name];

  NSString *sessionID = [[NSUUID UUID] UUIDString];
  self.discoveredPeers[sessionID] = peerID;
  self.peerDisplayNameToSessionID[peerID.displayName] = sessionID;

  [self emit:@"onPeerFound" body:@{@"peerId": sessionID, @"railtag": railtag, @"displayName": name}];
}

- (void)browser:(MCNearbyServiceBrowser *)browser lostPeer:(MCPeerID *)peerID {
  NSString *sessionID = self.peerDisplayNameToSessionID[peerID.displayName];
  if (sessionID) {
    [self teardownNISession:sessionID];
    [self.discoveredPeers removeObjectForKey:sessionID];
    [self.peerDisplayNameToSessionID removeObjectForKey:peerID.displayName];
    [self emit:@"onPeerLost" body:@{@"peerId": sessionID}];
  }
}

- (void)browser:(MCNearbyServiceBrowser *)browser didNotStartBrowsingForPeers:(NSError *)error {
  [self emit:@"onError" body:@{@"message": error.localizedDescription ?: @"Browse failed"}];
}

// MARK: - MCNearbyServiceAdvertiserDelegate

- (void)advertiser:(MCNearbyServiceAdvertiser *)advertiser didReceiveInvitationFromPeer:(MCPeerID *)peerID withContext:(NSData *)context invitationHandler:(void (^)(BOOL, MCSession *))invitationHandler {
  invitationHandler(YES, self.mcSession);
}

- (void)advertiser:(MCNearbyServiceAdvertiser *)advertiser didNotStartAdvertisingPeer:(NSError *)error {
  [self emit:@"onError" body:@{@"message": error.localizedDescription ?: @"Advertise failed"}];
}

// MARK: - MCSessionDelegate

- (void)session:(MCSession *)session peer:(MCPeerID *)peerID didChangeState:(MCSessionState)state {
  if (state == MCSessionStateConnected) {
    [self flushPendingForPeer:peerID];
    // Start UWB session once MC is connected
    NSString *sessionID = self.peerDisplayNameToSessionID[peerID.displayName];
    if (sessionID) [self startNISessionForPeer:sessionID mcPeer:peerID];
  } else if (state == MCSessionStateNotConnected) {
    NSString *sessionID = self.peerDisplayNameToSessionID[peerID.displayName];
    if (sessionID) [self teardownNISession:sessionID];
    @synchronized (self.pendingMessages) {
      NSMutableArray *toRemove = [NSMutableArray new];
      for (NSDictionary *msg in self.pendingMessages) {
        MCPeerID *target = self.discoveredPeers[msg[@"peerId"]];
        if (target && [target isEqual:peerID]) [toRemove addObject:msg];
      }
      if (toRemove.count > 0) {
        [self.pendingMessages removeObjectsInArray:toRemove];
        [self emit:@"onError" body:@{@"message": @"Peer disconnected before message could be sent"}];
      }
    }
  }
}

- (void)session:(MCSession *)session didReceiveData:(NSData *)data fromPeer:(MCPeerID *)peerID {
  NSDictionary *dict = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
  if (!dict || !dict[@"type"]) return;

  NSString *sessionID = self.peerDisplayNameToSessionID[peerID.displayName] ?: peerID.displayName;

  // Handle NI token exchange (not forwarded to JS)
  if ([dict[@"type"] isEqualToString:@"ni_token"]) {
    [self handleNIToken:dict[@"token"] fromSessionID:sessionID];
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    NSString *type = dict[@"type"];
    if ([type isEqualToString:@"transfer_request"]) {
      [self emit:@"onTransferRequest" body:@{
        @"peerId": sessionID,
        @"amount": dict[@"amount"] ?: @"0",
        @"nonce": dict[@"nonce"] ?: @"",
        @"senderName": dict[@"senderName"] ?: @"",
        @"senderRailtag": dict[@"senderRailtag"] ?: @"",
      }];
    } else if ([type isEqualToString:@"transfer_accepted"]) {
      [self emit:@"onTransferAccepted" body:@{
        @"peerId": sessionID, @"nonce": dict[@"nonce"] ?: @"",
      }];
    } else if ([type isEqualToString:@"transfer_declined"]) {
      [self emit:@"onTransferDeclined" body:@{@"peerId": sessionID}];
    }
  });
}

- (void)session:(MCSession *)session didReceiveStream:(NSInputStream *)stream withName:(NSString *)streamName fromPeer:(MCPeerID *)peerID {}
- (void)session:(MCSession *)session didStartReceivingResourceWithName:(NSString *)resourceName fromPeer:(MCPeerID *)peerID withProgress:(NSProgress *)progress {}
- (void)session:(MCSession *)session didFinishReceivingResourceWithName:(NSString *)resourceName fromPeer:(MCPeerID *)peerID atURL:(NSURL *)localURL withError:(NSError *)error {}

@end
