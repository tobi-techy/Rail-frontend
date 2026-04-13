#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RailTapToPay : RCTEventEmitter <RCTBridgeModule>
- (void)emitDistance:(NSString *)sessionID distance:(float)distance;
@end
