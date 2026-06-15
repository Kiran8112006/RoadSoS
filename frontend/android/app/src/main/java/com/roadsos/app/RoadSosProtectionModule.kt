package com.roadsos.app

import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class RoadSosProtectionModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "RoadSosProtection"

  @ReactMethod
  fun startProtection(promise: Promise) {
    android.util.Log.d("RoadSoSProtection", "startProtection called")
    try {
      val intent = Intent(
        reactContext,
        RoadSosProtectionService::class.java
      ).apply {
        action = RoadSosProtectionService.ACTION_START
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        reactContext.startForegroundService(intent)
      } else {
        reactContext.startService(intent)
      }

      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("ROADSOS_START_FAILED", error)
    }
  }

  @ReactMethod
  fun stopProtection(promise: Promise) {
    try {
      val intent = Intent(
        reactContext,
        RoadSosProtectionService::class.java
      ).apply {
        action = RoadSosProtectionService.ACTION_STOP
      }

      reactContext.startService(intent)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("ROADSOS_STOP_FAILED", error)
    }
  }

  @ReactMethod
  fun markSafeAndResume(promise: Promise) {
    try {
      val intent = Intent(
        reactContext,
        RoadSosProtectionService::class.java
      ).apply {
        action = RoadSosProtectionService.ACTION_SAFE
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        reactContext.startForegroundService(intent)
      } else {
        reactContext.startService(intent)
      }

      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("ROADSOS_SAFE_FAILED", error)
    }
  }

  @ReactMethod
  fun addListener(eventName: String) = Unit

  @ReactMethod
  fun removeListeners(count: Int) = Unit
}
