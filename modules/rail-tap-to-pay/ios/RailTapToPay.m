#import "RailTapToPay.h"
#import <MultipeerConnectivity/MultipeerConnectivity.h>

@interface RailTapToPay () <MCSessionDelegate, MCNearbyServiceAdvertiserDelegate, MCNearbyServiceBrowserDelegate>
@property (nonatomic, strong) MCPeerID *peerID;
@property (nonatomic, strong) MCSession *session;
@property (nonatomic, strong) MCNearbyServiceAdvertiser *advertiser;
@property (nonatomic, strong) MCNearbyServiceBrowser *browser;
@property (nonatomic, strong) NSMutableDictionary<NSString *, MCPeerID *> *discoveredPeers;
@property (nonatomic, copy) NSString *myRailtag;
@property (nonatomic, copy) NSString *myDisplayName;
@property (nonatomic, assign) BOOL hasListeners;
@end

static NSString *const kServiceType = @"rail-pay";

@implementation RailTapToPay

RCT_EXPORT_MODULE();

- (instancetype)init {
  self = [super init];
  if (self) {
    _discoveredPeers = [NSMutableDictionary new];
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup { return NO; }

- (NSArray<NSString *> *)supportedEvents {
  return @[@"onPeerFound", @"onPeerLost", @"onTransferRequest", @"onTransferAccepted", @"onTransferDeclined", @"onError"];
}

- (void)startObserving { self.hasListeners = YES; }
- (void)stopObserving { self.hasListeners = NO; }

- (void)emit:(NSString *)name body:(NSDictionary *)body {
  if (self.hasListeners) {
    [self sendEventWithName:name body:body];
  }
}

// MARK: - JS API

RCT_EXPORT_METHOD(startDiscovery:(NSString *)railtag displayName:(NSString *)displayName) {
  [self stopDiscovery];
  self.myRailtag = railtag;
  self.myDisplayName = displayName;

  NSString *peerName = [NSString stringWithFormat:@"%@|%@", displayName, railtag];
  self.peerID = [[MCPeerID alloc] initWithDisplayName:peerName];
  self.session = [[MCSession alloc] initWithPeer:self.peerID securityIdentity:nil encryptionPreference:MCEncryptionRequired];
  self.session.delegate = self;

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
  [self.session disconnect];
  self.advertiser = nil;
  self.browser = nil;
  self.session = nil;
  [self.discoveredPeers removeAllObjects];
}

RCT_EXPORT_METHOD(sendTransferIntent:(NSString *)peerId amount:(NSString *)amount) {
  MCPeerID *peer = self.discoveredPeers[peerId];
  if (!peer) {
    [self emit:@"onError" body:@{@"message": @"Peer not found"}];
    return;
  }

  if (![self.session.connectedPeers containsObject:peer]) {
    [self.browser invitePeer:peer toSession:self.session withContext:nil timeout:10];
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
      [self doSendIntent:peerId amount:amount];
    });
  } else {
    [self doSendIntent:peerId amount:amount];
  }
}

- (void)doSendIntent:(NSString *)peerId amount:(NSString *)amount {
  MCPeerID *peer = self.discoveredPeers[peerId];
  if (!peer) return;
  NSDictionary *payload = @{
    @"type": @"transfer_request",
    @"amount": amount,
    @"senderRailtag": self.myRailtag ?: @"",
    @"senderName": self.myDisplayName ?: @"",
  };
  [self sendData:payload toPeer:peer];
}

RCT_EXPORT_METHOD(respondToTransfer:(NSString *)peerId accepted:(BOOL)accepted) {
  MCPeerID *peer = self.discoveredPeers[peerId];
  if (!peer) return;
  NSDictionary *payload = @{
    @"type": accepted ? @"transfer_accepted" : @"transfer_declined",
    @"responderRailtag": self.myRailtag ?: @"",
  };
  [self sendData:payload toPeer:peer];
}

// MARK: - Helpers

- (void)sendData:(NSDictionary *)dict toPeer:(MCPeerID *)peer {
  NSData *data = [NSJSONSerialization dataWithJSONObject:dict options:0 error:nil];
  if (!data || !self.session) return;
  [self.session sendData:data toPeers:@[peer] withMode:MCSessionSendDataReliable error:nil];
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
  self.discoveredPeers[peerID.displayName] = peerID;
  [self emit:@"onPeerFound" body:@{@"peerId": peerID.displayName, @"railtag": railtag, @"displayName": name}];
}

- (void)browser:(MCNearbyServiceBrowser *)browser lostPeer:(MCPeerID *)peerID {
  [self.discoveredPeers removeObjectForKey:peerID.displayName];
  [self emit:@"onPeerLost" body:@{@"peerId": peerID.displayName}];
}

- (void)browser:(MCNearbyServiceBrowser *)browser didNotStartBrowsingForPeers:(NSError *)error {
  [self emit:@"onError" body:@{@"message": error.localizedDescription ?: @"Browse failed"}];
}

// MARK: - MCNearbyServiceAdvertiserDelegate

- (void)advertiser:(MCNearbyServiceAdvertiser *)advertiser didReceiveInvitationFromPeer:(MCPeerID *)peerID withContext:(NSData *)context invitationHandler:(void (^)(BOOL, MCSession *))invitationHandler {
  invitationHandler(YES, self.session);
}

- (void)advertiser:(MCNearbyServiceAdvertiser *)advertiser didNotStartAdvertisingPeer:(NSError *)error {
  [self emit:@"onError" body:@{@"message": error.localizedDescription ?: @"Advertise failed"}];
}

// MARK: - MCSessionDelegate

- (void)session:(MCSession *)session peer:(MCPeerID *)peerID didChangeState:(MCSessionState)state {}
- (void)session:(MCSession *)session didReceiveData:(NSData *)data fromPeer:(MCPeerID *)peerID {
  NSDictionary *dict = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
  if (!dict || !dict[@"type"]) return;

  dispatch_async(dispatch_get_main_queue(), ^{
    NSString *type = dict[@"type"];
    if ([type isEqualToString:@"transfer_request"]) {
      [self emit:@"onTransferRequest" body:@{
        @"peerId": peerID.displayName,
        @"amount": dict[@"amount"] ?: @"0",
        @"senderName": dict[@"senderName"] ?: @"",
        @"senderRailtag": dict[@"senderRailtag"] ?: @"",
      }];
    } else if ([type isEqualToString:@"transfer_accepted"]) {
      [self emit:@"onTransferAccepted" body:@{
        @"peerId": peerID.displayName,
        @"responderRailtag": dict[@"responderRailtag"] ?: @"",
      }];
    } else if ([type isEqualToString:@"transfer_declined"]) {
      [self emit:@"onTransferDeclined" body:@{@"peerId": peerID.displayName}];
    }
  });
}
- (void)session:(MCSession *)session didReceiveStream:(NSInputStream *)stream withName:(NSString *)streamName fromPeer:(MCPeerID *)peerID {}
- (void)session:(MCSession *)session didStartReceivingResourceWithName:(NSString *)resourceName fromPeer:(MCPeerID *)peerID withProgress:(NSProgress *)progress {}
- (void)session:(MCSession *)session didFinishReceivingResourceWithName:(NSString *)resourceName fromPeer:(MCPeerID *)peerID atURL:(NSURL *)localURL withError:(NSError *)error {}

@end
