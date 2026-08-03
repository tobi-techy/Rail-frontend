package com.railmoney.rail.taptopay

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class RailTapToPayModule(
  reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = NAME

  @ReactMethod
  fun startDiscovery(railtag: String, displayName: String) {
    // Android nearby tap-to-pay is not implemented yet.
  }

  @ReactMethod
  fun stopDiscovery() {
    // Android nearby tap-to-pay is not implemented yet.
  }

  @ReactMethod
  fun sendTransferIntent(peerId: String, amount: String, nonce: String) {
    // Android nearby tap-to-pay is not implemented yet.
  }

  @ReactMethod
  fun respondToTransfer(peerId: String, accepted: Boolean, nonce: String) {
    // Android nearby tap-to-pay is not implemented yet.
  }

  @ReactMethod
  fun addListener(eventName: String) {
    // Required by NativeEventEmitter.
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Required by NativeEventEmitter.
  }

  companion object {
    const val NAME = "RailTapToPay"
  }
}
