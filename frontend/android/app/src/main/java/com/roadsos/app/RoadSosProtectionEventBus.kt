package com.roadsos.app

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule

object RoadSosProtectionEventBus {
  var reactContext: ReactApplicationContext? = null

  fun emitCrashConfirmed(
    latitude: Double?,
    longitude: Double?,
    confidence: Double,
    reason: String
  ) {
    val params = Arguments.createMap()
    params.putDouble("confidence", confidence)
    params.putString("reason", reason)

    if (latitude != null) {
      params.putDouble("latitude", latitude)
    }

    if (longitude != null) {
      params.putDouble("longitude", longitude)
    }

    reactContext
      ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      ?.emit("RoadSosCrashConfirmed", params)
  }
}
